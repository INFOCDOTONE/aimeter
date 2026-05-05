import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import type { Logger } from '../../lib/logger.js';
import type { LocalEventStore } from '../../store/persistence.js';
import { readWindowData } from '../dashboard-data.js';
import { fromWebviewSchema, type FromExtension, type WindowKey } from './messages.js';

export class AIMeterDashboardProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'aimeter.dashboard';
  private readonly extensionUri: vscode.Uri;
  private readonly logger: Logger;
  private readonly store: LocalEventStore;
  private activeWindow: WindowKey = 'today';
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
    void this.refresh();
  }

  public async refresh(): Promise<void> {
    if (this.view === undefined) {
      return;
    }

    try {
      const message = await readWindowData(this.store, this.activeWindow);
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
      :root {
        color-scheme: light dark;
      }
      body {
        color: var(--vscode-foreground);
        background: var(--vscode-sideBar-background);
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        margin: 0;
        padding: 12px;
      }
      button {
        color: var(--vscode-button-foreground);
        background: var(--vscode-button-background);
        border: 0;
        border-radius: 4px;
        cursor: pointer;
        font: inherit;
        min-height: 28px;
        padding: 4px 10px;
      }
      button.secondary {
        color: var(--vscode-button-secondaryForeground);
        background: var(--vscode-button-secondaryBackground);
      }
      button[aria-pressed="true"] {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: 1px;
      }
      .shell {
        display: grid;
        gap: 12px;
      }
      .title {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
      }
      h1,
      h2,
      p {
        margin: 0;
      }
      h1 {
        font-size: 16px;
        font-weight: 600;
      }
      h2 {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .muted {
        color: var(--vscode-descriptionForeground);
      }
      .picker,
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .cards {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .card,
      .panel,
      .empty {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        padding: 10px;
      }
      .card-value {
        font-size: 18px;
        font-weight: 700;
        line-height: 1.3;
        margin-top: 6px;
        overflow-wrap: anywhere;
      }
      .panel {
        display: grid;
        gap: 8px;
      }
      .bar-row {
        display: grid;
        grid-template-columns: minmax(88px, 1fr) minmax(96px, 2fr) auto;
        gap: 8px;
        align-items: center;
      }
      .bar-track {
        background: var(--vscode-editorWidget-background);
        border-radius: 999px;
        height: 8px;
        overflow: hidden;
      }
      .bar-fill {
        background: var(--vscode-charts-blue);
        height: 100%;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      th,
      td {
        border-bottom: 1px solid var(--vscode-panel-border);
        padding: 6px 4px;
        text-align: left;
        vertical-align: top;
      }
      th:not(:first-child),
      td:not(:first-child) {
        text-align: right;
      }
      svg {
        display: block;
        height: 132px;
        width: 100%;
      }
      .session-list {
        display: grid;
        gap: 6px;
      }
      .session {
        border-bottom: 1px solid var(--vscode-panel-border);
        display: grid;
        gap: 3px;
        padding: 0 0 6px;
      }
      .confidence {
        display: inline-block;
        border-radius: 999px;
        height: 8px;
        margin-right: 6px;
        width: 8px;
      }
      .confidence.high {
        background: var(--vscode-testing-iconPassed);
      }
      .confidence.medium {
        background: var(--vscode-testing-iconQueued);
      }
      .confidence.low {
        background: var(--vscode-testing-iconFailed);
      }
      .error {
        border-color: var(--vscode-inputValidation-errorBorder);
        color: var(--vscode-errorForeground);
      }
      @media (max-width: 360px) {
        .cards {
          grid-template-columns: 1fr;
        }
        .bar-row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main id="app" class="shell" aria-live="polite">
      <div class="title">
        <h1>AIMeter</h1>
        <span class="muted">Loading...</span>
      </div>
    </main>
    <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
  </body>
</html>`;
}

function createNonce(): string {
  return randomBytes(16).toString('base64');
}
