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
test('白雪儿后续或最终奖励已确认时收起陈柱选项，赎罪名单结束本身不够', () => {
  const s = save(); s.Narrative.NarrativeSavedQuests.push(quest('YongShengDaoZhu', 'Succeded'));
  assert.equal(check(s, 'YongShengDaoZhu').mode, 'manual');
  assert.equal(check(s, 'YongShengDaoZhu').taskState, 'done');
  add(s, 'AC_Bleed', 'AccessoryInfos');
  assert.equal(check(s, 'YongShengDaoZhu').satisfied, true);
  s.Inventory.AccessoryInfos.AC_Bleed.AcquiredCycle = 0;
  assert.equal(check(s, 'YongShengDaoZhu').satisfied, false);
});
test('勿相忘早期线索不能代替救人，已经进入遗书交付分支才可作为证明', () => {
  const s = save(), q = quest('WuXiangWang');
  q.QuestBranches = [{ BranchID: 'S1', BranchType: 'EBranchType::BranchActivating' }];
  s.Narrative.NarrativeSavedQuests.push(q);
  assert.equal(check(s, 'WuXiangWang').satisfied, false);
  q.QuestBranches = [{ BranchID: '1', BranchType: 'EBranchType::BranchActivating' }];
  assert.equal(check(s, 'WuXiangWang').satisfied, true);
});
