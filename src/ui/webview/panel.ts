import type * as vscode from 'vscode';

export class AIMeterDashboardProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'aimeter.dashboard';

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
    };
    webviewView.webview.html = getHtml();
  }
}

function getHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AIMeter</title>
    <style>
      body {
        color: var(--vscode-foreground);
        background: var(--vscode-sideBar-background);
        font-family: var(--vscode-font-family);
        padding: 16px;
      }
      .empty {
        border: 1px solid var(--vscode-panel-border);
        padding: 12px;
      }
    </style>
  </head>
  <body>
    <h1>INFOC ONE AIMeter</h1>
    <div class="empty">No local AI usage events yet.</div>
  </body>
</html>`;
}
