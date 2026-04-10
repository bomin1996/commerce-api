enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG',
};

class Logger {
  private level: LogLevel;

  constructor() {
    const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
    const levelMap: Record<string, LogLevel> = {
      error: LogLevel.ERROR,
      warn: LogLevel.WARN,
      info: LogLevel.INFO,
      debug: LogLevel.DEBUG,
    };
    this.level = levelMap[envLevel] ?? LogLevel.INFO;
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level > this.level) return;

    const timestamp = new Date().toISOString();
    const prefix = `${timestamp} [${LEVEL_NAMES[level]}]`;
    const output = level <= LogLevel.WARN ? console.error : console.log;
    output(prefix, message, ...args);
  }

  error(message: string, ...args: any[]): void { this.log(LogLevel.ERROR, message, ...args); }
  warn(message: string, ...args: any[]): void { this.log(LogLevel.WARN, message, ...args); }
  info(message: string, ...args: any[]): void { this.log(LogLevel.INFO, message, ...args); }
  debug(message: string, ...args: any[]): void { this.log(LogLevel.DEBUG, message, ...args); }
}

export const logger = new Logger();
