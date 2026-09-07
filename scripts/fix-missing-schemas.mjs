#!/usr/bin/env node
/**
 * Supplies schema definitions that `--group-strategy tag-file` drops.
 *
 * openapi-zod-client hoists non-trivial schemas to named consts. Under tag-file grouping a schema
 * shared by two tags is emitted into neither file, so the tag file references an identifier that
 * is never defined. Nothing noticed while every response was `z.any()`; once the specs started
 * declaring `application/json` the references became real and tsc failed on five of them.
 *
 * For each spec this regenerates a single-file client (where every schema IS defined, in
 * dependency order), writes the schema block to `common.ts`, and adds an import to any tag file
 * that references a name it does not define.
 *
 * Idempotent: re-running produces the same output.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCHEMA_DIR = "src/api/generated/schemas";
const SPECS = {
  customer: "../CustomerApplication/openapi.json",
  restaurant: "../RestaurantApplication/openapi.json",
  delivery: "../DeliveryExecutiveApplication/openapi.json",
  identity: "../IdentityService/openapi.json",
  wallet: "../WalletService/openapi.json",
  payment: "../PaymentGatewayIntegration/openapi.json",
  maps: "../MapsIntegration/openapi.json",
  chat: "../CommunicationService/openapi.json",
  campaign: "../CampaignService/openapi.json",
  governmentId: "../GovernmentIDValidationService/openapi.json",
  ledger: "../LedgerService/openapi.json",
  tracking: "../UserTrackingService/openapi.json",
};

/** Identifiers defined at top level in a generated file. */
function definedIn(src) {
  const names = new Set();
  for (const m of src.matchAll(/^(?:export )?const (\w+)\s*=/gm)) names.add(m[1]);
  for (const m of src.matchAll(/^import\s*\{([^}]*)\}/gm)) {
    for (const part of m[1].split(",")) {
      const n = part.trim().split(/\s+as\s+/).pop().trim();
      if (n) names.add(n);
    }
  }
  return names;
}

/** Capitalised identifiers referenced inside endpoint definitions. */
function referencedIn(src) {
  const body = src.slice(src.indexOf("makeApi("));
  const names = new Set();
  for (const m of body.matchAll(/\b([A-Z][A-Za-z0-9_]*)\b/g)) names.add(m[1]);
  return names;
}

let totalAdded = 0;
for (const [name, spec] of Object.entries(SPECS)) {
  const dir = join(SCHEMA_DIR, name);
  if (!existsSync(dir)) continue;

  const tmp = mkdtempSync(join(tmpdir(), "ozc-"));
  const single = join(tmp, "single.ts");
  try {
    execFileSync("npx", ["openapi-zod-client", spec, "-o", single, "--export-schemas"],
                 { stdio: "ignore" });
  } catch {
    console.log(`  ${name}: single-file generation failed, skipping`);
    continue;
  }
  const singleSrc = readFileSync(single, "utf8");

  // the schema block runs from the first hoisted const to `export const schemas`
  const start = singleSrc.search(/^const [A-Z]/m);
  const end = singleSrc.indexOf("export const schemas");
  if (start < 0 || end < 0) continue;
  const block = singleSrc.slice(start, end).replace(/^const /gm, "export const ");
  const available = definedIn(block);

  const tagFiles = readdirSync(dir).filter(
    (f) => f.endsWith(".ts") && !["index.ts", "facade.ts", "common.ts"].includes(f));

  const needed = new Set();
  const perFile = {};
  for (const f of tagFiles) {
    const src = readFileSync(join(dir, f), "utf8");
    const missing = [...referencedIn(src)].filter(
      (n) => available.has(n) && !definedIn(src).has(n));
    if (missing.length) {
      perFile[f] = missing;
      missing.forEach((n) => needed.add(n));
    }
  }
  if (!needed.size) continue;

  writeFileSync(join(dir, "common.ts"),
    `import { z } from "zod";\n\n` +
    `// Schemas shared across tag files. openapi-zod-client's tag-file grouping emits a shared\n` +
    `// schema into neither file; this restores them. Generated -- do not edit by hand.\n\n` +
    block.trimEnd() + "\n");

  for (const [f, missing] of Object.entries(perFile)) {
    const p = join(dir, f);
    let src = readFileSync(p, "utf8");
    const imp = `import { ${[...new Set(missing)].sort().join(", ")} } from "./common";\n`;
    const lastImport = src.lastIndexOf("\nimport ");
    const insertAt = src.indexOf("\n", lastImport + 1) + 1;
    src = src.slice(0, insertAt) + imp + src.slice(insertAt);
    writeFileSync(p, src);
    totalAdded += missing.length;
    console.log(`  ${name}/${f}: imported ${missing.join(", ")}`);
  }
}
console.log(`\n${totalAdded} missing schema references resolved`);
