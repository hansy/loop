/**
 * Truncates a string in the middle with an ellipsis.
 * e.g., truncateString("0x1234567890abcdef", 6, 4) returns "0x1234...cdef"
 *
 * @param str The string to truncate.
 * @param startChars The number of characters to keep at the start.
 * @param endChars The number of characters to keep at the end.
 * @param ellipsis The string to use as an ellipsis (defaults to "...").
 * @returns The truncated string, or the original string if it's shorter than startChars + endChars + ellipsis.length.
 */
export function truncateString(
  str: string | undefined | null,
  startChars: number,
  endChars: number,
  ellipsis: string = "..."
): string {
  if (!str) {
    return "";
  }
  if (str.length <= startChars + endChars + ellipsis.length) {
    return str;
  }
  const start = str.substring(0, startChars);
  const end = str.substring(str.length - endChars);
  return `${start}${ellipsis}${end}`;
}
