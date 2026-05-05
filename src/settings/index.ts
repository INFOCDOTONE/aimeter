import * as vscode from 'vscode';
import { settingsSchema, type AIMeterSettings } from './schema.js';

export function readSettings(): AIMeterSettings {
  const config = vscode.workspace.getConfiguration('aimeter');
  return settingsSchema.parse({
    statusBar: {
      enabled: config.get('statusBar.enabled', true),
      format: config.get('statusBar.format', 'cost-today'),
    },
    refreshIntervalSec: config.get('refreshIntervalSec', 30),
    parsers: {
      claudeCode: {
        enabled: config.get('parsers.claudeCode.enabled', true),
        paths: config.get('parsers.claudeCode.paths', []),
      },
      codexCli: {
        enabled: config.get('parsers.codexCli.enabled', true),
        paths: config.get('parsers.codexCli.paths', []),
      },
      geminiCli: {
        enabled: config.get('parsers.geminiCli.enabled', true),
        paths: config.get('parsers.geminiCli.paths', []),
      },
    },
    retention: {
      days: config.get('retention.days', 365),
    },
    network: {
      updateCheck: config.get('network.updateCheck', false),
    },
  });
}
