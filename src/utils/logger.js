const levels = ['debug', 'info', 'warn', 'error'];

class Logger {
  constructor(level = 'info') {
    this.level = levels.includes(level) ? level : 'info';
  }

  shouldLog(level) {
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  format(level, message, meta) {
    const ts = new Date().toISOString();
    const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
    if (!meta) return base;
    return `${base} ${typeof meta === 'string' ? meta : JSON.stringify(meta)}`;
  }

  debug(message, meta) {
    if (this.shouldLog('debug')) console.debug(this.format('debug', message, meta));
  }

  info(message, meta) {
    if (this.shouldLog('info')) console.info(this.format('info', message, meta));
  }

  warn(message, meta) {
    if (this.shouldLog('warn')) console.warn(this.format('warn', message, meta));
  }

  error(message, meta) {
    if (this.shouldLog('error')) console.error(this.format('error', message, meta));
  }
}

module.exports = Logger;
