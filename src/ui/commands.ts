import * as vscode from 'vscode';
import type { Logger } from '../lib/logger.js';
import type { LocalEventStore } from '../store/persistence.js';
import type { AIMeterStatusBar } from './status-bar.js';

export function registerCommands(options: {
  context: vscode.ExtensionContext;
  logger: Logger;
  store: LocalEventStore;
  statusBar: AIMeterStatusBar;
}): void {
  options.context.subscriptions.push(
    vscode.commands.registerCommand('aimeter.openDashboard', () => {
      void vscode.commands.executeCommand('workbench.view.extension.aimeter');
    }),
    vscode.commands.registerCommand('aimeter.refresh', async () => {
      await options.statusBar.refresh();
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
        options.statusBar.showNoData();
      }
    }),
    vscode.commands.registerCommand('aimeter.exportCsv', () => {
      void vscode.window.showInformationMessage('AIMeter CSV export arrives in Milestone 3.');
    }),
    vscode.commands.registerCommand('aimeter.runDoctor', () => {
      void vscode.window.showInformationMessage('AIMeter doctor arrives in Milestone 3.');
    }),
  );
}
