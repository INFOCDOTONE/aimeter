import type * as vscode from 'vscode';
import { startAIMeter } from './lifecycle.js';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  await startAIMeter(context);
}

export function deactivate(): void {
  // VS Code disposes registered subscriptions for us.
}
