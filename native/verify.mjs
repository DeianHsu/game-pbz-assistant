// Compare the native executable with the reference implementation against the same local saves.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, rmdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readReferenceSnapshot } from '../reference/state.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const exe = process.argv[2] ? resolve(process.argv[2]) : join(root, 'release', 'PBZ-Quest-Guard-' + version + '-native-win-x64.exe');
const work = join(root, '.local');
mkdirSync(work, { recursive: true });
const temp = mkdtempSync(join(work, 'native-verify-'));
const output = join(temp, 'diagnosis.json');
let native;
try {
  const process = spawnSync(exe, ['--diagnose', output], { windowsHide: true, timeout: 60000 });
  if (process.error) throw process.error;
  native = JSON.parse(readFileSync(output, 'utf8'));
  if (process.status !== 0 || native.error) throw new Error(native.error || '原生程序退出码 ' + process.status);
} finally {
  rmSync(output, { force: true });
  rmdirSync(temp);
}

const old = readReferenceSnapshot();
const total = {};
const issues = [];
function compare(scope, slot, key, expected, actual) {
  total[scope] = (total[scope] || 0) + 1;
  if (JSON.stringify(expected) !== JSON.stringify(actual)) issues.push({ scope, slot, key, expected, actual });
}
function rows(scope, slot, expected, actual) {
  const before = new Map(expected.map(x => [x[0], x.slice(1)]));
  const after = new Map(actual.map(x => [x[0], x.slice(1)]));
  for (const key of new Set([...before.keys(), ...after.keys()])) compare(scope, slot, key, before.get(key), after.get(key));
}

compare('accounts', '', '', old.accounts.length, native.accounts);
compare('catalog', '', '', [old.catalog.quests.length, old.catalog.items.length, old.catalog.maps.length, old.catalog.achievements.length],
  [native.quests, native.items, native.maps, native.achievements]);
compare('catalog warnings', '', '', old.catalog.warnings, native.warnings);
compare('slots', '', '', old.accounts.reduce((sum, account) => sum + account.states.length, 0), native.slots);
for (const [index, account] of old.accounts.entries()) for (const state of account.states) {
  const slot = state.selectedSlot;
  const next = native.checks[index]?.find(s => s.slot === slot);
  if (!next) {
    issues.push({ scope: 'slots', slot, key: 'missing' });
    continue;
  }
  compare('stage', slot, slot, state.stage.rank, next.stage);
  compare('bai xue route', slot, '', [state.baiXueStep.id, state.baiXueStep.title || '', state.baiXueStep.bell || ''], next.baiXueStep);
  rows('gates', slot, state.gates.map(g => [g.id, !!g.available, !!g.passed,
    g.items.map(i => [!!i.available, !!i.satisfied, i.state])]), next.gates);
  rows('quest failures', slot, state.questFailures.map(q => [q.id, q.state, q.failure.reason, q.failure.evidence]), next.questFailures);
  rows('region totals', slot, state.collections.regions.map(r => [r.id, r.done, r.total]), next.regions.map(r => r.slice(0, 3)));
  rows('map points', slot, state.collections.regions.flatMap(r => r.points.map(p => [p.key, p.name, p.state, p.access.state])), next.regions.flatMap(r => r[3]));
  rows('collectibles', slot, state.collectibles.items.map(i => [i.key, i.state, i.access.state]), next.collectibles);
  rows('achievements', slot, state.achievements.rows.map(a => [a.id, a.state, a.progress?.value ?? null]), next.achievements);
  rows('treasures', slot, state.achievements.treasures.map(t => [t.branch, t.handedIn, t.collected]), next.treasures);
  rows('quest offers', slot, state.quests.filter(q => q.canAccept).map(q => {
    const [t] = q.navigation.targets;
    return [q.id, q.stateLabel, t.area, t.person, t.place, t.bell, t.next];
  }), next.questOffers);
  rows('quest targets', slot, state.quests.map(q => [q.id, q.state, q.navigation.riskLevel,
    q.navigation.targets.map(t => [t.mapId, t.person, t.access.state])]), next.quests);
}
if (!Array.isArray(native.pages) || native.pages.length !== 7 || native.pages.some(count => !Number.isInteger(count) || count < 0))
  issues.push({ scope: 'pages', actual: native.pages });
console.log(JSON.stringify({ accounts: native.accounts, slots: native.slots, checks: total, pageRows: native.pages, differences: issues.length,
  samples: issues.slice(0, 12) }, null, 2));
if (issues.length) process.exitCode = 1;
