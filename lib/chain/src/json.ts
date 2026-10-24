export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Converts decoded contract values to JSON: bigints become decimal strings,
 * arrays and plain objects are converted recursively.
 */
export function toJsonSafe(value: unknown): JsonValue {
  if (typeof value === "bigint") return value.toString();
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Cannot store ${value} as JSON.`);
    return value;
  }
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toJsonSafe(item)]),
    );
  }
  throw new Error(`Cannot store a ${typeof value} as JSON.`);
}
