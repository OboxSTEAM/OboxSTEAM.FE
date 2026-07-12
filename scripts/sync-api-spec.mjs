import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SPEC_URL = "https://api.oboxsteam.website/swagger/v1/swagger.json";
const OUT_FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "specs", "oboxsteam.openapi.json");

const response = await fetch(SPEC_URL);
if (!response.ok) {
  throw new Error(`Failed to fetch OpenAPI spec (${response.status} ${response.statusText})`);
}

const body = await response.text();
await writeFile(OUT_FILE, body, "utf8");
console.log(`Wrote ${OUT_FILE} (${body.length} bytes)`);
