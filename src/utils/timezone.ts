/**
 * Timezone Utilities for Frontend
 * Formatting dates in UTC+7 (WIB - Waktu Indonesia Barat)
 */

/**
 * Format a date to Indonesian locale with WIB timezone
 * @param {Date | string | number} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDateWIB(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat("id-ID", defaultOptions).format(dateObj);
}

/**
 * Format a date with time in WIB
 * @param {Date | string | number} date - The date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTimeWIB(date: Date | string | number): string {
  return formatDateWIB(date, {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Format a date to short format in WIB (dd/mm/yyyy)
 * @param {Date | string | number} date - The date to format
 * @returns {string} Formatted short date string
 */
export function formatDateShortWIB(date: Date | string | number): string {
  return formatDateWIB(date, {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Get current date in WIB
 * @returns {Date} Current date object
 */
export function getNowWIB(): Date {
  return new Date();
}
