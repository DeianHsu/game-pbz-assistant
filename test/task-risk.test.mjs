import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSlot } from '../reference/rules.mjs';

const catalog = { quests: [], items: [{ category: 'goods', id: 'F_06046', name: '其六：最好的时候' }], bells: {} };
const quest = (id, status = 'Started') => ({ QuestClass: `/Game/${id}.${id}_C`, QuestCompletion: `EQuestCompletion::QC_${status}`, QuestBranches: [] });
function save() {
  return { PBZGameSystem: { CycleCount: 1, CurrentLevelName: 'PBZ_PangZhen_WP' },
    EventPipeline: { GlobalTags: [] }, Narrative: { NarrativeSavedQuests: [quest('MainCh2-SiZhen')] },
    Inventory: { InventoryInfos: {}, AccessoryInfos: {} } };
}
const check = (s, id) => analyzeSlot(s, catalog).gates.flatMap(g => g.items).find(i => i.quest === id && i.check);
const add = (s, id, category = 'InventoryInfos', cycle = 1) => s.Inventory[category][id] = { AcquiredCycle: cycle, CurrentAmount: 0, MaxAmount: 1 };
const snowCheck = result => result.gates.find(g => g.id === 'mountain').items.find(i => i.check === 'bai-xue');

test('不灭侠胆的前置阶段自动读取任务状态，不一概要求现场核对', () => {
  const s = save(), q = quest('BuMieXiaDan');
  q.QuestBranches.push({ BranchID: 'S1', BranchType: 'EBranchType::BranchActivating' });
  s.Narrative.NarrativeSavedQuests.push(q);
  const r = check(s, 'BuMieXiaDan');
  assert.equal(r.mode, 'auto'); assert.equal(r.taskState, 'active');
  assert.equal(r.stateLabel, '前置尚未完成'); assert.match(r.action, /狼头领/);
  assert.equal(r.satisfied, false); assert.equal(r.riskDetails.length, 6);
  assert.deepEqual(r.riskDetails.map(d => d.bell), ['乱葬岗', '贫民窟', '大营正门', '大营瀑布后方', '白山派的覆灭之路', '戏声缥缈的水塘']);
  assert.equal(r.riskDetails.filter(d => d.area === '正道大营').length, 4);
  assert.equal(r.riskDetails.find(d => d.id === 'F_06046').flower, '其六：最好的时候');
});
test('逐人区分已经解脱、花瓣取得与无记录，消耗花瓣和旧周目分开', () => {
  const s = save(); add(s, 'I_06006');
  s.EventPipeline.GlobalTags.push('pz.不灭侠胆.帮助正道解脱1');
  add(s, 'F_06042'); add(s, 'F_06043', 'InventoryInfos', 0);
  const r = check(s, 'BuMieXiaDan');
  assert.equal(r.mode, 'auto'); assert.equal(r.progress, '花瓣 1/6');
  assert.deepEqual(r.riskDetails.slice(0, 3).map(d => d.state), ['active', 'done', 'unknown']);
  assert.equal(r.satisfied, false, '有进度不代表整条任务已完成');
  assert.match(r.riskDetails[2].text, /不能直接判为失败/);
});
test('侠胆任务只按明确失败标记或任务失败判失败，不根据高手缺失数猜测', () => {
  const s = save(); assert.notEqual(check(s, 'BuMieXiaDan').state, 'failed');
  add(s, 'TU_19006'); s.EventPipeline.GlobalTags.push('pz.不灭侠胆.任务失败');
  const r = check(s, 'BuMieXiaDan');
  assert.equal(r.state, 'failed'); assert.equal(r.mode, 'auto'); assert.equal(r.satisfied, false);
});
test('原生任务完成或本周目最终侠胆奖励即归档，不要求六处全部做完', () => {
  const s = save(); s.Narrative.NarrativeSavedQuests.push(quest('BuMieXiaDan', 'Succeded'));
  assert.equal(check(s, 'BuMieXiaDan').satisfied, true);
  assert.equal(check(s, 'BuMieXiaDan').riskDetails.length, 6, '归档后仍可查六处位置');
  s.Narrative.NarrativeSavedQuests.pop(); add(s, 'TU_19006');
  assert.equal(check(s, 'BuMieXiaDan').satisfied, true);
  s.Inventory.InventoryInfos.TU_19006.AcquiredCycle = 0;
  assert.equal(check(s, 'BuMieXiaDan').satisfied, false);
});
test('字段缺失或未知任务枚举仍保留核对，不能被旧事件变绿', () => {
  const s = save(); delete s.EventPipeline.GlobalTags;
  assert.equal(check(s, 'BuMieXiaDan').mode, 'manual');
  s.EventPipeline.GlobalTags = ['zddy.红衣女剑客.荡绳离开'];
  s.Narrative.NarrativeSavedQuests.push(quest('MoJiaoZhiNv', 'Future'));
  assert.equal(check(s, 'MoJiaoZhiNv').satisfied, false);
});
test('女剑客荡绳离开可以自动确认脱战，奖励仍独立检查', () => {
  const s = save(); s.EventPipeline.GlobalTags.push('zddy.红衣女剑客.荡绳离开');
  const r = check(s, 'MoJiaoZhiNv');
  assert.equal(r.mode, 'auto'); assert.equal(r.satisfied, true);
  const g = analyzeSlot(s, catalog).gates.find(g => g.id === 'qixing');
  assert.ok(g.items.filter(i => i.check === 'item').every(i => !i.satisfied));
});
test('女剑客死亡时结合剑阵证据，不将双人战击杀误报提前杀人', () => {
  const s = save(); s.EventPipeline.GlobalTags.push('zddy.击杀.红衣女剑客');
  assert.equal(check(s, 'MoJiaoZhiNv').stateLabel, '提前击杀风险');
  s.EventPipeline.GlobalTags.push('zddy.剑阵.完成任务');
  assert.equal(check(s, 'MoJiaoZhiNv').stateLabel, '击杀时序待核对');
  add(s, 'F_03008'); add(s, 'AC_LowShachi', 'AccessoryInfos');
  assert.equal(check(s, 'MoJiaoZhiNv').satisfied, true);
});
test('只有任务结束不能代替女剑客后续路线和奖励证明，明确失败优先', () => {
  const s = save(); const q = quest('MoJiaoZhiNv', 'Succeded'); s.Narrative.NarrativeSavedQuests.push(q);
  assert.equal(check(s, 'MoJiaoZhiNv').mode, 'manual');
  q.QuestCompletion = 'EQuestCompletion::QC_Failed';
  s.EventPipeline.GlobalTags.push('zddy.红衣女剑客.荡绳离开');
  assert.equal(check(s, 'MoJiaoZhiNv').state, 'failed');
});
test('周平子开笼、遗书或有效任务可自动证明救人，未记录不推断死亡', () => {
  const s = save(); let r = check(s, 'WuXiangWang');
  assert.equal(r.mode, 'auto'); assert.equal(r.satisfied, false);
  s.EventPipeline.GlobalTags.push('ddsd.周平子.开笼子');
  assert.equal(check(s, 'WuXiangWang').satisfied, true);
  s.EventPipeline.GlobalTags = []; add(s, 'R_070017');
  assert.equal(check(s, 'WuXiangWang').satisfied, true);
  s.Narrative.NarrativeSavedQuests.push(quest('WuXiangWang', 'Failed'));
  assert.equal(check(s, 'WuXiangWang').satisfied, false);
});
test('赎罪名单结束后提示人偶，白雪儿完成或本周目已得雪与血时收起', () => {
  const s = save(); s.Narrative.NarrativeSavedQuests.push(quest('YongShengDaoZhu', 'Succeded'));
  let a = analyzeSlot(s, catalog);
  assert.equal(a.baiXueStep.id, 'puppet');
  assert.equal(snowCheck(a).satisfied, false);
  add(s, 'AC_Bleed', 'AccessoryInfos');
  assert.equal(snowCheck(analyzeSlot(s, catalog)).satisfied, true);
  s.Inventory.AccessoryInfos.AC_Bleed.AcquiredCycle = 0;
  assert.equal(snowCheck(analyzeSlot(s, catalog)).satisfied, false);
  s.Narrative.NarrativeSavedQuests.push(quest('BaiXue', 'Succeded'));
  assert.equal(analyzeSlot(s, catalog).baiXueStep.id, 'done');
});
test('捡到赎罪名单即给出交付路线，交战选项跟踪铁面杀手与人偶', () => {
  const s = save();
  assert.equal(snowCheck(analyzeSlot(s, catalog)).available, false);
  s.PBZGameSystem.CurrentLevelName = 'PBZ_DengDingShanDao_WP';
  add(s, 'R_070002');
  const a = analyzeSlot(s, catalog), r = snowCheck(a);
  assert.equal(a.baiXueStep.id, 'deliver');
  assert.equal(r.available, true);
  assert.equal(r.quest, 'YongShengDaoZhu');
  assert.equal(r.bell, '宗祠外山门');
  assert.match(r.action, /洗去你的罪孽.*放他一条生路/);
  s.EventPipeline.GlobalTags.push('ddsd.杀气怪面.不放走');
  assert.equal(analyzeSlot(s, catalog).baiXueStep.id, 'fight');
  s.EventPipeline.GlobalTags.push('ddsd.杀气怪面.死亡');
  assert.equal(analyzeSlot(s, catalog).baiXueStep.id, 'puppet');
});
test('陈柱离开后按当周目钥匙、项链和两片花瓣追踪，允许没有任务日志', () => {
  const s = save(), tags = s.EventPipeline.GlobalTags;
  tags.push('ddsd.杀气怪面.放走');
  assert.equal(analyzeSlot(s, catalog).baiXueStep.id, 'spared');
  add(s, 'K_05007'); add(s, 'I_10003', 'InventoryInfos', 0);
  assert.equal(analyzeSlot(s, catalog).baiXueStep.id, 'spared', '上周目的项链不能解锁本周目小院流程');
  s.Inventory.InventoryInfos.I_10003 = { AcquiredCycle: 1, CurrentAmount: 1, MaxAmount: 1 };
  let a = analyzeSlot(s, catalog);
  assert.equal(a.baiXueStep.id, 'home');
  assert.equal(a.baiXueStep.bell, '青蛇屋');
  assert.deepEqual(a.questFailures, []);
  s.Inventory.InventoryInfos.I_10003.CurrentAmount = 0;
  assert.equal(analyzeSlot(s, catalog).baiXueStep.id, 'petal1');
  add(s, 'F_06004');
  assert.equal(analyzeSlot(s, catalog).baiXueStep.id, 'petal2');
  add(s, 'F_06022');
  a = analyzeSlot(s, catalog);
  assert.equal(a.baiXueStep.id, 'tree');
  assert.match(snowCheck(a).progress, /2\/2.*雪与血待领取/);
  add(s, 'AC_Bleed', 'AccessoryInfos');
  assert.equal(analyzeSlot(s, catalog).baiXueStep.id, 'done');
});
test('勿相忘早期线索不能代替救人，已经进入遗书交付分支才可作为证明', () => {
  const s = save(), q = quest('WuXiangWang');
  q.QuestBranches = [{ BranchID: 'S1', BranchType: 'EBranchType::BranchActivating' }];
  s.Narrative.NarrativeSavedQuests.push(q);
  assert.equal(check(s, 'WuXiangWang').satisfied, false);
  q.QuestBranches = [{ BranchID: '1', BranchType: 'EBranchType::BranchActivating' }];
  assert.equal(check(s, 'WuXiangWang').satisfied, true);
});

test('小翠以吊笼死亡判定中断，保留荒行子战前和已获救的进度', () => {
  const s = save(), q = quest('XiaoCui');
  q.CompletedBranches = ['1', '2', '2-ex'];
  q.QuestBranches = [{ BranchID: '3', BranchType: 'EBranchType::BranchActivating' }];
  s.Narrative.NarrativeSavedQuests.push(q);
  const tags = s.EventPipeline.GlobalTags;
  tags.push('fzmd.小翠.死亡', 'ddsd.开门.独木桥', 'ddsd.击杀.荒行子2');
  assert.deepEqual(analyzeSlot(s, catalog).questFailures, [], '跨节点和小翠的剧情死亡都不等于吊笼救人失败');
  tags.pop();
  tags.push('ddsd.陆三迁2.死亡');
  let result = analyzeSlot(s, catalog);
  assert.deepEqual(result.questFailures.map(q => [q.id, q.state]), [['XiaoCui', 'interrupted']]);
  assert.match(result.questFailures[0].failure.reason, /吊笼中死亡.*独木桥/);
  assert.doesNotMatch(result.questFailures[0].failure.reason, /击败荒行子/);
  assert.ok(result.gates.find(g => g.id === 'mountain').items.filter(i => i.quest === 'XiaoCui').every(i => i.failure?.state === 'interrupted'));
  tags.push('ddsd.击杀.荒行子2');
  assert.match(analyzeSlot(s, catalog).questFailures[0].failure.reason, /此档也已击败荒行子/);
  q.QuestBranches[0].BranchType = 'EBranchType::BranchCompleted';
  assert.deepEqual(analyzeSlot(s, catalog).questFailures, [], '已有救人分支，不能按未救出报中断');
});

test('行前检查收录清单外的原生失败任务，缺少原因时明确标注', () => {
  const s = save();
  const q = quest('OtherSideQuest', 'Failed');
  q.CompletedBranches = ['1'];
  s.Narrative.NarrativeSavedQuests.push(q, quest('BaiXue', 'Failed'));
  const result = analyzeSlot(s, catalog);
  assert.deepEqual(result.questFailures.map(q => q.id), ['OtherSideQuest', 'BaiXue']);
  assert.equal(result.questFailures[0].stateLabel, '已失败');
  assert.match(result.questFailures[0].failure.reason, /未记录具体原因/);
  assert.ok(!result.currentQuestIds.includes('BaiXue'));
});

test('青蛇屋和陆家村的中断事件只影响未完成对应步骤的任务', () => {
  const s = save(), tears = quest('QiShengHeLai'), flower = quest('XueRouHua');
  s.Narrative.NarrativeSavedQuests.push(tears, flower, quest('NanYanZhiYin', 'Succeded'));
  s.EventPipeline.GlobalTags.push('quest.任务中断.进入青蛇屋外围', 'quest.任务中断.抵达陆家村', 'quest.一个不留.营地变怪');
  tears.CompletedBranches = ['3'];
  assert.deepEqual(analyzeSlot(s, catalog).questFailures.map(q => q.id), ['QiShengHeLai', 'XueRouHua']);
  tears.CompletedBranches.push('4');
  flower.CompletedBranches = ['1'];
  assert.deepEqual(analyzeSlot(s, catalog).questFailures, []);
});

test('周平子开门失败不代表任务中断，遗书交付能证明救人步骤已过去', () => {
  const s = save(), q = quest('WuXiangWang');
  s.Narrative.NarrativeSavedQuests.push(q);
  s.EventPipeline.GlobalTags.push('ddsd.周平子.开门失败');
  assert.deepEqual(analyzeSlot(s, catalog).questFailures, []);
  s.EventPipeline.GlobalTags.push('ddsd.周平子.死亡');
  assert.match(analyzeSlot(s, catalog).questFailures[0].failure.reason, /周平子在获救前死亡/);
  q.QuestBranches = [{ BranchID: '1', BranchType: 'EBranchType::BranchActivating' }];
  assert.deepEqual(analyzeSlot(s, catalog).questFailures, []);
});
