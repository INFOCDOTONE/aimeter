import { writeFile } from 'node:fs/promises';
import * as vscode from 'vscode';
import type { LocalEventStore } from '../store/persistence.js';
import { toCsv } from './csv-format.js';

export async function exportCsv(store: LocalEventStore): Promise<void> {
    const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`aimeter-export-${new Date().toISOString().slice(0, 10)}.csv`),
        filters: { CSV: ['csv'] },
        saveLabel: 'Export AIMeter CSV',
    });

    if (uri === undefined) {
        return;
    }

    const events = await store.readAllEvents();
    const csv = toCsv(events);
    await writeFile(uri.fsPath, csv, 'utf8');
    await vscode.window.showInformationMessage(`AIMeter exported ${events.length} events.`);
}