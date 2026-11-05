import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeAchievements, analyzeTreasures, ownedItem } from '../reference/achievements.mjs';
import { analyzeSlot, requirementResult, checkpoints } from '../reference/rules.mjs';
import { trueEndingQuests } from '../reference/risk-data.mjs';

const catalog = { bells: {}, quests: [], items: [{ id: 'T_12002', name: '金银香囊', category: 'goods' }],
  achievements: Array.from({ length: 66 }, (_, i) => ({ id: 'ACH_' + String(i + 1).padStart(3, '0'), name: '测试成就', description: '' })) };
function slot() { return { PBZGameSystem: { CycleCount: 0 }, Narrative: { NarrativeSavedQuests: [] }, EventPipeline: { GlobalTags: [] }, Inventory: { InventoryInfos: {} } }; }
const active = (id, branches = []) => ({ QuestClass: '/Game/' + id + '.' + id + '_C', QuestCompletion: 'EQuestCompletion::QC_Started', CompletedBranches: branches, QuestBranches: [] });
const saved = (extra = {}) => ({ UnlockedIds: [], Counters: {}, CompletedElements: {}, ...extra });

test('成就表覆盖66项，缺少账号记录时不能一律判为未解锁', () => {
  const a = analyzeAchievements(undefined, slot(), catalog);
  assert.equal(a.rows.length, 66); assert.equal(a.known, undefined);
  assert.ok(a.rows.every(r => r.state === 'unknown'));
});
test('账号成就独立于旧槽位任务，预警继续使用当前槽位', () => {
  const s = slot(); s.Narrative.NarrativeSavedQuests.push({ ...active('GuiTu'), QuestCompletion: 'EQuestCompletion::QC_Failed' });
  const a = analyzeAchievements(saved({ UnlockedIds: ['ACH_035'] }), s, catalog);
  assert.equal(a.rows.find(a => a.id === 'ACH_035').state, 'done');
  const r = analyzeSlot(s, catalog, a).gates.find(g => g.id === 'pangzhen').items.find(i => i.quest === 'GuiTu');
  assert.equal(r.satisfied, false); assert.equal(r.state, 'failed');
});
test('饰品进度读取专用集合，不混入旧图鉴计数和强化等级', () => {
  const a = analyzeAchievements(saved({ Counters: { ACH_046: 99, __ACH_046_Accessory: 21 }, CompletedElements: { ACH_046: ['wrong'] } }), slot(), catalog);
  assert.equal(a.rows.find(a => a.id === 'ACH_046').progress.value, 21);
});
test('只计算合成整花集合，去重且不把背包花瓣数当整花数', () => {
  const s = slot(); s.Inventory.InventoryInfos = { F_01: { MaxAmount: 100 }, F_02: { MaxAmount: 100 } };
  const a = analyzeAchievements(saved({ CompletedElements: { ACH_044: ['FlowerA', 'FlowerA', 'FlowerB'] } }), s, catalog);
  assert.equal(a.rows.find(a => a.id === 'ACH_044').progress.value, 2);
});
test('消费材料后的计数保留，达到阈值不等于已记录解锁', () => {
  const s = slot(); s.Inventory.InventoryInfos.Item_002 = { CurrentAmount: 0, MaxAmount: 10 };
  const r = analyzeAchievements(saved({ Counters: { ACH_043: 10 } }), s, catalog).rows.find(a => a.id === 'ACH_043');
  assert.equal(r.progress.value, 10); assert.equal(r.state, 'active');
});
test('交掉珍宝后数量归零，累计获取记录仍能证明已拾取', () => {
  const s = slot(); s.Inventory.InventoryInfos.T_12002 = { CurrentAmount: 0, MaxAmount: 1 };
  assert.equal(ownedItem(s, 'goods', 'T_12002').owned, true);
  const item = analyzeSlot(s, catalog).gates.find(g => g.id === 'opera').items[0];
  assert.equal(item.satisfied, true);
});
test('原生交付分支可证明珍宝拿到，不依赖当前背包数量', () => {
  const s = slot(); s.Narrative.NarrativeSavedQuests.push(active('MiaoShouKongKong', ['6-1']));
  assert.equal(analyzeSlot(s, catalog).gates.find(g => g.id === 'opera').items[0].satisfied, true);
});

test('小张按地区交付归档，背包归零或仅保留原生分支仍确认本地区收齐', () => {
  const s = slot(), q = active('MiaoShouKongKong', ['3-1']);
  q.QuestBranches.push({ BranchID: '1-1', BranchType: 'EBranchType::BranchCompleted' });
  s.Narrative.NarrativeSavedQuests.push(q);
  const groups = analyzeTreasures(s, catalog);
  assert.ok(groups.filter(g => ['1-1', '3-1'].includes(g.branch)).every(g => g.handedIn && g.collected && g.items.every(i => i.owned)));
  assert.equal(groups.find(g => g.branch === '4-1').handedIn, false);
});

test('珍宝只认本周目，旧周目获取或缺少获取周目不会冒充收齐', () => {
  const s = slot(); s.PBZGameSystem.CycleCount = 1;
  s.Inventory.InventoryInfos.T_05001 = { AcquiredCycle: 0, MaxAmount: 1, CurrentAmount: 0 };
  s.Inventory.InventoryInfos.T_05002 = { AcquiredCycle: 1, MaxAmount: 1, CurrentAmount: 0 };
  s.Inventory.InventoryInfos.T_05003 = { MaxAmount: 1, CurrentAmount: 1 };
  const group = analyzeTreasures(s, catalog).find(g => g.branch === '3-1');
  assert.deepEqual(group.items.map(i => [i.owned, i.known]), [[false, true], [true, true], [false, false]]);
  assert.equal(group.collected, false);
});

test('本地区收集分支完成只证明收齐，仍保留未交付状态', () => {
  const s = slot(); s.Narrative.NarrativeSavedQuests.push(active('MiaoShouKongKong', ['3']));
  const group = analyzeTreasures(s, catalog).find(g => g.branch === '3-1');
  assert.equal(group.collected, true); assert.equal(group.handedIn, false);
});
test('五条丝带分别读取原生标签，已有成就不跳过本周目检查', () => {
  const s = slot(); s.EventPipeline.GlobalTags = [1, 2, 3, 4].map(i => 'ljc.沐小葵.获得丝带' + i);
  const a = analyzeAchievements(saved({ UnlockedIds: ['ACH_058'] }), s, catalog);
  let r = analyzeSlot(s, catalog, a).gates.find(g => g.id === 'luxiaokui').items[0];
  assert.equal(r.progress, '4/5'); assert.equal(r.satisfied, false);
  s.EventPipeline.GlobalTags.push('ljc.沐小葵.获得丝带5');
  r = analyzeSlot(s, catalog, a).gates.find(g => g.id === 'luxiaokui').items[0]; assert.equal(r.satisfied, true);
});
test('完成其他结局分支不能冒充无根仙露交付', () => {
  const q = { ...active('XiaoCui', ['4-B', '5']), QuestCompletion: 'EQuestCompletion::QC_Succeded' };
  assert.equal(requirementResult({ branch: '4-A', branchOnly: true }, q).satisfied, false);
  q.CompletedBranches.push('4-A'); assert.equal(requirementResult({ branch: '4-A', branchOnly: true }, q).satisfied, true);
});
test('有分歧的陈柱选项持续要求核对，不因赎罪名单结束自动变绿', () => {
  const s = slot(); s.Narrative.NarrativeSavedQuests.push({ ...active('YongShengDaoZhu'), QuestCompletion: 'EQuestCompletion::QC_Succeded' });
  const r = analyzeSlot(s, catalog).gates.find(g => g.id === 'mountain').items.find(i => i.verification === '来源存在分歧');
  assert.equal(r.satisfied, false); assert.equal(r.mode, 'manual'); assert.equal(r.otherSources.length, 2);
});
test('山庄前十任务与终局龙柱分开，战前不要求取得战后头带', () => {
  assert.equal(trueEndingQuests.length, 10); assert.ok(!trueEndingQuests.includes('XueMaiJueXing'));
  assert.equal(checkpoints.find(g => g.id === 'crusher').requirements[0].branch, '5');
  assert.ok(checkpoints.find(g => g.id === 'crusher-reward').requirements.some(r => r.item === 'TU_11007'));
});
