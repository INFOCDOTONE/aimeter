import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import esbuild from 'esbuild';
import { runTests } from '@vscode/test-electron';

const root = process.cwd();
const testOutDir = path.join(root, '.vscode-test', 'integration');
const testBundle = path.join(testOutDir, 'index.cjs');

await mkdir(testOutDir, { recursive: true });
await esbuild.build({
    entryPoints: ['src/tests/integration/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'cjs',
    outfile: testBundle,
    external: ['vscode'],
    logLevel: 'silent',
});

await runTests({
    extensionDevelopmentPath: root,
    extensionTestsPath: testBundle,
    launchArgs: ['--disable-workspace-trust'],
});