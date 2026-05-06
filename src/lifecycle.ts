import * as vscode from 'vscode';
import { Logger } from './lib/logger.js';
import type { JsonlParser } from './parsers/base.js';
import { ClaudeCodeParser } from './parsers/claude-code.js';
import { CodexCliParser } from './parsers/codex-cli.js';
import { GeminiCliParser } from './parsers/gemini-cli.js';
import { GitHubCopilotUsageImporter } from './providers/github-copilot.js';
import { readSettings } from './settings/index.js';
import { LocalEventStore } from './store/persistence.js';
import { registerCommands } from './ui/commands.js';
import { DailyMirror } from './ui/mirror.js';
import { AIMeterStatusBar } from './ui/status-bar.js';
import { AIMeterDashboardProvider } from './ui/webview/panel.js';
import { UsageWatcher } from './watcher/index.js';
import {
  resolveClaudeCodePaths,
  resolveCodexCliPaths,
  resolveGeminiCliPaths,
} from './watcher/path-resolver.js';

export const DISCLAIMER_ACKNOWLEDGED_KEY = 'aimeter.disclaimerAcknowledged.v1';
export const DISCLAIMER_URL = 'https://github.com/INFOCDOTONE/aimeter/blob/main/DISCLAIMER.md';
export const PRIVACY_URL = 'https://github.com/INFOCDOTONE/aimeter/blob/main/PRIVACY.md';

export async function startAIMeter(context: vscode.ExtensionContext): Promise<void> {
  const output = vscode.window.createOutputChannel('AI Meter');
  const logger = new Logger(output);
  void showFirstRunBannerIfNeeded(context);
  const settings = readSettings();
  const store = new LocalEventStore(context.globalStorageUri.fsPath, settings.pricing.overrides);
  await store.init();

  const statusBar = new AIMeterStatusBar(store);
  statusBar.showNoData();
  const dashboardProvider = new AIMeterDashboardProvider({
    extensionUri: context.extensionUri,
    logger,
    store,
  });
  const githubCopilotImporter = new GitHubCopilotUsageImporter({
    secrets: context.secrets,
    store,
    logger,
    enabled: settings.providers.githubCopilot.enabled,
  });
  const usageWatchers: UsageWatcher[] = [];

  const importProviderUsage = async (): Promise<void> => {
    const latestSettings = readSettings();
    githubCopilotImporter.setEnabled(latestSettings.providers.githubCopilot.enabled);
    const result = await githubCopilotImporter.importUsage();
    if (result.eventsAppended > 0) {
      await statusBar.refresh();
      await dashboardProvider.refresh();
    }
    if (result.status === 'error') {
      logger.warn('github-copilot', result.message, {
        status: result.status,
        recordsSeen: result.recordsSeen,
        eventsAppended: result.eventsAppended,
      });
      void vscode.window.showWarningMessage(
        `AI Meter: GitHub Copilot import failed — ${result.message} Check Output › AI Meter for details.`,
      );
    } else if (result.status !== 'disabled' && result.status !== 'no-new-data') {
      logger.info('github-copilot', result.message, {
        status: result.status,
        recordsSeen: result.recordsSeen,
        eventsAppended: result.eventsAppended,
      });
    }
  };

  registerCommands({
    context,
    logger,
    store,
    statusBar,
    dashboardProvider,
    scanUsageLogs: async () => {
      for (const watcher of usageWatchers) {
        await watcher.scanNow();
      }
    },
    importProviderUsage,
  });
  context.subscriptions.push(statusBar);
  context.subscriptions.push(output);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AIMeterDashboardProvider.viewType,
      dashboardProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  const enabledParsers: Array<{ enabled: boolean; paths: string[]; parser: JsonlParser }> = [
    {
      enabled: settings.parsers.claudeCode.enabled,
      paths: resolveClaudeCodePaths(settings.parsers.claudeCode.paths),
      parser: new ClaudeCodeParser(),
    },
    {
      enabled: settings.parsers.codexCli.enabled,
      paths: resolveCodexCliPaths(settings.parsers.codexCli.paths),
      parser: new CodexCliParser(),
    },
    {
      enabled: settings.parsers.geminiCli.enabled,
      paths: resolveGeminiCliPaths(settings.parsers.geminiCli.paths),
      parser: new GeminiCliParser(),
    },
  ];

  const mirrorDir = settings.mirror.dir.trim().length > 0 ? settings.mirror.dir.trim() : DailyMirror.defaultDir();
  const mirror = new DailyMirror({ mirrorDir, logger, billingOverrides: settings.billing });
  if (settings.mirror.enabled) {
    void mirror.init(store);
  }

  for (const parserConfig of enabledParsers.filter((config) => config.enabled)) {
    const watcher = new UsageWatcher({
      paths: parserConfig.paths,
      parser: parserConfig.parser,
      store,
      logger,
      onEvents: async (events) => {
        const appended = await store.appendParsedEvents(events);
        if (appended.length > 0) {
          await statusBar.refresh();
          await dashboardProvider.refresh();
          if (settings.mirror.enabled) {
            void mirror.appendEvents(appended);
          }
        }
      },
    });
    usageWatchers.push(watcher);
    watcher.start();
    context.subscriptions.push({
      dispose: () => {
        void watcher.stop();
      },
    });
  }

  void importProviderUsage();

  logger.info('lifecycle', 'AI Meter activated');
}

export async function showFirstRunBannerIfNeeded(
  context: Pick<vscode.ExtensionContext, 'globalState'>,
): Promise<void> {
  const acknowledged = context.globalState.get(DISCLAIMER_ACKNOWLEDGED_KEY);
  if (acknowledged !== undefined) {
    return;
  }

  const message = [
    'INFOC ONE AI Meter is a pilot release.',
    'All cost figures are best-effort estimates from API rates, not actual bills.',
    'Provider plans (for example Pro, Max, enterprise, bundles, or credits) can make billed amounts differ.',
    'The extension is provided "as is" with no warranty.',
  ].join(' ');

  const choice = await vscode.window.showInformationMessage(
    message,
    { modal: false },
    'I understand',
    'Read full disclaimer',
    'Privacy policy',
  );

  if (choice === 'Read full disclaimer') {
    await vscode.env.openExternal(vscode.Uri.parse(DISCLAIMER_URL));
    return;
  }

  if (choice === 'Privacy policy') {
    await vscode.env.openExternal(vscode.Uri.parse(PRIVACY_URL));
    return;
  }

  if (choice === 'I understand') {
    await context.globalState.update(DISCLAIMER_ACKNOWLEDGED_KEY, {
      version: 'v0.1.0',
      acknowledgedAt: new Date().toISOString(),
    });
  }
}
