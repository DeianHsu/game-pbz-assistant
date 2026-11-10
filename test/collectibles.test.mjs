import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCollectibles } from '../reference/collectibles.mjs';

const item = (id, category = 'goods', name = id) => ({ id, category, name: name === id ? `物品${id}` : name, rowName: name });
const save = () => ({ PBZGameSystem: { CycleCount: 1 }, Inventory: { InventoryInfos: {}, MainWeaponInfos: {}, ShaChiWeaponInfo: {}, AccessoryInfos: {}, MedicineInfos: {} }, Narrative: { NarrativeSavedQuests: [] } });
const analysis = () => ({ stage: { rank: 4 }, gates: [] });
const point = (key, id, kind, access = 'ready') => ({ key, id, kind, name: '点位', state: 'missing', evidence: '点位证据', nearest: [{ name: '附近铃铛' }], access: { state: access, label: access, reason: '具体条件' }, guide: { detail: 'specific', steps: ['打开宝箱领取。'], source: 'https://example.com/guide' } });
const region = (id, points) => ({ id, name: id, points });
const analyze = (s, items, regions = [], a = analysis()) => analyzeCollectibles(s, { items }, { regions }, a);

test('地图之外的书籍可以按本周目获取记录核对，消耗后不重新缺失', () => {
  const s = save(); s.Inventory.InventoryInfos.R_01010 = { AcquiredCycle: 1, CurrentAmount: 0, MaxAmount: 0 };
  const result = analyze(s, [item('R_01010'), item('R_01011')]);
  assert.equal(result.total, 2); assert.equal(result.done, 1);
  assert.equal(result.items[1].access.state, 'unknown'); assert.equal(result.items[1].available, false);
  assert.deepEqual(result.categories.map(c => c.id), ['book']);
});
test('多地区的同一饰品只统计一次，选择已开放来源并保留各地区', () => {
  const result = analyze(save(), [item('AC_A', 'accessory')], [region('前期', [point('a', 'AC_A', 'accessory')]), region('后期', [point('b', 'AC_A', 'accessory', 'locked')])]);
  assert.equal(result.total, 1); assert.equal(result.items[0].access.state, 'ready');
  assert.deepEqual(result.items[0].regionIds, ['前期', '后期']); assert.equal(result.items[0].bell, '附近铃铛');
  assert.deepEqual(result.items[0].steps, ['打开宝箱领取。']);
});
test('目录和地图的标识大小写差异不产生重复或丢失地点', () => {
  const result = analyze(save(), [item('ZiMingJian', 'weapon')], [region('断魂', [point('p', 'zimingjian', 'weapon', 'locked')])]);
  assert.equal(result.total, 1); assert.equal(result.items[0].access.state, 'locked');
});
test('铃铛按标识去重，两个碎片箱仍分别统计', () => {
  const result = analyze(save(), [], [region('地图', [point('b1', 'Bell_A', 'bell'), point('b2', 'Bell_A', 'bell'), point('a1', undefined, 'amber'), point('a2', undefined, 'amber')])]);
  assert.equal(result.total, 3); assert.equal(result.categories.find(c => c.id === 'amber').total, 2);
});
test('物品字段缺失保持未知，旧周目记录不能代替本周目完成', () => {
  const s = save(); s.Inventory.InventoryInfos.R_1 = { AcquiredCycle: 0 }; delete s.Inventory.AccessoryInfos;
  const result = analyze(s, [item('R_1'), item('AC_1', 'accessory')]);
  assert.equal(result.items[0].state, 'missing'); assert.equal(result.items[1].state, 'unknown');
  assert.equal(result.done, 0);
});
test('剧情专用黑伤变体归入同一武器，有实际变体记录仍确认取得', () => {
  const s = save(); s.Inventory.MainWeaponInfos.TangPrologue = { AcquiredCycle: 1 };
  const result = analyze(s, [item('Tang', 'weapon'), item('TangPrologue', 'weapon')]);
  assert.equal(result.total, 1); assert.equal(result.done, 1);
});
test('正式装备按基础形态统计，专属铸魂材料、部件和残留条目分开', () => {
  const s = save();
  s.Inventory.MainWeaponInfos.HeiMoShang = { AcquiredCycle: 1 };
  s.Inventory.ShaChiWeaponInfo.CuiXinPiPa = { AcquiredCycle: 1, AlreadySnapSoul: true };
  const result = analyze(s, [item('Tang', 'weapon'), item('HeiMoShang', 'weapon'), item('ZhuGuangBaoQi', 'weapon'),
    item('CuiXinPiPa', 'phantom'), item('XueSeLingDang', 'phantom'), item('TU_15001'), item('TU_150011'), item('TU_13005')]);
  assert.deepEqual(result.items.map(i => [i.id, i.category]), [['Tang', 'weapon'], ['CuiXinPiPa', 'phantom'], ['TU_15001', 'soul'], ['TU_150011', 'soul-part']]);
  assert.equal(result.items[0].state, 'done');
  assert.equal(result.items[0].temper.state, 'done');
  assert.equal(result.items[1].temper.form, '幻术琵琶');
  assert.equal(result.items[1].temper.material, '');
});
test('待铸魂识别当前持有的装备并关联材料路线，收集仍按周目核对', () => {
  const s = save(), a = analysis(); a.stage.rank = 9;
  s.Inventory.ShaChiWeaponInfo.XueDiZi = { AcquiredCycle: 0, AlreadySnapSoul: false };
  s.Inventory.ShaChiWeaponInfo.HuoLiuXing = { AcquiredCycle: 1, AlreadySnapSoul: true };
  const result = analyze(s, [item('XueDiZi', 'phantom', '血滴子'), item('HuoLiuXing', 'phantom'), item('TU_08002', 'goods', '强化电锯'), item('TU_11012')], [], a);
  const [pending] = result.items.filter(i => i.temper?.state === 'pending');
  assert.equal(pending.state, 'missing');
  assert.equal(pending.temper.material, '强化电锯');
  assert.equal(pending.temper.bell, '大营瀑布后方');
  assert.match(pending.temper.steps[1], /神像左下/);
  assert.equal(result.items.find(i => i.id === 'TU_08002').access.state, 'ready');
  assert.equal(result.items.find(i => i.id === 'TU_11012').bell, '梅谷村西岛船坞');
});
test('非地图奖励沿用阶段和获取步骤，不因列入全目录提前开放', () => {
  const a = analysis(); a.gates.push({ name: '后期奖励', items: [{ check: 'item', item: 'TU_02002', category: 'goods', available: false, action: '战后领取材料。', source: 'https://example.com' }] });
  let row = analyze(save(), [item('TU_02002')], [], a).items[0];
  assert.equal(row.access.state, 'locked'); assert.deepEqual(row.steps, ['战后领取材料。']);
  a.gates[0].items[0].available = true;
  row = analyze(save(), [item('TU_02002')], [], a).items[0];
  assert.equal(row.access.state, 'route'); assert.equal(row.available, true);
});
test('珍宝交付分支可证明已收集，明确失败的旧分支不能覆盖', () => {
  const s = save(); const q = { QuestClass: '/Game/MiaoShouKongKong.MiaoShouKongKong_C', QuestCompletion: 'EQuestCompletion::QC_Started', CompletedBranches: ['4-1'] };
  s.Narrative.NarrativeSavedQuests.push(q);
  assert.equal(analyze(s, [item('T_06001')]).done, 1);
  q.QuestCompletion = 'EQuestCompletion::QC_Failed';
  assert.equal(analyze(s, [item('T_06001')]).done, 0);
});
test('书籍分组和明确占位不算缺项，正常带废弃二字的书籍保留', () => {
  const result = analyze(save(), [item('Book_03'), item('I_000006'), item('R_01016', 'goods', '废弃田契')]);
  assert.deepEqual(result.items.map(i => i.id), ['R_01016']);
});
test('花瓣、特殊花瓣与完整花分别统计，不把拥有一片当作整花完成', () => {
  const s = save(); s.Inventory.InventoryInfos.F_02011 = { AcquiredCycle: 1 };
  const r = analyze(s, [item('F_02011'), item('FS_12001'), item('FA_0201')]);
  assert.equal(r.categories.find(c => c.id === 'petal').total, 2);
  assert.equal(r.categories.find(c => c.id === 'flower').done, 0);
  assert.match(r.items.find(i => i.id === 'FA_0201').steps[0], /合成/);
});
test('总数和状态分流互相对齐，分析不改写地图或玩家存档', () => {
  const s = save(), items = [item('R_1'), item('AC_A', 'accessory')], maps = [region('旧地图', [point('a', 'AC_A', 'accessory')])];
  const before = JSON.stringify({ s, items, maps }); const r = analyze(s, items, maps);
  assert.equal(r.categories.reduce((n, c) => n + c.total, 0), r.total);
  assert.equal(Object.values(r.accessCounts).reduce((a, b) => a + b, 0) + r.done, r.total);
  assert.equal(JSON.stringify({ s, items, maps }), before);
});
