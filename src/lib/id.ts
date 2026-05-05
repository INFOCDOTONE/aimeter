import { createHash, randomUUID } from 'node:crypto';

export function createEventId(agent: string, upstreamId: string): string {
  return createHash('sha256').update(`${agent}:${upstreamId}`).digest('hex');
}

export function createInstallId(): string {
  return randomUUID();
}
