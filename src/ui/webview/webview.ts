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
        renderError('AIMeter received an invalid dashboard message.');
        return;
    }

    if (parsed.data.type === 'error') {
        renderError(parsed.data.message);
        return;
    }

    if (parsed.data.type === 'doctor-result') {
        renderDoctor(parsed.data.payload);
        return;
    }

    activeWindow = parsed.data.payload.window;
    renderDashboard(parsed.data.payload);
});

function renderDashboard(data: WindowDataPayload): void {
    if (app === null) {
        return;
    }

    app.replaceChildren(
        header(data),
        windowPicker(data.window),
        dashboardActions(),
        data.hasEvents ? summaryCards(data) : emptyState(),
    );

    if (!data.hasEvents) {
        return;
    }

    app.append(trendPanel(data), agentPanel(data), modelPanel(data), sessionsPanel(data));
}

function header(data: WindowDataPayload): HTMLElement {
    const container = element('div', 'title');
    container.append(element('h1', undefined, 'AIMeter'));
    container.append(element('span', 'muted', `Updated ${formatTime(data.generatedAt)}`));
    return container;
}

function windowPicker(window: WindowKey): HTMLElement {
    const container = element('div', 'picker');
    const windows: Array<{ key: WindowKey; label: string }> = [
        { key: 'today', label: 'Today' },
        { key: '7d', label: '7d' },
        { key: '30d', label: '30d' },
    ];

    for (const item of windows) {
        const button = element('button', item.key === window ? undefined : 'secondary', item.label);
        button.setAttribute('type', 'button');
        button.setAttribute('aria-pressed', String(item.key === window));
        button.addEventListener('click', () => {
            requestWindow(item.key);
        });
        container.append(button);
    }

    return container;
}

function summaryCards(data: WindowDataPayload): HTMLElement {
    const container = element('section', 'cards');
    container.append(
        summaryCard('Tokens', formatNumber(data.totals.tokens), tokenDetail(data)),
        summaryCard(
            'Estimated cost',
            `${confidenceDot(data.totals.costConfidence)}${formatUsd(data.totals.costUsdEstimated)}`,
            `${data.totals.costConfidence} confidence`,
        ),
        summaryCard('Events', formatNumber(data.totals.eventCount), `${data.recentSessions.length} sessions`),
    );
    return container;
}

function summaryCard(title: string, valueHtml: string, detail: string): HTMLElement {
    const card = element('article', 'card');
    card.append(element('h2', undefined, title));
    const value = element('div', 'card-value');
    value.innerHTML = valueHtml;
    card.append(value, element('p', 'muted', detail));
    return card;
}

function emptyState(): HTMLElement {
    const container = element('section', 'empty');
    container.append(
        element('h2', undefined, 'No events yet'),
        element('p', 'muted', 'AIMeter watches local JSONL session logs and shows data here after an AI session is recorded.'),
    );
    const actions = element('div', 'actions');
    actions.append(actionButton('Run Doctor', 'run-doctor'), actionButton('Open Settings', 'open-settings'));
    container.append(actions);
    return container;
}

function dashboardActions(): HTMLElement {
    const actions = element('div', 'actions');
    actions.append(actionButton('Export CSV', 'export-csv'), actionButton('Run Doctor', 'run-doctor'));
    return actions;
}

function renderDoctor(result: DoctorResult): void {
    if (app === null) {
        return;
    }

    const panel = element('section', 'panel');
    panel.append(element('h2', undefined, 'Doctor'));
    panel.append(element('p', 'muted', `Updated ${formatTime(result.generatedAt)}`));

    for (const check of result.checks) {
        const item = element('article', `session doctor-${check.severity}`);
        item.append(element('strong', undefined, check.name), element('span', 'muted', check.message));
        panel.append(item);
    }

    const actions = element('div', 'actions');
    actions.append(actionButton('Back to Dashboard', 'request-dashboard'), actionButton('Open Settings', 'open-settings'));
    app.replaceChildren(headerForDoctor(result), actions, panel);
}

function headerForDoctor(result: DoctorResult): HTMLElement {
    const container = element('div', 'title');
    const errors = result.checks.filter((check) => check.severity === 'error').length;
    const warnings = result.checks.filter((check) => check.severity === 'warn').length;
    container.append(element('h1', undefined, 'AIMeter'), element('span', 'muted', `${errors} errors · ${warnings} warnings`));
    return container;
}

function trendPanel(data: WindowDataPayload): HTMLElement {
    const panel = element('section', 'panel');
    panel.append(element('h2', undefined, 'Daily trend'));
    panel.append(renderTrendSvg(data));
    return panel;
}

function renderTrendSvg(data: WindowDataPayload): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 600 160');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Daily token trend');
    const maxTokens = Math.max(1, ...data.daily.map((day) => day.tokens));
    const barWidth = 520 / Math.max(1, data.daily.length);

    data.daily.forEach((day, index) => {
        const height = Math.max(2, (day.tokens / maxTokens) * 112);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(44 + index * barWidth));
        rect.setAttribute('y', String(126 - height));
        rect.setAttribute('width', String(Math.max(3, barWidth - 4)));
        rect.setAttribute('height', String(height));
        rect.setAttribute('rx', '2');
        rect.setAttribute('fill', 'var(--vscode-charts-blue)');
        rect.append(svgTitle(`${day.date}: ${formatNumber(day.tokens)} tokens`));
        svg.append(rect);
    });

    svg.append(svgText(12, 18, formatNumber(maxTokens)), svgText(12, 130, '0'));
    return svg;
}

function agentPanel(data: WindowDataPayload): HTMLElement {
    const panel = element('section', 'panel');
    panel.append(element('h2', undefined, 'By agent'));
    panel.append(...breakdownRows(data.byAgent, data.totals.tokens));
    return panel;
}

function modelPanel(data: WindowDataPayload): HTMLElement {
    const panel = element('section', 'panel');
    panel.append(element('h2', undefined, 'By model'));
    const table = element('table');
    const headerRow = element('tr');
    headerRow.append(element('th', undefined, 'Model'), element('th', undefined, 'Tokens'), element('th', undefined, 'Cost'), element('th', undefined, 'Events'));
    const thead = element('thead');
    thead.append(headerRow);
    const tbody = element('tbody');
    for (const model of data.byModel) {
        const row = element('tr');
        const cost = element('td');
        cost.innerHTML = `${confidenceDot(model.costConfidence)}${formatUsd(model.costUsdEstimated)}`;
        row.append(
            element('td', undefined, model.label),
            element('td', undefined, formatNumber(model.tokens)),
            cost,
            element('td', undefined, formatNumber(model.eventCount)),
        );
        tbody.append(row);
    }
    table.append(thead, tbody);
    panel.append(table);
    return panel;
}

function sessionsPanel(data: WindowDataPayload): HTMLElement {
    const panel = element('section', 'panel');
    panel.append(element('h2', undefined, 'Recent sessions'));
    const list = element('div', 'session-list');
    for (const session of data.recentSessions) {
        const item = element('article', 'session');
        item.append(
            element('strong', undefined, session.projectSlug),
            element('span', 'muted', `${formatTime(session.latestAt)} · ${session.agents.join(', ')} · ${session.models.join(', ')}`),
            element('span', undefined, `${formatNumber(session.tokens)} tokens · ${formatUsd(session.costUsdEstimated)} estimated`),
        );
        list.append(item);
    }
    panel.append(list);
    return panel;
}

function breakdownRows(items: WindowDataPayload['byAgent'], maxTokens: number): HTMLElement[] {
    return items.map((item) => {
        const row = element('div', 'bar-row');
        const track = element('div', 'bar-track');
        const fill = element('div', 'bar-fill');
        fill.style.width = `${Math.max(3, (item.tokens / Math.max(1, maxTokens)) * 100)}%`;
        track.append(fill);
        const cost = element('span');
        cost.innerHTML = `${confidenceDot(item.costConfidence)}${formatUsd(item.costUsdEstimated)}`;
        row.append(element('span', undefined, item.label), track, cost);
        return row;
    });
}

function actionButton(
    label: string,
    type: 'export-csv' | 'run-doctor' | 'open-settings' | 'request-dashboard',
): HTMLButtonElement {
    const button = element('button', undefined, label);
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
        if (type === 'request-dashboard') {
            requestWindow(activeWindow);
            return;
        }
        vscode.postMessage({ type });
    });
    return button;
}

function requestWindow(window: WindowKey): void {
    vscode.postMessage({ type: 'request-window', payload: { window } });
}

function renderError(message: string): void {
    if (app === null) {
        return;
    }
    const container = element('section', 'empty error');
    container.append(element('h2', undefined, 'Dashboard error'), element('p', undefined, message));
    app.replaceChildren(container);
}

function tokenDetail(data: WindowDataPayload): string {
    return `${formatNumber(data.totals.inputTokens)} in · ${formatNumber(data.totals.outputTokens)} out`;
}

function confidenceDot(confidence: WindowDataPayload['totals']['costConfidence']): string {
    return `<span class="confidence ${confidence}" title="${confidence} confidence"></span>`;
}

function formatUsd(value: number): string {
    return `$${value.toFixed(value >= 1 ? 2 : 4)}`;
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat().format(value);
}

function formatTime(iso: string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function element<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    className?: string,
    text?: string,
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tagName);
    if (className !== undefined) {
        node.className = className;
    }
    if (text !== undefined) {
        node.textContent = text;
    }
    return node;
}

function svgTitle(text: string): SVGTitleElement {
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = text;
    return title;
}

function svgText(x: number, y: number, text: string): SVGTextElement {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(x));
    label.setAttribute('y', String(y));
    label.setAttribute('fill', 'var(--vscode-descriptionForeground)');
    label.setAttribute('font-size', '11');
    label.textContent = text;
    return label;
}
