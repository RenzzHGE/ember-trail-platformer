// Ember Trail — the entry program (Node 22, standard library only).
//
// It hands the game in: it copies this repository's game/ (the playable
// game, plain static files a desktop browser loads offline) and
// screenshots/ (four real renders of the game) into the output directory
// and writes output/dossier.json, the summary the judge reads, using the
// vendored make.fun library. The scorer re-builds the same dossier from
// the same files and requires the two to match byte for byte.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for
// /output, e.g.:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps (reference/gate.json in the kit): text_max_bytes is
// the only one that shapes the dossier's bytes; the rest refuse an entry
// the scorer would refuse, so the program fails in the same places.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyEntry() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
  }
  writeFileSync(
    join(outputDir, 'dossier.json'),
    buildDossier(outputDir, DOSSIER_CAPS),
  );
}

copyEntry();
