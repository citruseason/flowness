// Minimal harness filesystem helpers. No external dependencies.
// Used by: list-meetings.mjs, list-topics.mjs, topic-state.mjs

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Frontmatter parser — supports a limited subset sufficient for harness files:
//   - Scalars:  key: value
//   - Quoted:   key: "value with: colon"
//   - Lists:    key:\n  - item\n  - item
//   - Nested simple maps under list items are returned as { _raw: "..." }.
// Returns { data: {}, body: "..." } or { data: {}, body: "...full text..." }
// when no frontmatter is present.
// ---------------------------------------------------------------------------
export function parseFrontmatter(text) {
  if (!text.startsWith("---")) {
    return { data: {}, body: text };
  }
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: text };

  const header = text.slice(3, end).replace(/^\n/, "");
  const body = text.slice(end + 4).replace(/^\n/, "");

  const data = {};
  const lines = header.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) { i++; continue; }

    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1];
    const rest = m[2];

    if (rest === "") {
      // list or nested block
      const items = [];
      i++;
      while (i < lines.length && /^(\s{2,}-\s+|\s{2,}[A-Za-z])/.test(lines[i])) {
        const itemLine = lines[i];
        if (/^\s{2,}-\s+/.test(itemLine)) {
          // new list item
          const raw = itemLine.replace(/^\s{2,}-\s+/, "");
          if (raw.includes(":")) {
            // object-style item: collect inline + following indented lines
            const obj = {};
            const im = raw.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
            if (im) obj[im[1]] = stripQuotes(im[2]);
            i++;
            while (i < lines.length && /^\s{4,}[A-Za-z]/.test(lines[i])) {
              const sub = lines[i].trim();
              const sm = sub.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
              if (sm) obj[sm[1]] = stripQuotes(sm[2]);
              i++;
            }
            items.push(obj);
          } else {
            items.push(stripQuotes(raw));
            i++;
          }
        } else {
          i++;
        }
      }
      data[key] = items;
    } else {
      data[key] = stripQuotes(rest);
      i++;
    }
  }
  return { data, body };
}

function stripQuotes(s) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

// ---------------------------------------------------------------------------
// Project root detection — walks up from cwd until CLAUDE.md or harness/ is found.
// ---------------------------------------------------------------------------
export function findProjectRoot(start = process.cwd()) {
  let dir = start;
  while (true) {
    if (existsSync(join(dir, "CLAUDE.md")) || existsSync(join(dir, "harness"))) {
      return dir;
    }
    const parent = join(dir, "..");
    if (parent === dir) return start;
    dir = parent;
  }
}

// ---------------------------------------------------------------------------
// Meeting & topic discovery.
// ---------------------------------------------------------------------------
export function listMeetingDirs(root) {
  const base = join(root, "harness", "meetings");
  if (!existsSync(base)) return [];
  return readdirSync(base)
    .filter((n) => /^M\d{14}_/.test(n))
    .map((n) => ({ name: n, path: join(base, n) }));
}

export function listTopicDirs(root) {
  const base = join(root, "harness", "topics");
  if (!existsSync(base)) return [];
  return readdirSync(base)
    .filter((n) => /^[HT]\d{14}_/.test(n))
    .map((n) => ({ name: n, path: join(base, n) }));
}

export function readMeeting(dir) {
  const mdPath = join(dir.path, "meeting.md");
  if (!existsSync(mdPath)) return { ...dir, malformed: true, reason: "meeting.md missing" };
  try {
    const { data } = parseFrontmatter(readFileSync(mdPath, "utf8"));
    return {
      name: dir.name,
      path: dir.path,
      code: data.code || extractCode(dir.name),
      slug: data.slug || extractSlug(dir.name),
      title: data.title || "",
      status: data.status || "draft",
      outputs: data.outputs || [],
      updated: data.updated || mtimeIso(mdPath),
    };
  } catch (err) {
    return { ...dir, malformed: true, reason: String(err.message || err) };
  }
}

export function readTopic(dir) {
  const paths = {
    designDoc: join(dir.path, "design-doc.md"),
    spec: join(dir.path, "spec.md"),
    plan: join(dir.path, "plan.md"),
    decisions: join(dir.path, "decisions.md"),
    planConfig: join(dir.path, "plan-config.md"),
    reflection: join(dir.path, "reflection.md"),
    meetingRef: join(dir.path, "meeting-ref.md"),
  };

  const out = {
    name: dir.name,
    path: dir.path,
    code: extractCode(dir.name),
    slug: extractSlug(dir.name),
    has: {
      designDoc: existsSync(paths.designDoc),
      spec: existsSync(paths.spec),
      plan: existsSync(paths.plan),
      decisions: existsSync(paths.decisions),
      planConfig: existsSync(paths.planConfig),
      reflection: existsSync(paths.reflection),
      meetingRef: existsSync(paths.meetingRef),
    },
    paths,
  };

  if (existsSync(paths.meetingRef)) {
    try {
      const { data } = parseFrontmatter(readFileSync(paths.meetingRef, "utf8"));
      out.meetingRef = data;
    } catch (_) { /* ignore */ }
  }

  if (existsSync(paths.decisions)) {
    out.decisionStats = countDecisions(readFileSync(paths.decisions, "utf8"));
  }

  out.state = classifyTopicState(out);
  out.lastTouch = latestMtime(Object.values(paths).filter(existsSync));
  return out;
}

// State classification matches design-doc.md §9.2.
export function classifyTopicState(topic) {
  if (topic.has.reflection) return "done";
  if (topic.has.planConfig) return "working";
  const s = topic.decisionStats;
  if (s) {
    if (s.plan && s.plan.open > 0) return "design-doc (in Plan cycle)";
    if (s.spec && s.spec.open > 0) return "design-doc (in Spec cycle)";
    if (s.plan && s.plan.total > 0) return "design-doc (Plan consensus)";
    if (s.spec && s.spec.total > 0) return "design-doc (Spec consensus)";
  }
  return "initialized";
}

// Parses decisions.md — expects markdown tables under `## Spec Cycle` and `## Plan Cycle`.
// Counts rows by Status column.
export function countDecisions(md) {
  const sections = splitSections(md);
  const stats = {};
  for (const [label, key] of [
    ["Spec Cycle", "spec"],
    ["Plan Cycle", "plan"],
  ]) {
    const body = sections[label];
    if (!body) continue;
    stats[key] = tallyStatusColumn(body);
  }
  return stats;
}

function splitSections(md) {
  const out = {};
  const re = /^##\s+(.+)$/gm;
  const matches = [...md.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const title = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : md.length;
    out[title] = md.slice(start, end);
  }
  return out;
}

function tallyStatusColumn(tableMd) {
  const lines = tableMd.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return { total: 0, open: 0, consensus: 0, escalated: 0, skipped: 0 };

  // Locate header + status column index.
  const headers = lines[0].split("|").map((c) => c.trim().toLowerCase());
  const statusIdx = headers.findIndex((h) => h === "status");
  if (statusIdx === -1) return { total: 0, open: 0, consensus: 0, escalated: 0, skipped: 0 };

  const stats = { total: 0, open: 0, consensus: 0, escalated: 0, skipped: 0 };
  for (let i = 2; i < lines.length; i++) {
    const row = lines[i];
    if (/^\|\s*-+\s*\|/.test(row)) continue;
    const cells = row.split("|").map((c) => c.trim());
    const status = (cells[statusIdx] || "").toLowerCase();
    if (!status) continue;
    stats.total++;
    if (stats[status] !== undefined) stats[status]++;
    else stats.open++;
  }
  return stats;
}

// ---------------------------------------------------------------------------
// Misc helpers.
// ---------------------------------------------------------------------------
export function extractCode(dirName) {
  const m = dirName.match(/^([MHT]\d{14})_/);
  return m ? m[1] : dirName;
}

export function extractSlug(dirName) {
  const m = dirName.match(/^[MHT]\d{14}_(.+)$/);
  return m ? m[1] : dirName;
}

export function mtimeIso(path) {
  try { return new Date(statSync(path).mtimeMs).toISOString(); } catch { return ""; }
}

export function latestMtime(paths) {
  let max = 0;
  for (const p of paths) {
    try { const t = statSync(p).mtimeMs; if (t > max) max = t; } catch {}
  }
  return max ? new Date(max).toISOString() : "";
}

export function formatRow(cols, widths) {
  return cols.map((c, i) => String(c == null ? "" : c).padEnd(widths[i] || 0)).join("  ").trimEnd();
}
