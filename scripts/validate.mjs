import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const js = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles.css", "utf8");

const ids = [...js.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g)].map((match) => match[1]);
const missingIds = [...new Set(ids)].filter((id) => !new RegExp(`id=["']${id}["']`).test(html));
if (missingIds.length) throw new Error(`Missing HTML ids: ${missingIds.join(", ")}`);

const htmlIds = [...html.matchAll(/id=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicateIds = htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index);
if (duplicateIds.length) throw new Error(`Duplicate HTML ids: ${[...new Set(duplicateIds)].join(", ")}`);

for (const required of [
  "Между станциями",
  "УКРАИНА",
  "ЛАТВИЯ",
  "STOP",
  "REW",
  "PLAY",
  "story-playtest",
  "creativeclaw.co",
]) {
  if (!`${html}\n${js}`.includes(required)) throw new Error(`Missing required marker: ${required}`);
}

for (const legacy of ["Комната 0", "Нулевой адрес", "REMOTE KEY", "УЧАСТНИК 01"]) {
  if (`${html}\n${js}\n${css}`.includes(legacy)) throw new Error(`Legacy product marker remains: ${legacy}`);
}

if (/ownerVoice:\s*""|manRecorded:\s*""|manLive:\s*""/.test(js)) {
  throw new Error("A required voice asset is empty");
}

console.log(`Validation passed: ${htmlIds.length} unique UI ids, new mechanics and assets present.`);
