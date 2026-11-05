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
test('山庄之后回访使用主线证据，不因返回森林撤销阶段', () => {
  const s = slot('MainCh3-PoJu', 'PBZ_Fujizhilin_WP');
  s.Narrative.NarrativeSavedQuests[0].QuestCompletion = 'EQuestCompletion::QC_Succeded';
  const result = analyzeSlot(s, catalog);
  assert.equal(result.gates.find(g => g.id === 'mirage').passed, true);
  assert.equal(result.gates.find(g => g.id === 'snow').available, true);
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
test('力者入战不等于战后领奖，胜利事件后才开放奖励', () => {
  const s = slot('MainCh3-LongYuZuo', 'PBZ_DuanHunShan_WP');
  s.EventPipeline.GlobalTags.push('dhy.Seq113.力者入战');
  assert.equal(isGateAvailable('crusher-reward', detectStage(s)), false);
  s.EventPipeline.GlobalTags.push('achievment.锯理力争.完成');
  assert.equal(isGateAvailable('crusher-reward', detectStage(s)), true);
});
