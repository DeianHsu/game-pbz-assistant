import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeQuestNavigation } from '../reference/quest-navigation.mjs';

const record = (id, status = 'Started') => ({ QuestClass: `/Game/${id}.${id}_C`, QuestCompletion: `EQuestCompletion::QC_${status}` });
const quest = (id, ids, extra = {}) => ({ id, name: id, type: 'Simple', state: 'active', recorded: true, branches: ids.map(id => ({ id, active: true, objective: `当前步骤${id}` })), ...extra });
function save() { return { PBZGameSystem: { CycleCount: 1 }, Inventory: { InventoryInfos: {}, ShaChiWeaponInfo: {} }, Narrative: { NarrativeSavedQuests: [] }, EventPipeline: { GlobalTags: [] } }; }
const analysis = quests => ({ quests, stage: { rank: 4, regions: ['LuJiaCun', 'PangZhen', 'HouJie'] }, gates: [] });
const catalog = { quests: [], items: [], achievements: [] };
const collections = { regions: [{ id: 'PangZhen', current: true, points: [] }] };
const run = (q, s = save(), a = analysis([q]), c = collections) => analyzeQuestNavigation(s, catalog, a, c).quests[0].navigation;
const add = (s, id, cycle = 1) => s.Inventory.InventoryInfos[id] = { AcquiredCycle: cycle, CurrentAmount: 0 };

test('归途按当前分支从庞镇故屋切回陆家村交付，不按最初接任务地固定分类', () => {
  assert.equal(run(quest('GuiTu', ['3-A'])).targets[0].mapId, 'PangZhen');
  assert.equal(run(quest('GuiTu', ['4'])).targets[0].mapId, 'LuJiaCun');
});
test('侠胆待回访花瓣使用已核对的起点铃铛，保留点位门槛和已取得状态', () => {
  const s = save(), q = quest('BuMieXiaDan', ['1']), a = analysis([q]);
  s.EventPipeline.GlobalTags.push('pz.不灭侠胆.帮助正道解脱6');
  const blocked = { state: 'locked', label: '暂不可取', reason: '缺破碎的侠胆' };
  const c = { regions: [{ id: 'PangZhen', points: [
    { id: 'F_06046', name: '其六：最好的时候', rawMap: 'HouJie', state: 'missing', access: blocked, nearest: [{ name: '窄巷民居二楼' }] },
    { id: 'F_06042', rawMap: 'HouJie', state: 'done' }
  ] }] };
  const targets = run(q, s, a, c).targets;
  assert.equal(targets.length, 1);
  assert.equal(targets[0].bell, '戏声缥缈的水塘');
  assert.equal(targets[0].person, '已解脱，回访花瓣·其六：最好的时候');
  assert.equal(targets[0].access, blocked);
});
test('地名含庞镇或陆家村也可实际属于梅谷湖，不用目标文字简单猜地图', () => {
  assert.equal(run(quest('GeJueXieZi', ['S1'])).targets[0].mapId, 'MeiGuHu');
  assert.equal(run(quest('ZaiHuiXiongZhang', ['1'])).targets[0].mapId, 'MeiGuHu');
  assert.equal(run(quest('DaHuang', ['1'])).targets[0].mapId, 'PangZhen');
});
test('昆仑三杰多个线索同时激活时优先找魏三船，取钥匙后再回大营', () => {
  const q = quest('KunLunSanJie', ['S1', 'S2', 'S3']), s = save();
  let targets = run(q, s).targets;
  assert.equal(targets.length, 1); assert.equal(targets[0].mapId, 'PangZhen');
  add(s, 'K_03002'); targets = run(q, s).targets;
  assert.ok(targets.every(t => t.mapId === 'ZhengDaoDaYing'));
});
test('大营当前章内仍需入口钥匙，消耗后的本周目钥匙有效，旧周目钥匙无效', () => {
  const q = quest('BaiShanMiWen', ['1']), s = save();
  assert.equal(run(q, s).targets[0].access.state, 'locked');
  add(s, 'K_03002', 0); assert.equal(run(q, s).targets[0].access.state, 'locked');
  add(s, 'K_03002'); assert.equal(run(q, s).targets[0].access.state, 'route');
});
test('缺钥匙字段不能冒充明确缺失；实际已到大营是当前周目的入口证据', () => {
  const q = quest('MoJiaoZhiNv', ['S1']), s = save(); delete s.Inventory.InventoryInfos;
  assert.equal(run(q, s).targets[0].access.state, 'unknown');
  const a = analysis([q]); a.stage.regions.push('PBZ_ZhengDaoDaYing_WP');
  assert.equal(run(q, s, a).targets[0].access.state, 'route');
});
test('后续地区目标单独标记，枷笼山同时给出琵琶雾门的前置', () => {
  const t = run(quest('XiaoCui', ['1'])).targets[0];
  assert.equal(t.mapName, '枷笼山'); assert.equal(t.future, true); assert.match(t.access.reason, /修复幻术琵琶/);
});
test('血肉花在当前阶段探望父亲，不会要求重做早期交付或归到驿站', () => {
  const q = quest('XueRouHua', ['2']), s = save();
  s.EventPipeline.GlobalTags.push('ljc.击杀.长鸿P2', 'xg.玉儿.给玉儿血肉花');
  const t = run(q, s).targets[0]; assert.equal(t.mapId, 'PangZhen'); assert.equal(t.access.state, 'route');
});
test('归途故屋缺少烧枝能力时标不可触发，继承烈焰狮头仍可用于探索', () => {
  const s = save(), q = quest('GuiTu', ['3-A']); add(s, 'K_05004');
  assert.match(run(q, s).targets[0].access.reason, /烈焰狮头/);
  s.Inventory.ShaChiWeaponInfo.LionHead = { AcquiredCycle: 0 };
  assert.equal(run(q, s).targets[0].access.state, 'route');
});
test('琵琶只显示本周目还没收齐的部件地图，全部齐备后指向幻鬼', () => {
  const s = save(), q = quest('HuanShuPiPa', ['1']); add(s, 'I_05001');
  assert.deepEqual(run(q, s).targets.map(t => t.mapId), ['ZhengDaoDaYing', 'MeiGuHu']);
  add(s, 'I_04001'); add(s, 'I_08002');
  assert.deepEqual(run(q, s).targets.map(t => t.mapId), ['PangZhen']);
});
test('已经打开的梦差幻境传送门不再重复列作当前目的地', () => {
  const s = save(); s.EventPipeline.GlobalTags.push('rozs.人偶中枢.从陆家村梦差密室到达人偶中枢');
  assert.deepEqual(run(quest('RenOuZhongShu', ['1']), s).targets.map(t => t.mapId), ['ZhengDaoDaYing', 'DengDingShanDao']);
});

test('狡兔三窟逐地区排除已见小张，陆家村见过和庞镇见过不再重复提醒', () => {
  const s = save(), q = quest('JiaoTuSanKu', ['2']);
  s.EventPipeline.GlobalTags.push('ljc.藏身处小张.第一次对话之后', 'pz.藏身处小张.第一次对话之后');
  const targets = run(q, s).targets;
  assert.deepEqual(targets.map(t => t.mapId), ['MeiGuHu', 'XiMeng']);
  assert.ok(targets.every(t => t.future && t.access.state === 'locked'));
  s.EventPipeline.GlobalTags.push('mgxl.藏身处小张.第一次对话之后');
  assert.deepEqual(run(q, s).targets.map(t => t.mapId), ['XiMeng']);
});

test('本地区珍宝已交付也能证明见过分身，不依赖全部任务结束', () => {
  const s = save(); s.Narrative.NarrativeSavedQuests.push({ ...record('MiaoShouKongKong'), CompletedBranches: ['3-1'] });
  assert.deepEqual(run(quest('JiaoTuSanKu', ['2']), s).targets.map(t => t.mapId), ['PangZhen', 'MeiGuHu', 'XiMeng']);
});

test('本地区珍宝只列缺项，收齐改为交付，交付完成后隐藏地区目标', () => {
  const s = save(), q = quest('MiaoShouKongKong', ['3', '4']);
  s.Narrative.NarrativeSavedQuests.push({ ...record(q.id), CompletedBranches: ['3-1'] });
  for (const id of ['T_06002', 'T_06004', 'T_06005']) add(s, id);
  let targets = run(q, s).targets;
  assert.equal(targets.length, 1); assert.equal(targets[0].mapId, 'PangZhen');
  assert.equal(targets[0].person, '待找珍宝：T_06001'); assert.match(targets[0].next, /3\/4/);
  add(s, 'T_06001', 0); assert.match(run(q, s).targets[0].person, /T_06001/);
  add(s, 'T_06001'); assert.match(run(q, s).targets[0].person, /已收齐，待交付/);
  s.Narrative.NarrativeSavedQuests[0].CompletedBranches.push('4-1');
  assert.deepEqual(run(q, s).targets, []);
  assert.equal(q.state, 'active', '不把地区已完成改写为整条任务完成');
});

test('四处分身都见过而原生任务仍活动时，不生成待定位或锁定占位提醒', () => {
  const s = save(), q = quest('JiaoTuSanKu', ['2']), a = analysis([q]);
  s.EventPipeline.GlobalTags.push(...['ljc', 'pz', 'mgxl', 'xsd'].map(p => `${p}.藏身处小张.第一次对话之后`));
  const result = analyzeQuestNavigation(s, catalog, a, collections);
  assert.deepEqual(result.quests[0].navigation.targets, []);
  assert.equal(result.taskNavigation.blocked, 0); assert.equal(result.taskNavigation.unknown, 0);
});
test('只有未满足的预警高亮，未来风险与已跨节点分别标记，不改写任务失败状态', () => {
  const q = quest('BaiShanMiWen', ['1']), a = analysis([q]);
  const item = { quest: q.id, available: false, satisfied: false, achievements: [], title: '查看肉身' };
  const gate = { id: 'baishan', name: '下一首领前', items: [item], passed: false }; a.gates.push(gate);
  assert.equal(run(q, save(), a).riskLevel, 'future');
  item.available = true; assert.equal(run(q, save(), a).riskLevel, 'warning');
  gate.passed = true; assert.equal(run(q, save(), a).riskLevel, 'urgent'); assert.equal(q.state, 'active');
  item.satisfied = true; assert.equal(run(q, save(), a).riskLevel, 'none');
});
test('完成项归档、明确失败停止列可继续；未知枚举不被地点证据掩盖', () => {
  const q = quest('GuiTu', ['4'], { state: 'done' }); assert.equal(run(q).targets.length, 0);
  q.state = 'failed'; assert.equal(run(q).targets[0].access.label, '任务已失败');
  q.state = 'unknown'; assert.equal(run(q).targets[0].access.state, 'unknown');
});
test('无法定位的目标单列，不用详情里的接取地图强行归类', () => {
  const q = quest('NewQuest', ['1']); q.branches[0].objective = '找到那个人'; q.branches[0].details = '最初在陆家村认识了他。';
  assert.equal(run(q).targets[0].mapId, 'unknown');
});
test('副本、进度或未定位数据不会修改原始存档与分析对象', () => {
  const s = save(), q = quest('HongFangZi', ['S1', 'S2']), a = analysis([q]);
  const before = JSON.stringify({ s, a, collections }); run(q, s, a);
  assert.equal(JSON.stringify({ s, a, collections }), before);
});
test('救人、交遗物和回访随分支切换目的地，已喝仙露的分支不再指向开笼', () => {
  assert.equal(run(quest('WuXiangWang', ['S1'])).targets[0].mapId, 'DengDingShanDao');
  assert.equal(run(quest('WuXiangWang', ['1'])).targets[0].mapId, 'PangZhen');
  assert.equal(run(quest('YiGeBuLiu', ['2-1'])).targets[0].mapId, 'LuJiaCun');
  assert.equal(run(quest('YiGeBuLiu', ['3-1'])).targets[0].mapId, 'LuJiaCun');
  assert.match(run(quest('XiaoCui', ['4-A'])).targets[0].person, /回访/);
  assert.equal(run(quest('RuMengQiZi', ['1'])).targets[0].mapId, 'LuJiaCun');
  assert.equal(run(quest('JiangHuRenShi', ['1'])).targets[0].mapId, 'DengDingShanDao');
});
