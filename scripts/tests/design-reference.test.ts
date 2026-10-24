import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");
const REFERENCE = "design/reference/venmo.DESIGN.md";

/**
 * SHA-256 of the immutable reference as originally supplied. It must never be
 * edited; create or change editable design guidance in a separate file instead.
 */
const REFERENCE_SHA256 = "819de3f3e23025041ed182c3f42a7495a7874e110d6e927bd05c0c209f4c4a99";
const REFERENCE_BYTES = 40187;

// Source-like files that are bundled or executed. Markdown docs may cite the reference.
const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs",
  ".css", ".html", ".json", ".yaml", ".yml",
]);
const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".cache", ".git"]);
const SCANNED_ROOTS = ["artifacts", "lib", "src", "scripts", "contracts", "public"];
const thisFile = path.resolve(import.meta.filename);

function* codeFiles(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* codeFiles(full);
    else if (CODE_EXTENSIONS.has(path.extname(entry.name)) && full !== thisFile) yield full;
  }
}

describe("immutable Venmo design reference", () => {
  it("is preserved byte-for-byte", () => {
    const bytes = fs.readFileSync(path.join(workspaceRoot, REFERENCE));
    expect(bytes.length).toBe(REFERENCE_BYTES);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(REFERENCE_SHA256);
  });

  it("is never referenced by runtime or build code", () => {
    const offenders: string[] = [];
    for (const scanRoot of SCANNED_ROOTS) {
      for (const file of codeFiles(path.join(workspaceRoot, scanRoot))) {
        const text = fs.readFileSync(file, "utf8");
        if (/venmo\.DESIGN|design\/reference/i.test(text)) {
          offenders.push(path.relative(workspaceRoot, file));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
