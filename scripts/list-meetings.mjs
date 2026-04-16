#!/usr/bin/env node
// List all meetings and their linked topics.
// Usage:
//   node scripts/list-meetings.mjs              # human readable
//   node scripts/list-meetings.mjs --json       # JSON output
//   node scripts/list-meetings.mjs --status confirmed   # filter

import { findProjectRoot, listMeetingDirs, readMeeting, formatRow } from "./lib/harness-fs.mjs";

const args = parseArgs(process.argv.slice(2));
const root = findProjectRoot();
const rows = listMeetingDirs(root).map(readMeeting);

const filtered = args.status
  ? rows.filter((r) => r.status === args.status)
  : rows;

filtered.sort((a, b) => (a.code < b.code ? 1 : -1));

if (args.json) {
  process.stdout.write(JSON.stringify(filtered, null, 2) + "\n");
  process.exit(0);
}

if (filtered.length === 0) {
  console.log("No meetings found.");
  process.exit(0);
}

const widths = [16, 40, 10, 40];
console.log(formatRow(["Code", "Slug", "Status", "Topics"], widths));
console.log("-".repeat(widths.reduce((a, b) => a + b + 2, 0)));
for (const m of filtered) {
  const topics = (m.outputs || [])
    .filter((o) => typeof o === "object" && o.topic)
    .map((o) => o.topic)
    .join(",") || "(none)";
  console.log(formatRow([m.code, m.slug, m.status, topics], widths));
}

function parseArgs(argv) {
  const out = { json: false, status: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") out.json = true;
    else if (a === "--status") out.status = argv[++i];
  }
  return out;
}
