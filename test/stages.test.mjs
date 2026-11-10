import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectStage, isGateAvailable } from '../reference/stages.mjs';
import { analyzeSlot } from '../reference/rules.mjs';

const catalog = { quests: [], bells: {} };
const quest = (id, extra = {}) => ({ QuestClass: `/Game/${id}.${id}_C`, QuestCompletion: 'EQuestCompletion::QC_Started', QuestBranches: [], ...extra });
function slot(id = 'MainCh1-ShiXinCun', location = 'PBZ_LuJiaCun_WP') {
  return { PBZGameSystem: { CycleCount: 0, CurrentLevelName: location }, Narrative: { NarrativeSavedQuests: [quest(id)] }, EventPipeline: { GlobalTags: [] }, Inventory: {} };
}
test('陆家村阶段不会提前提醒枷笼山、戏楼、冰封回访和终局', () => {
  const result = analyzeSlot(slot(), catalog);
  assert.equal(result.stage.rank, 3);
  for (const id of ['mountain', 'qingshe', 'mirage', 'opera', 'snow', 'sanmian', 'crusher', 'ending', 'cleanup', 'mu-rewards']) assert.equal(result.gates.find(g => g.id === id).available, false, id);
  assert.ok(!result.currentQuestIds.includes('JiGuanChuan'));
  assert.ok(result.currentQuestIds.includes('LanJiaGongZi'));
});
test('提前探索正道大营只开放当地风险，不解锁全部后期提醒', () => {
  const result = analyzeSlot(slot('MainCh1-ShiXinCun', 'PBZ_Zhengdaodaying_WP'), catalog);
  assert.equal(result.stage.rank, 3);
  assert.equal(result.gates.find(g => g.id === 'qixing').available, true);
  assert.equal(result.gates.find(g => g.id === 'mountain').available, false);
});
test('未来主线仅有未开始记录时不能提前开放阶段', () => {
  const s = slot();
  s.Narrative.NarrativeSavedQuests.push(quest('MainCh3-LongYuZuo', { QuestCompletion: 'EQuestCompletion::QC_NotStarted' }));
  assert.equal(detectStage(s).rank, 3);
});
test('返回早期地图不会使已推进的主线阶段倒退', () => {
  const s = slot('MainCh2-SiZhen', 'PBZ_Xigu_WP');
  assert.equal(detectStage(s).rank, 4);
});
test('沐小葵战后奖励等本周目击败后才出现', () => {
  const s = slot(); s.PBZGameSystem.CycleCount = 1;
  s.BossRecord = { BP_Monster_MuXiaoKui: { Records: { '0_3': { KillCount: 1 } } } };
  assert.equal(isGateAvailable('mu-rewards', detectStage(s)), false);
  s.BossRecord.BP_Monster_MuXiaoKui.Records['1_3'] = { KillCount: 1 };
  assert.equal(isGateAvailable('mu-rewards', detectStage(s)), true);
});
test('小张交付清单仅开放已到阶段的地区', () => {
  const gate = analyzeSlot(slot(), catalog).gates.find(g => g.id === 'treasures');
  assert.deepEqual(gate.items.filter(i => i.available).map(i => i.branch), ['1-1', '3-1']);
});
test('心之踪迹指向青蛇屋密道时显示山庄前待办，保留当前阶段', () => {
  const s = slot('MainCh2-XinZhiZongJi', 'PBZ_Pangzhen_WP');
  s.MapSubsystem = { UnLockMaskInfos: { MeiGuHu: { 0: ['fog'] } } };
  const [main] = s.Narrative.NarrativeSavedQuests;
  main.QuestBranches = [{ BranchID: 'S2', BranchType: 'EBranchType::BranchActivating' }];
  assert.equal(isGateAvailable('mirage', detectStage(s)), false);

  main.QuestBranches[0].BranchID = 'S5';
  s.Narrative.NarrativeSavedQuests.push(quest('HuXinMiMi'));
  const result = analyzeSlot(s, catalog);
  const mirage = result.gates.find(g => g.id === 'mirage');
  assert.equal(result.stage.rank, 5);
  assert.equal(result.stage.readyForEstate, false);
  assert.equal(mirage.passed, false);
  assert.ok(mirage.items.some(i => i.quest === 'HuXinMiMi' && i.available && !i.satisfied));
  assert.equal(result.gates.find(g => g.id === 'qingshe').available, true);
  for (const id of ['opera', 'snow', 'ending']) assert.equal(result.gates.find(g => g.id === id).available, false, id);
});
test('山庄之后回访使用主线证据，不因返回森林撤销阶段', () => {
  const s = slot('MainCh3-PoJu', 'PBZ_Fujizhilin_WP');
  s.Narrative.NarrativeSavedQuests[0].QuestCompletion = 'EQuestCompletion::QC_Succeded';
  const result = analyzeSlot(s, catalog);
  assert.equal(result.gates.find(g => g.id === 'mirage').passed, true);
  assert.equal(result.gates.find(g => g.id === 'snow').available, true);
});
test('完成隔绝楔子和拳心后，进行中的三面混沌仍是回访待办', () => {
  const s = slot('MainCh3-LongYuZuo', 'PBZ_Fujizhilin_WP');
  s.EventPipeline.GlobalTags.push('fjzl.风雪数据层.激活');
  const done = { QuestCompletion: 'EQuestCompletion::QC_Succeded' };
  s.Narrative.NarrativeSavedQuests.push(quest('GeJueXieZi', done), quest('QuanXin', done), quest('SanMianHunDun'));

  const result = analyzeSlot(s, catalog);
  const revisit = result.gates.find(g => g.id === 'snow');
  const puppets = revisit.items.find(i => i.quest === 'SanMianHunDun');
  assert.equal(revisit.passed, false);
  assert.equal(puppets.available, true);
  assert.equal(puppets.stateLabel, '进行中');
  assert.equal(puppets.failure, null);
});
test('旧周目地图迷雾记录不能开放新周目的后期阶段', () => {
  const s = slot('MainCh1-LinZhongShaJi', 'PBZ_Fujizhilin_WP'); s.PBZGameSystem.CycleCount = 1;
  s.MapSubsystem = { UnLockMaskInfos: { XiMeng: { 0: ['old-fog'] } } };
  assert.equal(detectStage(s).rank, 2);
});
test('当前检查都完成时不自动推荐未来节点', () => {
  const s = slot('MainCh1-NiLiuErShang', 'PBZ_Xigu_WP');
  s.Narrative.NarrativeSavedQuests.push(quest('GeJueXieZi', { CompletedBranches: ['1-1'] }), quest('JianXiYiShi', { QuestCompletion: 'EQuestCompletion::QC_Succeded' }));
  const result = analyzeSlot(s, catalog);
  assert.equal(result.coverage.currentPending, 0);
  assert.equal(result.recommendedGate, null);
});
test('小翠在追逐后仍须先交付，开战前警告，跳过交付则记录中断', () => {
  const s = slot('MainCh3-LongYuZuo', 'PBZ_DuanHun_WP');
  const cui = quest('XiaoCui', { CompletedBranches: ['1', '2', '3', '4-A'] });
  s.Narrative.NarrativeSavedQuests.push(cui);
  const read = () => analyzeSlot(s, catalog);
  const gate = id => read().gates.find(g => g.id === id);
  const tags = s.EventPipeline.GlobalTags;
  tags.push('ddsd.力者.结束', 'dhy.力者追逐1.播放完成');
  const before = gate('crusher');
  assert.equal(before.passed, false);
  assert.equal(before.currentPending, 1);
  assert.match(before.items[0].alert, /再打力者和锯者/);
  assert.equal(before.items[0].bell, '最后的正道营地');
  assert.equal(read().questFailures.length, 0);

  tags.push('dhy.Seq113.力者入战');
  assert.equal(gate('crusher').passed, true);
  assert.equal(read().questFailures.find(q => q.id === 'XiaoCui').state, 'interrupted');
  assert.equal(isGateAvailable('crusher-reward', detectStage(s)), false);
  tags.push('dhy.力者战斗.2阶段击杀');
  assert.equal(gate('crusher-reward').items[0].available, false);

  tags.push('xsd.陆解元.可干力者');
  assert.equal(read().questFailures.length, 0);
  assert.equal(gate('crusher').items[0].satisfied, true);
  assert.equal(gate('crusher-reward').items[0].available, true);
  tags.pop();
  cui.CompletedBranches.push('5');
  assert.equal(gate('crusher').items[0].satisfied, true);
});
