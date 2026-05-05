export type StatusBarSummary = {
    tokens: number;
    costUsdEstimated: number;
    costConfidence: 'high' | 'medium' | 'low';
};

export type StatusBarFormat = 'cost-today' | 'tokens-today' | 'both';

export function formatStatusBarText(summary: StatusBarSummary, format: StatusBarFormat): string {
    const prefix = summary.costConfidence === 'high' ? '$(graph)' : `$(warning) ${summary.costConfidence}`;
    const cost = `$${summary.costUsdEstimated.toFixed(4)} est`;
    const tokens = `${summary.tokens.toLocaleString()} tokens`;
    if (format === 'tokens-today') {
        return `${prefix} ${tokens}`;
    }
    if (format === 'both') {
        return `${prefix} ${tokens} - ${cost}`;
    }
    return `${prefix} ${cost}`;
}