/**
 * @fileoverview Leveled logger. Defaults to `warn+`. Set level via
 * `setLevel()` or `window.__logLevel`. Log calls are cheap no-ops when below
 * the active level.
 *
 * @typedef {'debug' | 'info' | 'warn' | 'error' | 'none'} LogLevel
 */

/**
 * Numeric ordering of log levels used to compare verbosity. `none` is the
 * maximum, effectively silencing every call.
 * @type {Readonly<Record<LogLevel, number>>}
 */
const order = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };

/** @type {LogLevel} */
let level = (typeof window !== 'undefined' && window.__logLevel) || 'warn';

/**
 * Set the minimum log level that will be printed.
 *
 * @param {LogLevel} l - Desired level. Unknown values are ignored.
 * @returns {void}
 */
export function setLevel(l) {
  if (l in order) level = l;
}

/**
 * Test whether a level is enabled at the current threshold.
 * @param {LogLevel} l
 * @returns {boolean}
 */
function shouldLog(l) {
  return order[l] >= order[level];
}

/**
 * Prefix log entries with a bracketed level tag for easy `grep`-ing.
 * @param {LogLevel} l
 * @param {any[]} args
 * @returns {any[]}
 */
function fmt(l, args) {
  return ['[' + l.toUpperCase() + ']', ...args];
}

/**
 * Logger facade exposing level-tagged methods. Each method forwards to the
 * matching `console` API when the level is enabled.
 *
 * @example
 * log.warn('snake collided with wall');
 */
export const log = {
  /**
   * Log a debug-level message.
   * @param {...any} a
   * @returns {void}
   */
  debug: (...a) => shouldLog('debug') && console.debug(...fmt('debug', a)),
  /**
   * Log an info-level message.
   * @param {...any} a
   * @returns {void}
   */
  info: (...a) => shouldLog('info') && console.info(...fmt('info', a)),
  /**
   * Log a warn-level message.
   * @param {...any} a
   * @returns {void}
   */
  warn: (...a) => shouldLog('warn') && console.warn(...fmt('warn', a)),
  /**
   * Log an error-level message.
   * @param {...any} a
   * @returns {void}
   */
  error: (...a) => shouldLog('error') && console.error(...fmt('error', a)),
};
