import { describe, expect, it } from 'vitest';
import { formatStatusBarText } from '../../../ui/status-bar-format.js';

describe('formatStatusBarText', () => {
  it('supports all configured status bar formats', () => {
    const summary = { tokens: 1234, costUsdEstimated: 0.012345, costConfidence: 'high' as const };

    expect(formatStatusBarText(summary, 'cost-today')).toBe('$(graph) $0.0123 est');
    expect(formatStatusBarText(summary, 'tokens-today')).toBe('$(graph) 1,234 tokens');
    expect(formatStatusBarText(summary, 'both')).toBe('$(graph) 1,234 tokens - $0.0123 est');
  });

  it('surfaces non-high confidence in the status bar text', () => {
    expect(
      formatStatusBarText({ tokens: 10, costUsdEstimated: 0, costConfidence: 'low' }, 'cost-today'),
    ).toBe('$(warning) low $0.0000 est');
  });
});