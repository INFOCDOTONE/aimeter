import { mkdir, copyFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const root = process.cwd();
const dist = path.join(root, 'dist');

async function copyMedia() {
  const media = path.join(root, 'media');
  await mkdir(path.join(dist, 'media'), { recursive: true });
  try {
    const entries = await readdir(media);
    await Promise.all(entries.map((entry) => copyFile(path.join(media, entry), path.join(dist, 'media', entry))));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

const extensionOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile: 'dist/extension.js',
  external: ['vscode'],
  sourcemap: true,
  logLevel: 'info',
};

const webviewOptions = {
  entryPoints: ['src/ui/webview/webview.ts'],
  bundle: true,
  platform: 'browser',
  target: 'es2022',
  format: 'iife',
  outfile: 'dist/webview.js',
  sourcemap: true,
  logLevel: 'info',
};

await mkdir(dist, { recursive: true });
await copyMedia();

if (watch) {
  const extensionContext = await esbuild.context(extensionOptions);
  const webviewContext = await esbuild.context(webviewOptions);
  await extensionContext.watch();
  await webviewContext.watch();
  console.log('AIMeter build watching...');
} else {
  await Promise.all([esbuild.build(extensionOptions), esbuild.build(webviewOptions)]);
  await copyMedia();
}
