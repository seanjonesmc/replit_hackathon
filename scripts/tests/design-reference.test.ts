import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");

/**
 * The immutable design references as originally supplied, with their SHA-256
 * and size. They must never be edited; create or change editable design
 * guidance in DESIGN.md instead. The Venmo reference is the historical starting
 * point; the app mockup is the current visual source.
 */
const REFERENCES = [
  {
    file: "design/reference/venmo.DESIGN.md",
    sha256: "819de3f3e23025041ed182c3f42a7495a7874e110d6e927bd05c0c209f4c4a99",
    bytes: 40187,
  },
  {
    file: "design/reference/trellis-app-mockup.html",
    sha256: "aac2b935dffd998f8601bc3c25195ec7d9922e5a5d39ed096d4d263d13db6101",
    bytes: 45813,
  },
];

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

describe("immutable design references", () => {
  it.each(REFERENCES)("preserves $file byte-for-byte", ({ file, sha256, bytes: size }) => {
    const bytes = fs.readFileSync(path.join(workspaceRoot, file));
    expect(bytes.length).toBe(size);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(sha256);
  });

  it("are never referenced by runtime or build code", () => {
    const offenders: string[] = [];
    for (const scanRoot of SCANNED_ROOTS) {
      for (const file of codeFiles(path.join(workspaceRoot, scanRoot))) {
        const text = fs.readFileSync(file, "utf8");
        if (/venmo\.DESIGN|trellis-app-mockup|design\/reference/i.test(text)) {
          offenders.push(path.relative(workspaceRoot, file));
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
