// Convert a string to camel case - remove all special characters and spaces and capitalize the first letter of each word
// e.g. "my-string" -> "myString" or "my string" -> "myString"
export const camelCaseString = (str: string) => {
  return str
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
