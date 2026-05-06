import type { BillingBasis } from '../../pricing/billing.js';
import { fromExtensionSchema, type DoctorResult, type WindowDataPayload, type WindowKey } from './messages.js';

declare const acquireVsCodeApi: () => {
    postMessage: (message: unknown) => void;
};

const vscode = acquireVsCodeApi();
const app = document.querySelector<HTMLElement>('#app');
let activeWindow: WindowKey = 'today';

document.documentElement.dataset.aimeter = 'ready';
requestWindow(activeWindow);

window.addEventListener('message', (event: MessageEvent<unknown>) => {
    const parsed = fromExtensionSchema.safeParse(event.data);
    if (!parsed.success) {
        renderError('AI Meter received an invalid dashboard message.');
        return;
    }
    if (parsed.data.type === 'error') { renderError(parsed.data.message); return; }
    if (parsed.data.type === 'doctor-result') { renderDoctor(parsed.data.payload); return; }
    activeWindow = parsed.data.payload.window;
    renderDashboard(parsed.data.payload);
});

// ─── Main render ───────────────────────────────────────────────────────────

function renderDashboard(data: WindowDataPayload): void {
    if (!app) return;
    const nodes: Node[] = [
        renderHeader(data),
        renderTabs(data.window),
        renderActions(),
    ];

    if (!data.hasEvents) {
        nodes.push(renderEmpty());
    } else {
        nodes.push(
            renderHeroSection(data),
            renderCompositionBar(data.totals),
            renderTrendPanel(data),
            renderAgentPanel(data),
            renderModelPanel(data),
            renderSessionsPanel(data),
        );
    }
    app.replaceChildren(...nodes);
}

// ─── Header ────────────────────────────────────────────────────────────────

function renderHeader(data: WindowDataPayload): HTMLElement {
    const container = div('header');
    container.append(h('h1', undefined, 'AI Meter'));
    container.append(span('muted text-xs', `Updated ${fmtRelative(data.generatedAt)}`));
    return container;
}

// ─── Window tabs ───────────────────────────────────────────────────────────

function renderTabs(current: WindowKey): HTMLElement {
    const container = div('tabs');
    const opts: Array<{ key: WindowKey; label: string }> = [
        { key: 'today', label: 'Today' },
        { key: '7d', label: '7 days' },
        { key: '30d', label: '30 days' },
    ];
    for (const { key, label } of opts) {
        const btn = el<HTMLButtonElement>('button', key === current ? 'tab active' : 'tab', label);
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(key === current));
        btn.addEventListener('click', () => requestWindow(key));
        container.append(btn);
    }
    return container;
}

// ─── Actions ───────────────────────────────────────────────────────────────

function renderActions(): HTMLElement {
    const container = div('actions');
    container.append(actionBtn('Export CSV', 'export-csv'), actionBtn('Doctor', 'run-doctor'));
    return container;
}

// ─── Hero section ──────────────────────────────────────────────────────────

function renderHeroSection(data: WindowDataPayload): HTMLElement {
    const { totals } = data;

    // Two big metric cards
    const hero = div('hero');

    // Tokens card
    const tokensCard = div('metric-card');
    tokensCard.append(p('metric-label', 'Total tokens'));
    const tokensVal = div('metric-value mono');
    tokensVal.textContent = fmtTokens(totals.tokens);
    tokensCard.append(tokensVal, p('metric-detail', `${fmtTokens(totals.inputTokens)} in · ${fmtTokens(totals.outputTokens)} out`));

    // Cost card
    const costCard = div('metric-card');
    costCard.append(p('metric-label', 'Estimated API cost'));
    const costVal = div('metric-value mono');
    costVal.innerHTML = `${confDot(totals.costConfidence)}${fmtUsd(totals.costUsdEstimated)}`;
    const rate = totals.billing.apiMeteredTokens > 0
        ? `$${((totals.costUsdEstimated / totals.billing.apiMeteredTokens) * 1_000_000).toFixed(2)}/1M API tokens`
        : `${totals.costConfidence} confidence`;
    costCard.append(costVal, p('metric-detail', rate));

    hero.append(tokensCard, costCard);

    // Secondary meta row
    const meta = div('meta-row');
    meta.append(
        metaItem(String(totals.eventCount), 'events'),
        metaItem(String(data.recentSessions.length), 'sessions'),
        metaItem(fmtTokens(totals.cacheReadTokens), 'cache hits'),
        metaItem(fmtTokens(totals.billing.subscriptionIncludedTokens), 'plan tokens'),
        metaItem(fmtTokens(totals.billing.unknownTokens), 'unknown billing'),
    );

    const section = div();
    section.style.cssText = 'display:grid;gap:6px';
    section.append(hero, meta);
    return section;
}

function metaItem(value: string, label: string): HTMLElement {
    const item = div('meta-item');
    item.append(span('meta-value', value), span('meta-label', label));
    return item;
}

// ─── Token composition bar ─────────────────────────────────────────────────

function renderCompositionBar(totals: WindowDataPayload['totals']): HTMLElement {
    const wrap = div('comp-wrap');
    const total = totals.tokens;
    if (total === 0) return wrap;

    const segments = [
        { name: 'Input',   value: totals.inputTokens,      cls: 'seg-input comp-dot' },
        { name: 'Output',  value: totals.outputTokens,     cls: 'seg-output comp-dot' },
        { name: 'Cache R', value: totals.cacheReadTokens,  cls: 'seg-cache-r comp-dot' },
        { name: 'Cache W', value: totals.cacheWriteTokens, cls: 'seg-cache-w comp-dot' },
    ].filter((s) => s.value > 0);

    const bar = div('comp-bar');
    for (const seg of segments) {
        const fill = div(`comp-seg ${seg.cls.split(' ')[0] ?? ''}`);
        fill.style.width = `${(seg.value / total) * 100}%`;
        fill.title = `${seg.name}: ${fmtTokens(seg.value)} (${pct(seg.value, total)}%)`;
        bar.append(fill);
    }

    const legend = div('comp-legend');
    for (const seg of segments) {
        const item = div('comp-item');
        const dot = span(`comp-dot ${seg.cls.split(' ')[0] ?? ''}`);
        item.append(dot, document.createTextNode(`${seg.name} ${pct(seg.value, total)}%`));
        legend.append(item);
    }

    wrap.append(bar, legend);
    return wrap;
}

function pct(value: number, total: number): string {
    const pc = (value / total) * 100;
    return pc >= 1 ? pc.toFixed(0) : pc.toFixed(1);
}

// ─── Trend chart ───────────────────────────────────────────────────────────

function renderTrendPanel(data: WindowDataPayload): HTMLElement {
    const panel = div('panel');
    panel.append(p('section-head', 'Daily trend'));
    const wrap = div('chart-wrap');
    wrap.append(renderTrendSvg(data));
    panel.append(wrap);
    return panel;
}

function renderTrendSvg(data: WindowDataPayload): SVGSVGElement {
    const W = 600, H = 180;
    const PL = 46, PR = 6, PT = 8, PB = 28;
    const cW = W - PL - PR;
    const cH = H - PT - PB;

    const svg = svgEl<SVGSVGElement>('svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Daily token usage trend');

    const days = data.daily;
    const maxT = Math.max(1, ...days.map((d) => d.tokens));
    const bw = cW / Math.max(days.length, 1);
    const gap = Math.max(1, bw * 0.18);
    const today = new Date().toISOString().slice(0, 10);

    // Grid lines + y-axis labels
    for (const frac of [0.25, 0.5, 0.75, 1.0]) {
        const y = PT + cH * (1 - frac);

        const line = svgEl<SVGLineElement>('line');
        line.setAttribute('x1', String(PL));
        line.setAttribute('x2', String(PL + cW));
        line.setAttribute('y1', String(y));
        line.setAttribute('y2', String(y));
        line.setAttribute('stroke', 'var(--vscode-editorWidget-border,rgba(128,128,128,.15))');
        line.setAttribute('stroke-width', '0.5');
        svg.append(line);

        const lab = svgText(PL - 3, y + 3.5, fmtTokensCompact(maxT * frac));
        lab.setAttribute('text-anchor', 'end');
        svg.append(lab);
    }

    // Bars
    days.forEach((day, i) => {
        const barH = Math.max(2, (day.tokens / maxT) * cH);
        const x = PL + i * bw + gap / 2;
        const w = Math.max(2, bw - gap);
        const y = PT + cH - barH;
        const isToday = day.date === today;

        const rect = svgEl<SVGRectElement>('rect');
        rect.setAttribute('x', String(x));
        rect.setAttribute('y', String(y));
        rect.setAttribute('width', String(w));
        rect.setAttribute('height', String(barH));
        rect.setAttribute('rx', '2');
        rect.setAttribute('fill', 'var(--vscode-charts-blue,#4FC3F7)');
        rect.setAttribute('opacity', isToday ? '1' : '0.55');

        const title = svgEl<SVGTitleElement>('title');
        title.textContent = `${day.date}: ${fmtTokens(day.tokens)} tokens · ${fmtUsd(day.costUsdEstimated)} est`;
        rect.append(title);
        svg.append(rect);
    });

    // X-axis date labels
    const showEvery = days.length <= 7 ? 1 : days.length <= 14 ? 2 : 5;
    days.forEach((day, i) => {
        if (i % showEvery !== 0 && i !== days.length - 1) return;
        const cx = PL + i * bw + bw / 2;
        const isToday = day.date === today;
        const d = new Date(`${day.date}T12:00:00`);
        const label = isToday
            ? 'Today'
            : new Intl.DateTimeFormat(undefined, { month: 'numeric', day: 'numeric' }).format(d);

        const t = svgText(cx, H - 4, label);
        t.setAttribute('text-anchor', 'middle');
        if (isToday) t.setAttribute('font-weight', '600');
        svg.append(t);
    });

    return svg;
}

// ─── Agent breakdown ───────────────────────────────────────────────────────

function renderAgentPanel(data: WindowDataPayload): HTMLElement {
    const panel = div('panel');
    panel.append(p('section-head', 'By agent'));

    if (data.byAgent.length === 0) {
        panel.append(span('muted text-sm', 'No agent data'));
        return panel;
    }

    const maxT = Math.max(1, ...data.byAgent.map((a) => a.tokens));
    for (const agent of data.byAgent) {
        const row = div(agent.tokens === 0 ? 'agent-row agent-row-empty' : 'agent-row');

        const labelEl = div('agent-label');
        const dot = span('agent-dot');
        dot.style.background = agentColor(agent.id);
        labelEl.append(dot, document.createTextNode(agent.label));

        const track = div('agent-track');
        const fill = div('agent-fill');
        fill.style.width = agent.tokens === 0 ? '0%' : `${Math.max(8, (agent.tokens / maxT) * 100)}%`;
        fill.style.background = agentColor(agent.id);
        track.append(fill);

        const stats = div('agent-stats');
        const tokensEl = span(agent.tokens === 0 ? 'tokens muted' : 'tokens', agent.tokens === 0 ? 'No parsed usage' : fmtTokens(agent.tokens));
        const costEl = div('cost');
        costEl.innerHTML = `${confDot(agent.costConfidence)}${fmtUsd(agent.costUsdEstimated)}`;
        stats.append(tokensEl, costEl);

        row.append(labelEl, track, stats);
        panel.append(row);
    }

    return panel;
}

// ─── Model table ───────────────────────────────────────────────────────────

function renderModelPanel(data: WindowDataPayload): HTMLElement {
    const panel = div('panel');
    panel.append(p('section-head', 'By model'));

    if (data.byModel.length === 0) {
        panel.append(span('muted text-sm', 'No model data'));
        return panel;
    }

    const table = el<HTMLTableElement>('table');
    const thead = el<HTMLTableSectionElement>('thead');
    const hrow = el<HTMLTableRowElement>('tr');
    hrow.append(th('Model'), th('Billing'), th('Tokens'), th('Cost'), th('Events'));
    thead.append(hrow);

    const tbody = el<HTMLTableSectionElement>('tbody');
    for (const model of data.byModel) {
        const row = el<HTMLTableRowElement>('tr');

        const nameTd = el<HTMLTableCellElement>('td');
        nameTd.append(
            div('model-name', fmtModel(model.label || model.id)),
            span('model-provider muted', modelProvider(model.id)),
        );

        const costTd = el<HTMLTableCellElement>('td');
        costTd.innerHTML = `${confDot(model.costConfidence)}${fmtUsd(model.costUsdEstimated)}`;

        row.append(
            nameTd,
            td(billingBasisLabel(model.billingBasis)),
            td(fmtTokensCompact(model.tokens)),
            costTd,
            td(String(model.eventCount)),
        );
        tbody.append(row);
    }

    table.append(thead, tbody);
    panel.append(table);
    return panel;
}

function modelProvider(modelId: string): string {
    if (modelId.startsWith('claude')) return 'Anthropic';
    if (modelId.startsWith('gpt') || modelId.startsWith('o4') || modelId.startsWith('o3')) return 'OpenAI';
    if (modelId.startsWith('gemini')) return 'Google';
    return '';
}

// ─── Sessions list ─────────────────────────────────────────────────────────

function renderSessionsPanel(data: WindowDataPayload): HTMLElement {
    const panel = div('panel');
    panel.append(p('section-head', `Recent sessions · ${data.recentSessions.length}`));

    if (data.recentSessions.length === 0) {
        panel.append(span('muted text-sm', 'No sessions'));
        return panel;
    }

    const list = div('session-list');
    for (const session of data.recentSessions.slice(0, 20)) {
        const item = div('session');

        const project = div('session-project ellipsis');
        project.textContent = fmtSlug(session.projectSlug);
        project.title = session.projectSlug;

        const meta = div('session-meta');
        meta.append(
            span('', fmtRelative(session.latestAt)),
            span('', session.agents.map(agentShort).join(', ')),
            span('', session.models.map((m) => fmtModel(m)).join(', ')),
        );

        const tokens = div('session-tokens');
        tokens.innerHTML = `${fmtTokens(session.tokens)} tokens · ${billingBasisLabel(session.billingBasis)} · ${confDot(session.costConfidence)}${fmtUsd(session.costUsdEstimated)} API est`;

        item.append(project, meta, tokens);
        list.append(item);
    }

    panel.append(list);
    return panel;
}

// ─── Empty state ───────────────────────────────────────────────────────────

function renderEmpty(): HTMLElement {
    const container = div('empty');
    container.append(
        h('h2', undefined, 'No events yet'),
        p('muted text-sm', 'Run an AI coding session — AI Meter will pick it up automatically.'),
        p('text-sm', 'Watching for session logs from:'),
    );

    const list = el<HTMLUListElement>('ul', 'watcher-list');
    for (const { name, path } of [
        { name: 'Claude Code', path: '~/.claude/projects' },
        { name: 'Codex CLI',   path: '~/.codex/sessions' },
        { name: 'Gemini CLI',  path: '~/.gemini/sessions' },
        { name: 'GitHub Copilot', path: 'No local token log available' },
    ]) {
        const li = el<HTMLLIElement>('li', 'watcher-row');
        li.append(span('watcher-name', name));
        const code = el<HTMLElement>('code');
        code.textContent = path;
        li.append(code);
        list.append(li);
    }

    const actions = div('actions');
    actions.append(actionBtn('Run Doctor', 'run-doctor'), actionBtn('Open Settings', 'open-settings'));

    container.append(list, actions);
    return container;
}

// ─── Doctor view ───────────────────────────────────────────────────────────

function renderDoctor(result: DoctorResult): void {
    if (!app) return;

    const errors = result.checks.filter((c) => c.severity === 'error').length;
    const warns  = result.checks.filter((c) => c.severity === 'warn').length;

    const header = div('header');
    header.append(h('h1', undefined, 'Doctor'), span('muted text-xs', `${errors} errors · ${warns} warnings`));

    const panel = div('panel');
    for (const check of result.checks) {
        const item = div(`doctor-item doctor-${check.severity}`);
        item.append(el('strong', undefined, check.name), p('muted text-xs', check.message));
        panel.append(item);
    }

    const actions = div('actions');
    actions.append(actionBtn('Back', 'request-dashboard'), actionBtn('Settings', 'open-settings'));

    app.replaceChildren(header, actions, panel);
}

// ─── Error view ────────────────────────────────────────────────────────────

function renderError(message: string): void {
    if (!app) return;
    const container = div('error-panel');
    container.append(h('h2', undefined, 'Error'), p(undefined, message));
    app.replaceChildren(container);
}

// ─── Message helpers ───────────────────────────────────────────────────────

function requestWindow(window: WindowKey): void {
    vscode.postMessage({ type: 'request-window', payload: { window } });
}

// ─── Number formatters ─────────────────────────────────────────────────────

function fmtTokens(n: number): string {
    if (n >= 1_000_000_000) return `${+(n / 1e9).toFixed(n >= 10e9 ? 1 : 2)}B`;
    if (n >= 1_000_000)     return `${+(n / 1e6).toFixed(n >= 100e6 ? 1 : 2)}M`;
    if (n >= 10_000)        return `${Math.round(n / 1e3)}K`;
    if (n >= 1_000)         return `${+(n / 1e3).toFixed(1)}K`;
    return String(n);
}

function fmtTokensCompact(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
    return String(n);
}

function fmtUsd(n: number): string {
    if (n === 0)   return '$0';
    if (n >= 100)  return `$${n.toFixed(0)}`;
    if (n >= 1)    return `$${n.toFixed(2)}`;
    if (n >= 0.01) return `$${n.toFixed(3)}`;
    return `$${n.toFixed(4)}`;
}

function fmtModel(model: string): string {
    // Strip 8-digit date suffix
    let m = model.replace(/-\d{8}$/, '');

    if (m.startsWith('claude-')) {
        m = m.slice('claude-'.length);
        // New format: sonnet-4-6, opus-4-7, haiku-4-5
        const nMatch = /^([a-z]+)-(\d+)-(\d+)$/.exec(m);
        if (nMatch !== null) return `${cap(nMatch[1] ?? '')} ${nMatch[2]}.${nMatch[3]}`;
        // Old format: 3-5-sonnet
        const oMatch = /^(\d+)-(\d+)-([a-z]+)$/.exec(m);
        if (oMatch !== null) return `${cap(oMatch[3] ?? '')} ${oMatch[1]}.${oMatch[2]}`;
        // Fallback: capitalise parts
        return m.split('-').map(cap).join(' ');
    }

    if (m.startsWith('gpt-'))    return m.replace('gpt-', 'GPT-');
    if (m.startsWith('gemini-')) {
        return 'Gemini ' + m.slice('gemini-'.length).split('-').map(cap).join(' ');
    }
    return m;
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

function fmtRelative(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 2)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'yesterday';
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(iso));
}

function fmtSlug(slug: string): string {
    return slug
        .replace(/^[a-zA-Z]--/, '')   // strip drive prefix (d--)
        .replace(/-{2,}/g, '/')        // double dashes → slash
        .split('/')
        .filter(Boolean)
        .pop() ?? slug;
}

// ─── Agent helpers ─────────────────────────────────────────────────────────

function agentColor(id: string): string {
    if (id === 'claude-code') return 'var(--vscode-charts-blue,#4FC3F7)';
    if (id === 'codex-cli')   return 'var(--vscode-charts-green,#81C995)';
    if (id === 'gemini-cli')  return 'var(--vscode-charts-purple,#CE93D8)';
    return 'var(--vscode-charts-blue)';
}

function agentShort(id: string): string {
    if (id === 'claude-code') return 'Claude';
    if (id === 'codex-cli')   return 'Codex';
    if (id === 'gemini-cli')  return 'Gemini';
    return id;
}

function billingBasisLabel(basis: BillingBasis): string {
    if (basis === 'api-metered') return 'API metered';
    if (basis === 'subscription-included') return 'Plan included';
    return 'Unknown';
}

// ─── Confidence dot ────────────────────────────────────────────────────────

function confDot(conf: 'high' | 'medium' | 'low'): string {
    return `<span class="conf conf-${conf}" title="${conf} confidence"></span>`;
}

// ─── DOM helpers ───────────────────────────────────────────────────────────

function el<T extends HTMLElement>(tag: string, cls?: string, text?: string): T {
    const node = document.createElement(tag) as T;
    if (cls !== undefined)  node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
}

function div(cls?: string, text?: string): HTMLDivElement           { return el('div',    cls, text); }
function span(cls?: string, text?: string): HTMLSpanElement         { return el('span',   cls, text); }
function p(cls?: string, text?: string): HTMLParagraphElement       { return el('p',      cls, text); }
function h(tag: 'h1' | 'h2', cls?: string, text?: string): HTMLHeadingElement { return el(tag, cls, text); }
function th(text?: string): HTMLTableCellElement                    { return el('th', undefined, text); }
function td(text?: string): HTMLTableCellElement                    { return el('td', undefined, text); }

function actionBtn(
    label: string,
    type: 'export-csv' | 'run-doctor' | 'open-settings' | 'request-dashboard',
): HTMLButtonElement {
    const btn = el<HTMLButtonElement>('button', 'secondary', label);
    btn.type = 'button';
    btn.addEventListener('click', () => {
        if (type === 'request-dashboard') { requestWindow(activeWindow); return; }
        vscode.postMessage({ type });
    });
    return btn;
}

// ─── SVG helpers ───────────────────────────────────────────────────────────

function svgEl<T extends SVGElement>(tag: string): T {
    return document.createElementNS('http://www.w3.org/2000/svg', tag) as T;
}

function svgText(x: number, y: number, text: string): SVGTextElement {
    const node = svgEl<SVGTextElement>('text');
    node.setAttribute('x', String(x));
    node.setAttribute('y', String(y));
    node.setAttribute('fill', 'var(--vscode-descriptionForeground)');
    node.setAttribute('font-size', '9');
    node.textContent = text;
    return node;
}
