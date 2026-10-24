import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND, type BrandConfig } from "../../src/brand/brand.config";
import { BRAND_HISTORY, type BrandHistory } from "../../src/brand/brand-history";

/**
 * Automates the product spec's "Final check": no hardcoded hex colors, app
 * name, demo names, bank names or fonts outside BRAND, so the product can be
 * rebranded by editing src/brand/brand.config.ts alone.
 *
 * The brand values searched for are read from BRAND and from BRAND_HISTORY
 * (src/brand/brand-history.ts), never written here. The history keeps every
 * value BRAND has held, so after a rebrand the old name, demo identities and
 * fonts are still searched for, and exceptions keep matching what they did.
 */

const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");
const toPosix = (p: string) => p.split(path.sep).join("/");
const thisFile = toPosix(path.relative(workspaceRoot, import.meta.filename));

// Application source. docs/ (product-spec.md, plans/), the immutable design
// reference under design/ and the root DESIGN.md are outside these roots, so
// they are allowed by construction.
const SCANNED_ROOTS = ["artifacts", "lib", "src", "scripts", "contracts", "public"];

// Files that are bundled, executed or served. Markdown is documentation, and
// .toml only appears in Replit artifact metadata (.replit-artifact/), which the
// app never ships.
const SCANNED_EXTENSIONS = new Set([
  ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs",
  ".css", ".scss", ".html", ".json", ".yaml", ".yml", ".svg", ".sol", ".sh",
]);

type Kind = "hex color" | "brand color" | "app name" | "demo name" | "bank name" | "font";

/** Directories never scanned, with the reason. Paths end with "/". */
const EXCLUDED_DIRS: Record<string, string> = {
  "src/brand/": "the brand source itself and its value history",
  "artifacts/pitch-deck/src/.sdm/":
    "vendored slides runtime and editor: its colors are editor chrome (selection outlines, error states) and its font list is the catalog the editor offers",
  "lib/api-client-react/src/generated/": "Orval output generated from lib/api-spec/openapi.yaml, which is scanned",
  "lib/api-zod/src/generated/": "Orval output generated from lib/api-spec/openapi.yaml, which is scanned",
};

/** Committed files regenerated from BRAND (directly or via tokens.json) -> generator. */
const GENERATED_FILES: Record<string, string> = {
  "artifacts/trellis-design/tokens.json": "artifacts/trellis-design/scripts/sync-brand.mjs",
  "artifacts/trellis-design/src/brand-snapshot.tsx": "artifacts/trellis-design/scripts/sync-brand.mjs",
  "artifacts/trellis-design/src/brand-vars.css": "artifacts/trellis-design/scripts/sync-brand.mjs",
  "artifacts/trellis-design/src/generated/tokens.tsx": "artifacts/trellis-design/scripts/build-tokens.mjs",
  "artifacts/trellis-design/src/index.css": "artifacts/trellis-design/scripts/build-tokens.mjs",
  "artifacts/trellis-design/public/favicon.svg": "artifacts/trellis-design/scripts/build-tokens.mjs",
};

/**
 * The asset files BRAND points at. They are written from BRAND by the Vite
 * brand plugin, or replaced by hand with the new logo when rebranding.
 */
const BRAND_ASSET_FILES = [BRAND.logo.mark, BRAND.logo.wordmark, BRAND.favicon, BRAND.ogImage].map(
  (p) => `public${p}`,
);

interface Exception {
  file: string;
  kinds: Kind[];
  /** Only these exact matches are allowed. Omitted: any match of these kinds. */
  values?: string[];
  reason: string;
}

/** Intentional exceptions. An entry that no longer matches anything fails the test. */
const EXCEPTIONS: Exception[] = [
  ...[
    "artifacts/trellis/src/components/ui/chart.tsx",
    "artifacts/mockup-sandbox/src/components/ui/chart.tsx",
    "artifacts/trellis-design/docs/scaffold/ui/chart.tsx",
  ].map((file) => ({
    file,
    kinds: ["hex color"] as Kind[],
    values: ["#ccc", "#fff"],
    reason: "shadcn chart selectors that find Recharts' built-in default strokes to restyle them with theme tokens; they match a color, they do not set one",
  })),
  {
    file: "artifacts/trellis-design/scripts/build-tokens.mjs",
    kinds: ["hex color"],
    values: ["#000000", "#ffffff"],
    reason: "black or white favicon letter, picked for contrast against the generated primary color",
  },
  {
    file: "artifacts/trellis-design/index.html",
    kinds: ["app name", "font"],
    reason: "title, description and font stylesheet are rewritten from BRAND by scripts/sync-brand.mjs on every token build",
  },
  {
    file: "artifacts/mockup-sandbox/index.html",
    kinds: ["font"],
    reason: "Canvas scaffold preloads a catalog of Google fonts for mockups; the brand font is one entry among many",
  },
  {
    file: "artifacts/mockup-sandbox/src/index.css",
    kinds: ["font"],
    reason: "Canvas scaffold's default sans font; it is not derived from BRAND, and brand mockups use the design system theme",
  },
  {
    file: "artifacts/pitch-deck/src/slideLoader.ts",
    kinds: ["hex color"],
    values: ["#1a1a1a", "#fca5a5"],
    reason: "slides scaffold error placeholder shown when a slide fails to load",
  },
  {
    file: "artifacts/pitch-deck/scripts/sdmValidation.ts",
    kinds: ["hex color"],
    values: ["#0F172A"],
    reason: "example value inside a slide validation error message",
  },
  {
    file: "artifacts/pitch-deck/src/widgets/ImportedChart.tsx",
    kinds: ["hex color", "font"],
    reason: "slides scaffold widget for charts imported from PPTX files, which keeps the imported chart's palette and font; no slide uses it",
  },
];

const HEX_COLOR = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;
const IS_HEX_COLOR = new RegExp(`^${HEX_COLOR.source}$`);

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface BrandLiteral {
  kind: Kind;
  value: string;
}

/** Every literal value in a BRAND config. */
function brandLiterals(brand: BrandConfig): BrandLiteral[] {
  const { demo, fonts } = brand;
  return [
    { kind: "app name" as Kind, value: brand.appName },
    ...[demo.familyName, demo.parent, ...demo.funders, demo.dependent].map((value) => ({
      kind: "demo name" as Kind,
      value,
    })),
    ...demo.banks.map((value) => ({ kind: "bank name" as Kind, value })),
    ...[fonts.heading, fonts.body, fonts.googleFontsUrl].map((value) => ({ kind: "font" as Kind, value })),
    // Hex colors are caught by HEX_COLOR; this covers BRAND colors in other notations.
    ...Object.values(brand.colors)
      .filter((value) => !IS_HEX_COLOR.test(value))
      .map((value) => ({ kind: "brand color" as Kind, value })),
  ].filter(({ value }) => value.trim() !== "");
}

type HistoryKind = Exclude<Kind, "hex color">;

const HISTORY_KEYS: Record<HistoryKind, keyof BrandHistory> = {
  "app name": "appNames",
  "demo name": "demoNames",
  "bank name": "bankNames",
  font: "fonts",
  "brand color": "colors",
};

function historyLiterals(history: BrandHistory): BrandLiteral[] {
  return (Object.entries(HISTORY_KEYS) as [HistoryKind, keyof BrandHistory][]).flatMap(([kind, key]) =>
    history[key].map((value) => ({ kind, value })),
  );
}

const literalKey = ({ kind, value }: BrandLiteral) => `${kind}: ${value}`;

/** Current BRAND values plus every recorded past value, deduplicated. */
function searchedLiterals(brand: BrandConfig, history: BrandHistory): BrandLiteral[] {
  const seen = new Set<string>();
  return [...brandLiterals(brand), ...historyLiterals(history)].filter(
    (literal) => literal.value.trim() !== "" && !seen.has(literalKey(literal)) && seen.add(literalKey(literal)),
  );
}

/** BRAND values that are not yet recorded in the history. */
function unrecorded(brand: BrandConfig, history: BrandHistory): string[] {
  const recorded = new Set(historyLiterals(history).map(literalKey));
  const missing = brandLiterals(brand)
    .map(literalKey)
    .filter((key) => !recorded.has(key));
  return [...new Set(missing)];
}

interface Finding {
  line: number;
  kind: Kind;
  value: string;
}

type Scanner = (text: string) => Finding[];

function makeScanner(literals: BrandLiteral[]): Scanner {
  const patterns = literals.map(({ kind, value }) => ({
    kind,
    // Whole, case-sensitive values only: the app name in copy is caught;
    // lowercase slugs, package names and identifiers such as <AppName>Logo are
    // not brand copy.
    pattern: new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(value)}(?![A-Za-z0-9])`, "g"),
  }));
  return (text) => {
    const findings: Finding[] = [];
    text.split("\n").forEach((content, index) => {
      for (const match of content.matchAll(HEX_COLOR)) {
        findings.push({ line: index + 1, kind: "hex color", value: match[0] });
      }
      for (const { kind, pattern } of patterns) {
        for (const match of content.matchAll(pattern)) {
          findings.push({ line: index + 1, kind, value: match[0] });
        }
      }
    });
    return findings;
  };
}

/** Tracked and untracked-but-not-ignored files, so dependencies and build output are skipped. */
function sourceFiles(): string[] {
  const output = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", ...SCANNED_ROOTS],
    { cwd: workspaceRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const files = new Set(output.split("\0").filter(Boolean));
  return [...files]
    .filter((file) => SCANNED_EXTENSIONS.has(path.extname(file)))
    .filter((file) => file !== thisFile)
    .filter((file) => !Object.keys(EXCLUDED_DIRS).some((dir) => file.startsWith(dir)))
    .filter((file) => fs.existsSync(path.join(workspaceRoot, file)))
    .sort();
}

const isGenerated = (file: string) => file in GENERATED_FILES || BRAND_ASSET_FILES.includes(file);

const exceptionFor = (file: string, finding: Finding) =>
  EXCEPTIONS.find(
    (e) =>
      e.file === file &&
      e.kinds.includes(finding.kind) &&
      (e.values === undefined || e.values.includes(finding.value)),
  );

let sourceCache: [string, string][] | undefined;

/** Scanned files that are not generated, with their text (read once). */
function scannedSources(): [string, string][] {
  sourceCache ??= sourceFiles()
    .filter((file) => !isGenerated(file))
    .map((file) => [file, fs.readFileSync(path.join(workspaceRoot, file), "utf8")]);
  return sourceCache;
}

function scanWorkspace(scan: Scanner) {
  const violations: string[] = [];
  const usedExceptions = new Set<Exception>();
  for (const [file, text] of scannedSources()) {
    for (const finding of scan(text)) {
      const exception = exceptionFor(file, finding);
      if (exception) usedExceptions.add(exception);
      else violations.push(`${file}:${finding.line} ${finding.kind} "${finding.value}"`);
    }
  }
  const stale = EXCEPTIONS.filter((e) => !usedExceptions.has(e)).map(
    (e) => `${e.file} (${e.kinds.join(", ")}${e.values ? `: ${e.values.join(", ")}` : ""})`,
  );
  return { violations, stale };
}

/** The history after recording a BRAND config's values, as a rebrand would. */
function recordBrand(history: BrandHistory, brand: BrandConfig): BrandHistory {
  const next: BrandHistory = structuredClone(history);
  for (const { kind, value } of brandLiterals(brand)) {
    const list = next[HISTORY_KEYS[kind as HistoryKind]];
    if (!list.includes(value)) list.push(value);
  }
  return next;
}

/** A complete rebrand to obviously fake values, for the regression case. */
const REBRANDED: BrandConfig = {
  ...BRAND,
  appName: "Probe Rebrand",
  colors: { ...BRAND.colors, hairline: "rgba(1,2,3,0.5)" },
  fonts: { heading: "Probe Serif", body: "Probe Sans", googleFontsUrl: "https://fonts.example.test/probe.css" },
  demo: {
    ...BRAND.demo,
    familyName: "The Probe Family",
    parent: "Probe Parent",
    funders: ["Probe Funder"],
    dependent: "Probe Kid",
    banks: ["Probe Bank"],
  },
};

const scanCurrent = makeScanner(searchedLiterals(BRAND, BRAND_HISTORY));

describe("brand values come only from BRAND", () => {
  it("searches for every BRAND value", () => {
    const values = searchedLiterals(BRAND, BRAND_HISTORY).map((l) => l.value);
    expect(values).toContain(BRAND.appName);
    expect(values).toEqual(expect.arrayContaining([BRAND.demo.parent, BRAND.demo.dependent]));
    expect(values).toEqual(expect.arrayContaining(BRAND.demo.funders));
    expect(values).toEqual(expect.arrayContaining(BRAND.demo.banks));
    expect(values).toEqual(expect.arrayContaining([BRAND.fonts.heading, BRAND.fonts.body]));
  });

  it("has every current BRAND value recorded in the brand history", () => {
    // After a rebrand, add these to src/brand/brand-history.ts (never remove
    // old entries) so the previous values stay forbidden in source.
    expect(unrecorded(BRAND, BRAND_HISTORY)).toEqual([]);
  });

  it("flags hardcoded values and ignores identifiers and lookalikes", () => {
    const sample = [
      `<h1>${BRAND.appName}</h1>`,
      `className="bg-[#12ab34] text-[#fff]" style={{ color: "#12ab34cc" }}`,
      `const hello = "Hi ${BRAND.demo.parent}, ${BRAND.demo.banks[0]} is linked";`,
      `font-family: '${BRAND.fonts.body}', sans-serif;`,
      `function ${BRAND.appName}Logo() { return "&#123;" + "#page=cards" + "#12ab34-x"; }`,
    ].join("\n");
    const found = scanCurrent(sample).map((f) => `${f.line} ${f.kind} ${f.value}`);
    expect(found).toEqual([
      `1 app name ${BRAND.appName}`,
      "2 hex color #12ab34",
      "2 hex color #fff",
      "2 hex color #12ab34cc",
      `3 demo name ${BRAND.demo.parent}`,
      `3 bank name ${BRAND.demo.banks[0]}`,
      `4 font ${BRAND.fonts.body}`,
    ]);
  });

  it("finds no hardcoded hex colors, app name, demo or bank names, or fonts outside the allowed exceptions", () => {
    // Read the value from BRAND (or a component/token derived from it) instead,
    // or, if the value is genuinely not a brand value, add a documented EXCEPTIONS entry.
    expect(scanWorkspace(scanCurrent).violations).toEqual([]);
  });

  it("keeps every exception and generated-file entry current", () => {
    const listed = [
      ...Object.keys(EXCLUDED_DIRS),
      ...Object.keys(GENERATED_FILES),
      ...EXCEPTIONS.map((e) => e.file),
    ];
    const missing = listed.filter((p) => !fs.existsSync(path.join(workspaceRoot, p)));
    expect(missing).toEqual([]);
    expect(scanWorkspace(scanCurrent).stale).toEqual([]);
  });

  it("after a rebrand, still catches the old values and keeps exceptions valid", () => {
    // Start from a history that has today's BRAND recorded (checked separately above).
    const before = recordBrand(BRAND_HISTORY, BRAND);
    // Changing BRAND alone is reported until the new values are recorded.
    expect(unrecorded(REBRANDED, before)).toEqual(
      expect.arrayContaining([`app name: ${REBRANDED.appName}`, `font: ${REBRANDED.fonts.body}`]),
    );
    const history = recordBrand(before, REBRANDED);
    expect(unrecorded(REBRANDED, history)).toEqual([]);

    const scan = makeScanner(searchedLiterals(REBRANDED, history));
    const leftovers = [
      `<h1>${BRAND.appName}</h1>`,
      `<p>${BRAND.demo.parent} linked ${BRAND.demo.banks[0]}</p>`,
      `font-family: "${BRAND.fonts.body}";`,
      `<p>${REBRANDED.appName}</p>`,
    ].join("\n");
    expect(scan(leftovers).map((f) => `${f.line} ${f.kind} ${f.value}`)).toEqual([
      `1 app name ${BRAND.appName}`,
      `2 demo name ${BRAND.demo.parent}`,
      `2 bank name ${BRAND.demo.banks[0]}`,
      `3 font ${BRAND.fonts.body}`,
      `4 app name ${REBRANDED.appName}`,
    ]);

    // Unchanged source, including scaffold files that happen to use the old
    // brand font, still passes, and no exception goes stale.
    const result = scanWorkspace(scan);
    expect(result.violations).toEqual([]);
    expect(result.stale).toEqual([]);
  });
});
