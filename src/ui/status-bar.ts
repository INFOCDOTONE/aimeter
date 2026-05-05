import * as vscode from 'vscode';
import type { LocalEventStore } from '../store/persistence.js';

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
    this.item.text = 'AIMeter - no data yet';
    this.item.tooltip = 'INFOC ONE AIMeter is watching local AI agent logs.';
    this.item.show();
  }

  public async refresh(): Promise<void> {
    const summary = await this.store.readTodaySummary();
    if (summary.tokens === 0) {
      this.showNoData();
      return;
    }

    this.item.text = `AIMeter $${summary.costUsdEstimated.toFixed(4)} est`;
    this.item.tooltip = `${summary.tokens.toLocaleString()} tokens today. Estimated cost with confidence indicators.`;
    this.item.show();
  }

  public dispose(): void {
    this.item.dispose();
  }
}
