import type * as vscode from 'vscode';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private readonly channel: vscode.OutputChannel;

  public constructor(channel: vscode.OutputChannel) {
    this.channel = channel;
  }

  public debug(module: string, msg: string, meta?: Record<string, unknown>): void {
    this.write('debug', module, msg, meta);
  }

  public info(module: string, msg: string, meta?: Record<string, unknown>): void {
    this.write('info', module, msg, meta);
  }

  public warn(module: string, msg: string, meta?: Record<string, unknown>): void {
    this.write('warn', module, msg, meta);
  }

  public error(module: string, msg: string, meta?: Record<string, unknown>): void {
    this.write('error', module, msg, meta);
  }

  public show(): void {
    this.channel.show();
  }

  private write(level: LogLevel, module: string, msg: string, meta?: Record<string, unknown>): void {
    this.channel.appendLine(
      JSON.stringify({
        ts: new Date().toISOString(),
        level,
        module,
        msg,
        meta: meta ?? {},
      }),
    );
  }
}
