import * as vscode from 'vscode';
import type { Logger } from '../lib/logger.js';
import { GITHUB_COPILOT_TOKEN_SECRET_KEY } from '../providers/github-copilot.js';
import { updateGitHubCopilotProviderEnabled } from '../settings/index.js';
import type { LocalEventStore } from '../store/persistence.js';
import { exportCsv } from './csv-export.js';
import { runDoctor } from './doctor.js';
import type { AIMeterStatusBar } from './status-bar.js';
import type { AIMeterDashboardProvider } from './webview/panel.js';

export function registerCommands(options: {
  context: vscode.ExtensionContext;
  logger: Logger;
  store: LocalEventStore;
  statusBar: AIMeterStatusBar;
  dashboardProvider: AIMeterDashboardProvider;
  scanUsageLogs: () => Promise<void>;
  importProviderUsage: () => Promise<void>;
}): void {
  options.context.subscriptions.push(
    vscode.commands.registerCommand('aimeter.openDashboard', () => {
      void vscode.commands.executeCommand('workbench.view.extension.aimeter');
    }),
    vscode.commands.registerCommand('aimeter.refresh', async () => {
      await options.scanUsageLogs();
      await options.importProviderUsage();
      await options.statusBar.refresh();
      await options.dashboardProvider.refresh();
    }),
    vscode.commands.registerCommand('aimeter.openLogs', () => {
      options.logger.show();
    }),
    vscode.commands.registerCommand('aimeter.clearData', async () => {
      const answer = await vscode.window.showWarningMessage(
        'Clear all locally stored AI Meter events?',
        { modal: true },
        'Clear data',
      );
      if (answer === 'Clear data') {
        await options.store.clear();
        await options.scanUsageLogs();
        await options.importProviderUsage();
        await options.statusBar.refresh();
        await options.dashboardProvider.refresh();
      }
    }),
    vscode.commands.registerCommand('aimeter.exportCsv', async () => {
      await exportCsv(options.store);
    }),
    vscode.commands.registerCommand('aimeter.runDoctor', async () => {
      const result = await runDoctor({ logger: options.logger, store: options.store, secrets: options.context.secrets });
      await vscode.commands.executeCommand('workbench.view.extension.aimeter');
      await options.dashboardProvider.showDoctor(result);
    }),
    vscode.commands.registerCommand('aimeter.connectGitHubCopilot', async () => {
      const existingToken = await options.context.secrets.get(GITHUB_COPILOT_TOKEN_SECRET_KEY);

      if (existingToken !== undefined && existingToken.trim().length > 0) {
        // Token already stored — offer to import now or replace it
        const action = await vscode.window.showQuickPick(
          [
            { label: '$(sync) Import Copilot usage now', id: 'import' },
            { label: '$(key) Replace stored PAT', id: 'replace' },
            { label: '$(x) Disconnect Copilot', id: 'disconnect' },
          ],
          { title: 'GitHub Copilot — already connected', placeHolder: 'What would you like to do?' },
        );
        if (action === undefined) return;
        if (action.id === 'import') {
          await options.importProviderUsage();
          await options.statusBar.refresh();
          await options.dashboardProvider.refresh();
          return;
        }
        if (action.id === 'disconnect') {
          await options.context.secrets.delete(GITHUB_COPILOT_TOKEN_SECRET_KEY);
          await updateGitHubCopilotProviderEnabled(false);
          void vscode.window.showInformationMessage('GitHub Copilot usage import is disconnected.');
          return;
        }
        // fall through to 'replace'
      }

      const token = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        password: true,
        placeHolder: 'github_pat_... or ghp_...',
        prompt:
          'Required: a GitHub PAT with the "copilot" scope. AI Meter stores the token in VS Code SecretStorage only — never in settings or logs.',
        title: 'Connect GitHub Copilot Usage',
        validateInput: (value) => (value.trim().length === 0 ? 'Token is required.' : undefined),
      });
      if (token === undefined) {
        return;
      }

      await options.context.secrets.store(GITHUB_COPILOT_TOKEN_SECRET_KEY, token.trim());
      await updateGitHubCopilotProviderEnabled(true);
      await options.importProviderUsage();
      await options.statusBar.refresh();
      await options.dashboardProvider.refresh();
      void vscode.window.showInformationMessage(
        'GitHub Copilot usage import is connected. The token is stored in VS Code SecretStorage, not AI Meter settings.',
      );
    }),
    vscode.commands.registerCommand('aimeter.disconnectGitHubCopilot', async () => {
      await options.context.secrets.delete(GITHUB_COPILOT_TOKEN_SECRET_KEY);
      await updateGitHubCopilotProviderEnabled(false);
      void vscode.window.showInformationMessage('GitHub Copilot usage import is disconnected.');
    }),
  );
}
