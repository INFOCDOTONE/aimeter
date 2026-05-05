import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import type { Logger } from '../../lib/logger.js';
import type { LocalEventStore } from '../../store/persistence.js';
import { readSettings } from '../../settings/index.js';
import type { DoctorResult } from '../doctor.js';
import { readWindowData } from '../dashboard-data.js';
import { fromWebviewSchema, type FromExtension, type WindowKey } from './messages.js';

export class AIMeterDashboardProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'aimeter.dashboard';
  private readonly extensionUri: vscode.Uri;
  private readonly logger: Logger;
  private readonly store: LocalEventStore;
  private activeWindow: WindowKey = 'today';
  private pendingDoctorResult: DoctorResult | undefined;
  private view: vscode.WebviewView | undefined;

  public constructor(options: {
    extensionUri: vscode.Uri;
    logger: Logger;
    store: LocalEventStore;
  }) {
    this.extensionUri = options.extensionUri;
    this.logger = options.logger;
    this.store = options.store;
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist')],
    };
    webviewView.webview.html = getHtml(webviewView.webview, this.extensionUri);
    webviewView.webview.onDidReceiveMessage((unknownMessage: unknown) => {
      void this.handleMessage(unknownMessage);
    });
    if (this.pendingDoctorResult !== undefined) {
      void this.showDoctor(this.pendingDoctorResult);
      return;
    }
    void this.refresh();
  }

  public async refresh(): Promise<void> {
    if (this.view === undefined) {
      return;
    }
    this.pendingDoctorResult = undefined;

    try {
      const settings = readSettings();
      const message = await readWindowData(this.store, this.activeWindow, new Date(), settings.billing);
      await this.postMessage(message);
    } catch (error) {
      this.logger.warn('webview', 'Failed to refresh dashboard', {
        error: error instanceof Error ? error.message : String(error),
      });
      await this.postMessage({
        type: 'error',
        message: 'AIMeter could not load dashboard data. See Output logs for details.',
      });
    }
  }

  public async showDoctor(result: DoctorResult): Promise<void> {
    this.pendingDoctorResult = result;
    if (this.view === undefined) {
      return;
    }
    await this.postMessage({ type: 'doctor-result', payload: result });
  }

  private async handleMessage(unknownMessage: unknown): Promise<void> {
    const parsed = fromWebviewSchema.safeParse(unknownMessage);
    if (!parsed.success) {
      this.logger.warn('webview', 'Rejected invalid webview message', {
        issueCount: parsed.error.issues.length,
      });
      return;
    }

    if (parsed.data.type === 'request-window') {
      this.activeWindow = parsed.data.payload.window;
      await this.refresh();
      return;
    }

    if (parsed.data.type === 'export-csv') {
      await vscode.commands.executeCommand('aimeter.exportCsv');
      return;
    }

    if (parsed.data.type === 'run-doctor') {
      await vscode.commands.executeCommand('aimeter.runDoctor');
      return;
    }

    await vscode.commands.executeCommand('workbench.action.openSettings', 'aimeter');
  }

  private async postMessage(message: FromExtension): Promise<void> {
    await this.view?.webview.postMessage(message);
  }
}

function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = createNonce();
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js'));
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';" />
    <title>AIMeter</title>
    <style>
      /* ── Design tokens ───────────────────────────────── */
      :root {
        --gap:      10px;
        --gap-sm:    6px;
        --gap-xs:    4px;
        --radius:    6px;
        --pad:      12px;
        --pad-sm:    8px;

        /* Agent palette */
        --col-claude:  var(--vscode-charts-blue,   #4FC3F7);
        --col-codex:   var(--vscode-charts-green,  #81C995);
        --col-gemini:  var(--vscode-charts-purple, #CE93D8);

        /* Token-type palette */
        --col-input:   var(--vscode-charts-blue,   #4FC3F7);
        --col-output:  var(--vscode-charts-green,  #81C995);
        --col-cache-r: var(--vscode-charts-yellow, #E2BB61);
        --col-cache-w: var(--vscode-charts-orange, #E07B54);
      }

      /* ── Reset / base ────────────────────────────────── */
      *, *::before, *::after { box-sizing: border-box; }

      body {
        color:       var(--vscode-foreground);
        background:  var(--vscode-sideBar-background);
        font-family: var(--vscode-font-family);
        font-size:   var(--vscode-font-size, 13px);
        margin: 0;
        padding: var(--pad);
        -webkit-font-smoothing: antialiased;
      }

      p, h1, h2 { margin: 0; }

      code {
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 0.9em;
        background: var(--vscode-editorWidget-background);
        border-radius: 3px;
        padding: 1px 4px;
      }

      /* ── Shell ───────────────────────────────────────── */
      .shell { display: grid; gap: var(--gap); }

      /* ── Typography helpers ──────────────────────────── */
      .muted   { color: var(--vscode-descriptionForeground); }
      .text-xs { font-size: 11px; }
      .text-sm { font-size: 12px; }
      .mono    { font-variant-numeric: tabular-nums; }
      .bold    { font-weight: 600; }
      .ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      /* ── Header ──────────────────────────────────────── */
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--gap-sm);
      }
      .header h1 {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      /* ── Window tabs ─────────────────────────────────── */
      .tabs {
        display: flex;
        background: var(--vscode-editorWidget-background);
        border-radius: var(--radius);
        padding: 2px;
        gap: 2px;
      }
      .tab {
        flex: 1;
        border: none;
        border-radius: calc(var(--radius) - 2px);
        background: transparent;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        line-height: 1;
        min-height: 24px;
        padding: 3px 6px;
        transition: background 0.1s, color 0.1s;
      }
      .tab:hover { color: var(--vscode-foreground); }
      .tab.active {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        font-weight: 500;
      }

      /* ── Actions row ─────────────────────────────────── */
      .actions { display: flex; flex-wrap: wrap; gap: var(--gap-sm); }

      button {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        line-height: 1;
        min-height: 24px;
        padding: 3px 10px;
      }
      button:hover { opacity: 0.9; }
      button.secondary {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
      }

      /* ── Hero metrics ────────────────────────────────── */
      .hero { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap-sm); }

      .metric-card {
        background: var(--vscode-editorWidget-background);
        border: 1px solid var(--vscode-panel-border, rgba(128,128,128,.2));
        border-radius: var(--radius);
        padding: var(--pad-sm) var(--pad-sm) var(--pad-sm);
        display: grid;
        gap: 3px;
      }
      .metric-label {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--vscode-descriptionForeground);
      }
      .metric-value {
        font-size: 22px;
        font-weight: 700;
        line-height: 1.15;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.01em;
      }
      .metric-detail {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-top: 1px;
      }

      /* ── Meta row (secondary metrics) ───────────────── */
      .meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        font-size: 12px;
        padding: 2px 1px;
      }
      .meta-item { display: flex; align-items: baseline; gap: 4px; }
      .meta-value { font-weight: 600; font-variant-numeric: tabular-nums; }
      .meta-label { color: var(--vscode-descriptionForeground); font-size: 11px; }

      /* ── Token composition bar ───────────────────────── */
      .comp-wrap { display: grid; gap: var(--gap-xs); }

      .comp-bar {
        display: flex;
        height: 7px;
        border-radius: 999px;
        overflow: hidden;
        background: var(--vscode-editorWidget-background);
        gap: 1px;
      }
      .comp-seg { height: 100%; min-width: 3px; }
      .seg-input   { background: var(--col-input); }
      .seg-output  { background: var(--col-output); }
      .seg-cache-r { background: var(--col-cache-r); }
      .seg-cache-w { background: var(--col-cache-w); }

      .comp-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
      }
      .comp-item { display: flex; align-items: center; gap: 3px; white-space: nowrap; }
      .comp-dot {
        display: inline-block;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      /* ── Section header ──────────────────────────────── */
      .section-head {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--vscode-descriptionForeground);
        margin: 0;
      }

      /* ── Panel (generic section wrapper) ─────────────── */
      .panel { display: grid; gap: var(--gap-sm); }

      /* ── SVG trend chart ─────────────────────────────── */
      .chart-wrap svg {
        display: block;
        width: 100%;
        height: 160px;
        overflow: visible;
      }

      /* ── Agent bars ──────────────────────────────────── */
      .agent-row {
        display: grid;
        grid-template-columns: minmax(72px, auto) 1fr minmax(68px, auto);
        gap: var(--gap-sm);
        align-items: center;
        font-size: 12px;
      }
      .agent-label {
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .agent-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .agent-track {
        height: 6px;
        background: var(--vscode-editorWidget-background);
        border-radius: 999px;
        overflow: hidden;
      }
      .agent-fill { height: 100%; border-radius: 999px; }
      .agent-stats { text-align: right; }
      .agent-stats .tokens { font-weight: 600; font-variant-numeric: tabular-nums; font-size: 12px; }
      .agent-stats .cost   { color: var(--vscode-descriptionForeground); font-size: 11px; font-variant-numeric: tabular-nums; }

      /* ── Model table ─────────────────────────────────── */
      table { border-collapse: collapse; width: 100%; font-size: 12px; }
      thead th {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--vscode-descriptionForeground);
        border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,.2));
        padding: 4px 4px 5px;
        text-align: left;
      }
      thead th:not(:first-child) { text-align: right; }
      tbody td {
        border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,.1));
        padding: 5px 4px;
        vertical-align: middle;
        font-variant-numeric: tabular-nums;
      }
      tbody td:not(:first-child) { text-align: right; }
      tbody tr:last-child td { border-bottom: none; }
      .model-name     { font-weight: 500; font-size: 12px; }
      .model-provider { font-size: 10px; color: var(--vscode-descriptionForeground); }
      tbody td:nth-child(2) { color: var(--vscode-descriptionForeground); font-size: 11px; }

      /* ── Session list ────────────────────────────────── */
      .session-list { display: grid; gap: 1px; }
      .session {
        display: grid;
        gap: 3px;
        padding: 7px 0;
        border-bottom: 1px solid var(--vscode-panel-border, rgba(128,128,128,.1));
        font-size: 12px;
      }
      .session:last-child { border-bottom: none; }
      .session-project { font-weight: 500; }
      .session-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
      }
      .session-tokens { font-variant-numeric: tabular-nums; }

      /* ── Confidence dot ──────────────────────────────── */
      .conf {
        display: inline-block;
        width: 7px; height: 7px;
        border-radius: 50%;
        margin-right: 3px;
        vertical-align: middle;
        flex-shrink: 0;
      }
      .conf-high   { background: var(--vscode-testing-iconPassed,  #73C991); }
      .conf-medium { background: var(--vscode-testing-iconQueued,  #CCA700); }
      .conf-low    { background: var(--vscode-testing-iconFailed,  #F14C4C); }

      /* ── Empty state ─────────────────────────────────── */
      .empty {
        border: 1px solid var(--vscode-panel-border, rgba(128,128,128,.2));
        border-radius: var(--radius);
        padding: var(--pad);
        display: grid;
        gap: var(--gap);
      }
      .empty h2 { font-size: 14px; }

      .watcher-list {
        list-style: none;
        margin: 0; padding: 0;
        display: grid;
        gap: 6px;
        font-size: 12px;
      }
      .watcher-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
      .watcher-name { font-weight: 500; min-width: 72px; }

      /* ── Doctor view ─────────────────────────────────── */
      .doctor-item {
        border-left: 3px solid;
        padding: 6px 8px;
        border-radius: 0 4px 4px 0;
        display: grid;
        gap: 2px;
        font-size: 12px;
        background: var(--vscode-editorWidget-background);
      }
      .doctor-ok    { border-color: var(--vscode-testing-iconPassed, #73C991); }
      .doctor-warn  { border-color: var(--vscode-testing-iconQueued, #CCA700); }
      .doctor-error { border-color: var(--vscode-testing-iconFailed, #F14C4C); }

      /* ── Error panel ─────────────────────────────────── */
      .error-panel {
        border: 1px solid var(--vscode-inputValidation-errorBorder);
        border-radius: var(--radius);
        padding: var(--pad);
        color: var(--vscode-errorForeground);
        display: grid;
        gap: var(--gap-sm);
      }
      .error-panel h2 { font-size: 13px; }

      /* ── Loading state ───────────────────────────────── */
      .loading { color: var(--vscode-descriptionForeground); font-size: 12px; }

      /* ── Narrow-panel breakpoint ─────────────────────── */
      @media (max-width: 300px) {
        .hero           { grid-template-columns: 1fr; }
        .agent-row      { grid-template-columns: auto 1fr; }
        .agent-stats    { display: none; }
        .comp-legend    { display: none; }
      }
    </style>
  </head>
  <body>
    <main id="app" class="shell" aria-live="polite">
      <div class="header">
        <h1>AIMeter</h1>
        <span class="loading muted">Loading…</span>
      </div>
    </main>
    <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
  </body>
</html>`;
}

function createNonce(): string {
  return randomBytes(16).toString('base64');
}
