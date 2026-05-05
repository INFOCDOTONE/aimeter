const { execSync } = require('node:child_process');

const allowed = new Set([
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  'PostgreSQL',
  'MPL-2.0',
]);

const bannedFragments = ['GPL', 'AGPL', 'SSPL', 'BSL', 'FSL', 'Commons Clause', 'UNLICENSED'];

const output = execSync('pnpm licenses list --json --prod', {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

const packagesByLicense = JSON.parse(output);
const packages = Object.values(packagesByLicense).flat();
const violations = [];

for (const item of packages) {
  const license = String(item.license ?? 'UNLICENSED');
  const isAllowed = [...allowed].some((allowedLicense) => license.includes(allowedLicense));
  const isBanned = bannedFragments.some((fragment) => license.includes(fragment));
  if (!isAllowed || isBanned) {
    violations.push(`${item.name}@${item.version}: ${license}`);
  }
}

if (violations.length > 0) {
  console.error(`License check failed:\n${violations.join('\n')}`);
  process.exit(1);
}

console.log('License check passed.');
