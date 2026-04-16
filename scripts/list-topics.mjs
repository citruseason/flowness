#!/usr/bin/env node
// List all topics and their current state.
// Usage:
//   node scripts/list-topics.mjs                    # human readable
//   node scripts/list-topics.mjs --json             # JSON output
//   node scripts/list-topics.mjs --state working    # filter by state

import { findProjectRoot, listTopicDirs, readTopic, formatRow } from "./lib/harness-fs.mjs";

const args = parseArgs(process.argv.slice(2));
const root = findProjectRoot();
const rows = listTopicDirs(root).map(readTopic);

const filtered = args.state
  ? rows.filter((r) => r.state === args.state)
  : rows;

filtered.sort((a, b) => (a.code < b.code ? 1 : -1));

if (args.json) {
  process.stdout.write(JSON.stringify(filtered, null, 2) + "\n");
  process.exit(0);
}

if (filtered.length === 0) {
  console.log("No topics found.");
  process.exit(0);
}

const widths = [16, 40, 32];
console.log(formatRow(["Code", "Slug", "State"], widths));
console.log("-".repeat(widths.reduce((a, b) => a + b + 2, 0)));
for (const t of filtered) {
  console.log(formatRow([t.code, t.slug, t.state], widths));
}

function parseArgs(argv) {
  const out = { json: false, state: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") out.json = true;
    else if (a === "--state") out.state = argv[++i];
  }
  return out;
}
