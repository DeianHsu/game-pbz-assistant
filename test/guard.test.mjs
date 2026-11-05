import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { decodeContainer } from '../reference/save.mjs';
import { analyzeSlot, requirementResult } from '../reference/rules.mjs';

const active = completed => ({ QuestCompletion: 'EQuestCompletion::QC_Started', CompletedBranches: completed, QuestBranches: [] });
const catalog = { quests: [], bells: {} };
function slot(cycle = 0, recordCycle = cycle) {
  return { PBZGameSystem: { CycleCount: cycle }, Narrative: { NarrativeSavedQuests: [] }, EventPipeline: { GlobalTags: [] },
    BossRecord: { BP_Monster_ChiLian_P2: { Records: { [`${recordCycle}_3`]: { KillCount: 1 } } } } };
}
test('没有任务记录时保持未知，不产生绿色完成状态', () => {
  assert.deepEqual(requirementResult({ accepted: true }, undefined), { satisfied: false, state: 'missing' });
});
test('血肉花只检查交付分支，允许整个任务仍在进行', () => {
  assert.equal(requirementResult({ branch: 'S2' }, active(['1', 'S2'])).satisfied, true);
  assert.equal(requirementResult({ branch: 'S2' }, active(['1'])).satisfied, false);
});
test('打通密道不能代替回村口告知 NPC', () => {
  assert.equal(requirementResult({ branch: '2' }, active(['1'])).satisfied, false);
  assert.equal(requirementResult({ branch: '2' }, active(['1', '2'])).satisfied, true);
});
test('明确失败的任务不会被残留的已完成分支判为满足', () => {
  const failed = { ...active(['2']), QuestCompletion: 'EQuestCompletion::QC_Failed' };
  assert.equal(requirementResult({ branch: '2' }, failed).satisfied, false);
});
test('新枚举状态不能被已完成分支掩盖', () => {
  const unknown = { ...active(['2']), QuestCompletion: 'EQuestCompletion::QC_Future' };
  assert.deepEqual(requirementResult({ branch: '2' }, unknown), { satisfied: false, state: 'unknown' });
});
test('不能依据 TasksProgress 的数组和零值猜测完成状态', () => {
  const r = active([]); r.QuestBranches = [{ BranchID: '2', TasksProgress: [0, 0], BranchType: 'EBranchType::BranchActivating' }];
  assert.equal(requirementResult({ branch: '2' }, r).satisfied, false);
});
test('多分支截止条件要求所有分支完成', () => {
  assert.equal(requirementResult({ branches: ['3', '4'] }, active(['3'])).satisfied, false);
  assert.equal(requirementResult({ branches: ['3', '4'] }, active(['3', '4'])).satisfied, true);
});
test('不同周目的击杀记录不会污染当前截止节点', () => {
  assert.equal(analyzeSlot(slot(1, 0), catalog).gates.find(g => g.id === 'baichilian').passed, false);
  assert.equal(analyzeSlot(slot(1, 1), catalog).gates.find(g => g.id === 'baichilian').passed, true);
});
test('跨过节点与任务失败分别呈现', () => {
  const result = analyzeSlot(slot(), catalog).gates.find(g => g.id === 'baichilian');
  assert.equal(result.passed, true);
  assert.ok(result.items.every(i => i.state !== 'failed' && !i.satisfied));
  assert.ok(result.items.filter(i => !i.check).every(i => i.state === 'missing'));
});
test('任务字段缺失时停止判断', () => assert.throws(() => analyzeSlot({ PBZGameSystem: {} }, catalog), /没有可识别的任务记录/));

// Independently build a tiny authenticated fixture; production has no encoder.
const key = crypto.randomBytes(32);
function seal(data) {
  const nonce = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([Buffer.from('50425a5301010000', 'hex'), nonce, cipher.getAuthTag(), encrypted]);
}
function fixture(algorithm) {
  const raw = Buffer.from('{"test":"中文","Narrative":{}}'), name = Buffer.from('AutoSave0');
  const block = seal(algorithm ? zlib.deflateSync(raw) : raw), row = Buffer.alloc(2 + name.length + 14);
  row.writeUInt16LE(name.length); name.copy(row, 2);
  const p = 2 + name.length; row[p] = algorithm; row[p + 1] = 1; row.writeUInt32LE(raw.length, p + 2); row.writeUInt32LE(block.length, p + 10);
  const header = Buffer.alloc(12); header.write('PBZS'); header[4] = 3; header[5] = 1; header.writeUInt16LE(1, 6); header.writeUInt32LE(12 + row.length + 36, 8);
  return Buffer.concat([header, seal(Buffer.concat([header, row])), block]);
}
test('能够读取原始和 zlib 压缩的认证容器', () => {
  for (const algorithm of [0, 1]) assert.equal(decodeContainer(fixture(algorithm), key)[0].json.test, '中文');
});
test('错误密钥、加密数据损坏及截断必须报错', () => {
  const bytes = fixture(1), damaged = Buffer.from(bytes); damaged[damaged.length - 1] ^= 1;
  assert.throws(() => decodeContainer(bytes, crypto.randomBytes(32)), /解密失败/);
  assert.throws(() => decodeContainer(damaged, key), /解密失败/);
  assert.throws(() => decodeContainer(bytes.subarray(0, bytes.length - 1), key), /范围/);
});
