// Convert a string to camel case - remove all special characters and spaces and capitalize the first letter of each word
// e.g. "my-string" -> "myString" or "my string" -> "myString"
export const camelCaseString = (str: string) => {
  return str
    .replace(/[^a-zA-Z0-9 ]+/g, "") // Remove special characters
    .trim()
    .split(/[\s_]+/) // Split by spaces or underscores
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
};
