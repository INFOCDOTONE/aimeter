import * as vscode from 'vscode';
import { Logger } from './lib/logger.js';
import type { JsonlParser } from './parsers/base.js';
import { ClaudeCodeParser } from './parsers/claude-code.js';
import { CodexCliParser } from './parsers/codex-cli.js';
import { GeminiCliParser } from './parsers/gemini-cli.js';
import { readSettings } from './settings/index.js';
import { LocalEventStore } from './store/persistence.js';
import { registerCommands } from './ui/commands.js';
import { AIMeterStatusBar } from './ui/status-bar.js';
import { AIMeterDashboardProvider } from './ui/webview/panel.js';
import { UsageWatcher } from './watcher/index.js';
import {
  resolveClaudeCodePaths,
  resolveCodexCliPaths,
  resolveGeminiCliPaths,
} from './watcher/path-resolver.js';

export async function startAIMeter(context: vscode.ExtensionContext): Promise<void> {
  const output = vscode.window.createOutputChannel('AIMeter');
  const logger = new Logger(output);
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

  registerCommands({ context, logger, store, statusBar, dashboardProvider });
  context.subscriptions.push(statusBar);
  context.subscriptions.push(output);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AIMeterDashboardProvider.viewType,
      dashboardProvider,
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
        }
      },
    });
    watcher.start();
    context.subscriptions.push({
      dispose: () => {
        void watcher.stop();
      },
    });
  }

  logger.info('lifecycle', 'AIMeter activated');
}
