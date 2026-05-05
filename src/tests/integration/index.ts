import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
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
    const networkCalls = installNoNetworkGuard();
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

    assert.deepEqual(networkCalls, [], `Expected zero outbound network calls, saw: ${networkCalls.join(', ')}`);
}

function installNoNetworkGuard(): string[] {
    const calls: string[] = [];

    const require = createRequire(__filename);
    const httpModule = require('node:http') as MutableNetworkModule;
    const httpsModule = require('node:https') as MutableNetworkModule;

    httpModule.request = forbiddenRequest('http.request', calls);
    httpsModule.request = forbiddenRequest('https.request', calls);
    httpModule.get = forbiddenRequest('http.get', calls);
    httpsModule.get = forbiddenRequest('https.get', calls);
    globalThis.fetch = ((input: Parameters<typeof fetch>[0]) => {
        calls.push(`fetch:${networkTarget(input)}`);
        return Promise.reject(new Error('AIMeter no-network test blocked fetch'));
    }) as typeof fetch;

    return calls;
}

type NetworkFunction = (...args: unknown[]) => unknown;

type MutableNetworkModule = {
    request: NetworkFunction;
    get: NetworkFunction;
};

function forbiddenRequest(name: string, calls: string[]): NetworkFunction {
    return (...args: unknown[]) => {
        calls.push(`${name}:${networkTarget(args[0])}`);
        throw new Error(`AIMeter no-network test blocked ${name}`);
    };
}

function networkTarget(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    if (value instanceof URL) {
        return value.toString();
    }
    if (value instanceof Request) {
        return value.url;
    }
    return 'unknown-target';
}