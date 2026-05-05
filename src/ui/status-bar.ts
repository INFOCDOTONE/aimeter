import * as vscode from 'vscode';
import { readSettings } from '../settings/index.js';
import type { LocalEventStore } from '../store/persistence.js';
import { formatStatusBarText } from './status-bar-format.js';

export class AIMeterStatusBar {
  private readonly item: vscode.StatusBarItem;
  private readonly store: LocalEventStore;

  public constructor(store: LocalEventStore) {
    this.store = store;
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'aimeter.openDashboard';
    this.item.name = 'AIMeter';
  }

  public showNoData(): void {
    const settings = readSettings();
    if (!settings.statusBar.enabled) {
      this.item.hide();
      return;
    }
    this.item.text = 'AIMeter - no data yet';
    this.item.tooltip = 'INFOC ONE AIMeter is watching local AI agent logs.';
    this.item.show();
  }

  public async refresh(): Promise<void> {
    const settings = readSettings();
    if (!settings.statusBar.enabled) {
      this.item.hide();
      return;
    }

    const summary = await this.store.readTodaySummary(new Date(), settings.billing);
    if (summary.tokens === 0) {
      this.showNoData();
      return;
    }

    this.item.text = formatStatusBarText(summary, settings.statusBar.format);
    this.item.tooltip = `${summary.tokens.toLocaleString()} tokens today. API-estimated cost with confidence indicators.`;
    this.item.show();
  }

  public dispose(): void {
    this.item.dispose();
  }
}

