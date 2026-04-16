#!/usr/bin/env node
// Report state of a specific topic.
// Usage:
//   node scripts/topic-state.mjs H20260416152940
//   node scripts/topic-state.mjs H20260416152940 --json

import { findProjectRoot, listTopicDirs, readTopic } from "./lib/harness-fs.mjs";

const argv = process.argv.slice(2);
const jsonMode = argv.includes("--json");
const target = argv.find((a) => !a.startsWith("--"));

if (!target) {
  console.error("Usage: node scripts/topic-state.mjs <topic-code> [--json]");
  process.exit(2);
}

const root = findProjectRoot();
const match = listTopicDirs(root).find((d) => d.name.startsWith(target));

if (!match) {
  console.error(`Topic not found: ${target}`);
  process.exit(1);
}

const topic = readTopic(match);

if (jsonMode) {
  process.stdout.write(JSON.stringify(topic, null, 2) + "\n");
  process.exit(0);
}

const meetingLabel = topic.meetingRef && topic.meetingRef.source_meetings
  ? (Array.isArray(topic.meetingRef.source_meetings)
      ? topic.meetingRef.source_meetings.join(", ")
      : topic.meetingRef.source_meetings)
  : "(none)";

console.log(`Topic:      ${topic.code}_${topic.slug}`);
console.log(`State:      ${topic.state}`);
console.log(`Meeting:    ${meetingLabel}`);

if (topic.decisionStats) {
  for (const [key, label] of [["spec", "Spec"], ["plan", "Plan"]]) {
    const s = topic.decisionStats[key];
    if (!s) { console.log(`${label.padEnd(11)} not started`); continue; }
    const parts = [
      `${s.total} decisions total`,
      `${s.consensus || 0} consensus`,
      `${s.open || 0} open`,
    ];
    if (s.escalated) parts.push(`${s.escalated} escalated`);
    if (s.skipped) parts.push(`${s.skipped} skipped`);
    console.log(`${(label + ":").padEnd(11)} ${parts.join(", ")}`);
  }
} else {
  console.log("Spec:       not started");
  console.log("Plan:       not started");
}

console.log(`Artifacts:  ${artifactList(topic.has)}`);
console.log(`Last touch: ${topic.lastTouch || "(unknown)"}`);

function artifactList(has) {
  const order = [
    ["meetingRef", "meeting-ref"],
    ["designDoc", "design-doc"],
    ["spec", "spec"],
    ["plan", "plan"],
    ["decisions", "decisions"],
    ["planConfig", "plan-config"],
    ["reflection", "reflection"],
  ];
  return order.filter(([k]) => has[k]).map(([, v]) => v).join(", ") || "(none)";
}
