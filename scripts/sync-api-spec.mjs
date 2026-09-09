import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SPEC_URL = "https://api.oboxsteam.website/swagger/v1/swagger.json";
const SPEC_ID = "oboxsteam";
const OUT_FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "specs", "oboxsteam.openapi.json");

const response = await fetch(SPEC_URL);
if (!response.ok) {
  throw new Error(`Failed to fetch OpenAPI spec (${response.status} ${response.statusText})`);
}

const spec = await response.json();
if (!spec.info || typeof spec.info !== "object") {
  throw new Error("OpenAPI spec is missing info object");
}

// @reapi/mcp-openapi uses info["x-spec-id"] (else the full filename) for catalog +
// _dereferenced paths. Without this, it writes oboxsteam.openapi.json.json and can
// fail/reset the in-memory catalog to [] on Windows.
spec.info["x-spec-id"] = SPEC_ID;

const body = `${JSON.stringify(spec, null, 2)}\n`;
await writeFile(OUT_FILE, body, "utf8");
console.log(`Wrote ${OUT_FILE} (${body.length} bytes, x-spec-id=${SPEC_ID})`);
