import { DEFAULT_CATALOG } from '../src/pricing/catalog.js';

const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
const now = new Date();

const stale = DEFAULT_CATALOG.filter((entry) => {
  const verifiedAt = new Date(entry.verifiedAt);
  return Number.isNaN(verifiedAt.getTime()) || now.getTime() - verifiedAt.getTime() > maxAgeMs;
});

if (stale.length > 0) {
  console.error(
    `Pricing catalog has stale entries: ${stale.map((entry) => entry.model).join(', ')}`,
  );
  process.exit(1);
}

console.log('Pricing catalog freshness check passed.');
