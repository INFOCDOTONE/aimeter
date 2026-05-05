import type { ParseResult } from './types.js';

export interface JsonlParser {
  readonly agent: string;
  parseLine(line: string, sourceFile: string): ParseResult;
}
