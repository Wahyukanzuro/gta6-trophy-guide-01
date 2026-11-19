// Vice City Trophy Ledger — entrypoint.
// Copies app/ and screenshots/ into the output directory and builds dossier.json
// from the copied files, so the output is self-contained and deterministic:
// running this twice produces byte-identical output.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

// Every path is resolved from this script's own directory, never the working directory.
const repoDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");

function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

// Copy a directory tree, skipping dotfiles and dot-directories (never ship .git, .makefun, ...).
function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) copyFileSync(from, to);
  }
}

function main(): void {
  const appSrc = join(repoDir, "app");
  const shotsSrc = join(repoDir, "screenshots");
  const appDest = join(outDir, "app");
  const shotsDest = join(outDir, "screenshots");

  mkdirSync(outDir, { recursive: true });
  copyTree(appSrc, appDest);
  copyTree(shotsSrc, shotsDest);

  // Build the dossier from the copied output, not from the repo, so the
  // dossier describes exactly what is handed in.
  const dossier = buildDossier(outDir, CAPS);
  const dossierPath = join(outDir, "dossier.json");
  writeFileSync(dossierPath, dossier);
  console.log(`dossier.json: ${dossier.length} bytes sha256=${sha256Hex(Buffer.from(dossier))}`);
  console.log(`output: ${outDir}`);
}

main();
