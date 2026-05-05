import * as vscode from 'vscode';
import type { Logger } from '../lib/logger.js';
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
}): void {
  options.context.subscriptions.push(
    vscode.commands.registerCommand('aimeter.openDashboard', () => {
      void vscode.commands.executeCommand('workbench.view.extension.aimeter');
    }),
    vscode.commands.registerCommand('aimeter.refresh', async () => {
      await options.scanUsageLogs();
      await options.statusBar.refresh();
      await options.dashboardProvider.refresh();
    }),
    vscode.commands.registerCommand('aimeter.openLogs', () => {
      options.logger.show();
    }),
    vscode.commands.registerCommand('aimeter.clearData', async () => {
      const answer = await vscode.window.showWarningMessage(
        'Clear all locally stored AIMeter events?',
        { modal: true },
        'Clear data',
      );
      if (answer === 'Clear data') {
        await options.store.clear();
        await options.scanUsageLogs();
        await options.statusBar.refresh();
        await options.dashboardProvider.refresh();
      }
    }),
    vscode.commands.registerCommand('aimeter.exportCsv', async () => {
      await exportCsv(options.store);
    }),
    vscode.commands.registerCommand('aimeter.runDoctor', async () => {
      const result = await runDoctor({ logger: options.logger, store: options.store });
      await vscode.commands.executeCommand('workbench.view.extension.aimeter');
      await options.dashboardProvider.showDoctor(result);
    }),
  );
}
