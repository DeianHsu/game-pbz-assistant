import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectionState, analyzeCollections } from '../reference/collections.mjs';
import { MapReader } from '../reference/map-data.mjs';

const slot = () => ({ PBZGameSystem: { CycleCount: 1, CompleteAddItemMobDomainNames: [] }, BellManager: { ActivateBellIDs: [], ActivateCraneBellIDs: [] }, Inventory: { MainWeaponInfos: {}, ShaChiWeaponInfo: {}, AccessoryInfos: {}, MedicineInfos: {}, InventoryInfos: {} }, EventPipeline: { ExecuteNodeGuid: {} }, LevelActorManager: {} });
test('地图装备按本周目获取判断，不把继承武器当成本周目已收集', () => {
  const s = slot(); s.Inventory.MainWeaponInfos.Blade = { AcquiredCycle: 0 };
  assert.equal(collectionState({ kind: 'weapon', id: 'Blade' }, s).state, 'missing');
  s.Inventory.MainWeaponInfos.Blade.AcquiredCycle = 1;
  assert.equal(collectionState({ kind: 'weapon', id: 'Blade' }, s).state, 'done');
});
test('武器铸魂形态保留原装备的本周目收集口径', () => {
  const s = slot(), point = { kind: 'weapon', id: 'XieHuo' };
  const weapon = s.Inventory.MainWeaponInfos.Long = { AcquiredCycle: 0, AlreadySnapSoul: 1 };
  assert.equal(collectionState(point, s).state, 'missing');
  weapon.AcquiredCycle = 1;
  assert.equal(collectionState(point, s).state, 'done');
  weapon.AlreadySnapSoul = 0;
  assert.equal(collectionState(point, s).state, 'missing');
  assert.equal(collectionState({ kind: 'weapon', id: 'Long' }, s).state, 'done');
});
test('已消耗或合成的花瓣仍按本周目获取记录计入', () => {
  const s = slot(); s.Inventory.InventoryInfos.F_01 = { AcquiredCycle: 1, CurrentAmount: 0 };
  assert.equal(collectionState({ kind: 'flower', id: 'F_01' }, s).state, 'done');
});
test('材料可以通过场景记录、战斗奖励或事件节点任一确认', () => {
  for (const source of ['actor', 'domain', 'node']) {
    const s = slot(), point = { kind: 'amber', actor: 'Map-Actor', domain: 'Battle', nodes: ['Node'] };
    if (source === 'actor') s.LevelActorManager['Map-Actor'] = {};
    if (source === 'domain') s.PBZGameSystem.CompleteAddItemMobDomainNames.push('Battle');
    if (source === 'node') s.EventPipeline.ExecuteNodeGuid.Node = false;
    assert.equal(collectionState(point, s).state, 'done', source);
  }
});
test('旧裸 Actor 键兼容，但不能误用另一张地图的同名 Actor', () => {
  const s = slot(), point = { kind: 'blackstone', actor: 'MapA-Actor' };
  s.LevelActorManager['MapB-Actor'] = {};
  assert.equal(collectionState(point, s).state, 'missing');
  s.LevelActorManager.Actor = {};
  assert.equal(collectionState(point, s).state, 'done');
});
test('挑战到访记录不能代替挑战完成事件', () => {
  const s = slot(), point = { kind: 'pillar', actor: 'Pillar', nodes: ['Victory'] };
  s.LevelActorManager.Pillar = { Activated: true };
  assert.equal(collectionState(point, s).state, 'missing');
  s.EventPipeline.ExecuteNodeGuid.Victory = true;
  assert.equal(collectionState(point, s).state, 'done');
});
test('缺少判断字段时保留待核实，不把它当作确定缺失', () => {
  const s = slot(); delete s.LevelActorManager;
  assert.equal(collectionState({ kind: 'amber', actor: 'A', nodes: ['N'] }, s).state, 'unknown');
  delete s.Inventory.MedicineInfos;
  assert.equal(collectionState({ kind: 'medicine', id: 'M' }, s).state, 'unknown');
});
test('普通铃铛与鹤形铃铛均读取激活记录', () => {
  const s = slot(); s.BellManager.ActivateCraneBellIDs.push('BellCrane');
  assert.equal(collectionState({ kind: 'bell', id: 'BellCrane' }, s).state, 'done');
});
test('地图原生 Actor 名称保留大数值 FName 后缀', () => {
  const b = Buffer.alloc(8); b.writeUInt32LE(1660271778, 4);
  assert.equal(new MapReader(b, ['Actor']).name(), 'Actor_1660271777');
});
test('各地区独立使用自己的点位和总量，药瓶归入饰品及药瓶类', () => {
  const s = slot(); s.Inventory.MedicineInfos.M = { AcquiredCycle: 1 };
  const catalog = { maps: [
    { id: 'LuJiaCun', name: '陆家村', members: ['LuJiaCun'], points: [{ key: 'Lu:1', rawMap: 'LuJiaCun', kind: 'medicine', category: 'accessory', id: 'M' }] },
    { id: 'FuJiZhiLin', name: '血色森林', members: ['FuJiZhiLin'], points: [{ key: 'Forest:1', rawMap: 'FuJiZhiLin', kind: 'weapon', category: 'weapon', id: 'Other' }] }
  ] };
  const result = analyzeCollections(s, catalog, { rank: 3, regions: [], location: '' });
  assert.equal(result.regions[0].done, 1); assert.equal(result.regions[1].done, 0);
  assert.equal(result.regions[0].categories.find(c => c.id === 'accessory').total, 1);
  assert.notEqual(result.regions[0].points[0].key, result.regions[1].points[0].key);
});
test('同地区后期子区仍计入总量，但不标为当前可处理', () => {
  const catalog = { maps: [{ id: 'PangZhen', name: '庞镇', members: ['PangZhen', 'XiMeng'], points: [
    { key: 'Pang:1', rawMap: 'PangZhen', kind: 'accessory', category: 'accessory', id: 'A' },
    { key: 'Estate:1', rawMap: 'XiMeng', kind: 'accessory', category: 'accessory', id: 'B' }
  ] }] };
  const result = analyzeCollections(slot(), catalog, { rank: 4, regions: [], location: '' }).regions[0];
  assert.equal(result.total, 2);
  assert.deepEqual(result.points.map(p => p.available), [true, false]);
});

test('未确认阶段的原生地区只在手动查看或实际到达后展示', () => {
  const catalog = { maps: [{ id: 'UnknownMap', name: '未命名地区', members: ['UnknownMap'], points: [
    { key: 'Unknown:1', rawMap: 'UnknownMap', kind: 'accessory', category: 'accessory', id: 'A' },
    { key: 'Unknown:bell', rawMap: 'UnknownMap', kind: 'bell', category: 'bell', id: 'OldBell' }
  ] }] };
  const stage = { rank: 8, regions: [], location: '' };
  const s = slot(); s.BellManager.ActivateBellIDs.push('OldBell');
  assert.equal(analyzeCollections(s, catalog, stage).regions[0].available, false, '单独的铃铛记录不应绕过本周目地区开放条件');
  stage.location = 'PBZ_UnknownMap_WP';
  const region = analyzeCollections(s, catalog, stage).regions[0];
  assert.equal(region.available, true);
  assert.equal(region.points[0].available, true);
});
