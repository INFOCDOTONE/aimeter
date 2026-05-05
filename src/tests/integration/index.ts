import assert from 'node:assert/strict';
import * as vscode from 'vscode';

const EXTENSION_ID = 'infoc-one.aimeter';
const SMOKE_ACTIVATION_LIMIT_MS = 2000;
const REQUIRED_COMMANDS = [
    'aimeter.openDashboard',
    'aimeter.exportCsv',
    'aimeter.refresh',
    'aimeter.clearData',
    'aimeter.openLogs',
    'aimeter.runDoctor',
];

export async function run(): Promise<void> {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, `Expected ${EXTENSION_ID} to be available in Extension Development Host.`);

    const startedAt = Date.now();
    await extension.activate();
    const activationMs = Date.now() - startedAt;
    assert.ok(
        activationMs < SMOKE_ACTIVATION_LIMIT_MS,
        `Activation took ${activationMs} ms, expected under ${SMOKE_ACTIVATION_LIMIT_MS} ms.`,
    );

    const commands = await vscode.commands.getCommands(true);
    for (const command of REQUIRED_COMMANDS) {
        assert.ok(commands.includes(command), `Expected command ${command} to be registered.`);
    }

    await vscode.commands.executeCommand('aimeter.refresh');
    await vscode.commands.executeCommand('aimeter.openDashboard');
    await vscode.commands.executeCommand('aimeter.openLogs');
}