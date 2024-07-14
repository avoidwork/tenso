export const clone = typeof structuredClone === "function" ? structuredClone : arg => JSON.parse(JSON.stringify(arg));
