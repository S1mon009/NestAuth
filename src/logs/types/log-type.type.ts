export const LogTypes = ['info', 'error', 'warning'] as const;

/**
 * Type representing the allowed log types in the system, which can be 'info', 'error', or 'warning'. This type is used to ensure that only valid log types are assigned to log entries throughout the application.
 * @remarks The LogType is defined as a union of string literals, which provides type safety and better code readability when working with log entries. It helps prevent errors by restricting the log type to a predefined set of values.
 */
export type LogType = (typeof LogTypes)[number];

export default LogTypes;
