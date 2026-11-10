import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectionAccess } from '../reference/collection-access.mjs';

const save = () => ({ PBZGameSystem: { CycleCount: 1 }, Inventory: { InventoryInfos: {} }, EventPipeline: { GlobalTags: [] }, Narrative: { NarrativeSavedQuests: [] } });
const point = overrides => ({ rawMap: 'FuJiZhiLin', kind: 'medicine', id: 'Medicine_AdditionalRecover', state: 'missing', nearest: [{ activated: true }], ...overrides });
const record = (id, branches = []) => ({ QuestClass: `/Game/${id}.${id}_C`, QuestCompletion: 'EQuestCompletion::QC_Started', QuestBranches: branches });

test('白雪儿小院花瓣与雪与血分开检查项链交付、拾取与挖掘', () => {
  const s = save(), tags = s.EventPipeline.GlobalTags;
  tags.push('pz.后街.进入', 'pz.击杀.堕落将军');
  const items = s.Inventory.InventoryInfos;
  const pts = [point({ rawMap: 'HouJie', kind: 'flower', id: 'F_06004' }), point({ rawMap: 'HouJie', kind: 'flower', id: 'F_06022' }),
    point({ rawMap: 'HouJie', kind: 'accessory', id: 'AC_Bleed' })];
  const states = () => pts.map(p => collectionAccess(p, s, true).state);
  items.K_05007 = { AcquiredCycle: 1, CurrentAmount: 0 };
  items.I_10003 = { AcquiredCycle: 1, CurrentAmount: 1 };
  assert.deepEqual(states(), ['locked', 'locked', 'locked']);
  items.I_10003.CurrentAmount = 0;
  assert.deepEqual(states(), ['ready', 'locked', 'locked']);
  tags.push('pz.老槐树.解锁记忆之花');
  assert.deepEqual(states(), ['ready', 'ready', 'locked']);
  tags.push('pz.老槐树.可以挖掘');
  assert.deepEqual(states(), ['ready', 'ready', 'ready']);
});

test('已到血色森林不代表冰封杀气塔开放，未冰封的药瓶保持锁定', () => {
  const access = collectionAccess(point(), save(), true);
  assert.equal(access.state, 'locked');
  assert.match(access.reason, /冰封/);
});
test('本周目冰封标记出现后开放塔内回访；字段缺失时不猜测', () => {
  const s = save(); s.EventPipeline.GlobalTags.push('fjzl.风雪数据层.激活');
  assert.equal(collectionAccess(point(), s, true).state, 'ready');
  delete s.EventPipeline.GlobalTags;
  assert.equal(collectionAccess(point(), s, true).state, 'unknown');
});
test('已收集记录优先，不把旧区域的完成项重新列为锁定缺项', () => {
  assert.equal(collectionAccess(point({ state: 'done' }), save(), false).state, 'done');
});
test('红房子用过的人偶舌头仍可解锁，旧周目钥匙不能代替本周目', () => {
  const p = point({ rawMap: 'XiGu', kind: 'bell', id: 'Bell_QingDaoFu' }), s = save();
  assert.equal(collectionAccess(p, s, true).state, 'locked');
  s.Inventory.InventoryInfos.K_04902 = { AcquiredCycle: 1, CurrentAmount: 0 };
  assert.equal(collectionAccess(p, s, true).state, 'ready');
  s.Inventory.InventoryInfos.K_04902.AcquiredCycle = 0;
  assert.equal(collectionAccess(p, s, true).state, 'locked');
});
test('正道大营没有外门钥匙时不因区域已到达而把营内收集列为可取', () => {
  const p = point({ rawMap: 'ZhengDaoDaYing' }), s = save();
  assert.equal(collectionAccess(p, s, true).state, 'locked');
  s.Inventory.InventoryInfos.K_03002 = { AcquiredCycle: 1, CurrentAmount: 0 };
  assert.equal(collectionAccess(p, s, true).state, 'unknown', '入口钥匙通过不等于所有内部点位的门槛都已核实');
});
test('截图中的榕树在任务已接且附近已到达时可挑战，无需等后期', () => {
  const s = save(); s.Narrative.NarrativeSavedQuests.push(record('RongShuZhiXin'));
  const access = collectionAccess(point({ kind: 'banyan', id: undefined, order: 1 }), s, true);
  assert.equal(access.state, 'ready');
  assert.match(access.reason, /无需等后期/);
});
test('尚未接取榕树任务会说明对话前置；接取后未到达时给出本区路线', () => {
  const p = point({ kind: 'banyan', id: undefined, order: 1 }), s = save();
  assert.equal(collectionAccess(p, s, true).state, 'locked');
  s.Narrative.NarrativeSavedQuests.push(record('RongShuZhiXin'));
  p.nearest[0].activated = false;
  assert.equal(collectionAccess(p, s, true).state, 'route');
});
test('龙柱试炼已开启时不会把难度高误判为后期剧情锁', () => {
  const s = save();
  s.Narrative.NarrativeSavedQuests.push(record('XueMaiJueXing', [{ BranchID: '1', BranchType: 'EBranchType::BranchActivating' }]));
  const access = collectionAccess(point({ kind: 'pillar', id: undefined }), s, true);
  assert.equal(access.state, 'ready');
  assert.match(access.reason, /不属于必须等后期解锁/);
});
test('普通未收集与发奖流程名称不能被当作可获取或门锁依据', () => {
  const access = collectionAccess(point({ kind: 'accessory', id: 'Other', condition: 'BPF_BossDeath' }), save(), true);
  assert.equal(access.state, 'unknown');
});
const fullSave = () => {
  const s = save();
  Object.assign(s.Inventory, { MainWeaponInfos: {}, ShaChiWeaponInfo: {}, AccessoryInfos: {}, MedicineInfos: {} });
  s.BossRecord = {};
  return s;
};
const pangPoint = (kind, id, rawMap = 'PangZhen') => point({ rawMap, kind, id });

test('刺骨混沌逐项核对冰封、初战、三片记忆和炽刃', () => {
  const p = point({ kind: 'weapon', id: 'CiGuHunDun' }), s = fullSave();
  const read = () => collectionAccess(p, s, true);
  assert.match(read().reason, /冰封/);
  s.EventPipeline.GlobalTags.push('fjzl.风雪数据层.激活', 'fjzl.三头魔偶.激活');
  for (const id of ['F_08041', 'F_08042']) s.Inventory.InventoryInfos[id] = { AcquiredCycle: 1, CurrentAmount: 0 };
  assert.equal(read().state, 'locked');
  assert.match(read().reason, /第 3 片/);
  assert.doesNotMatch(read().reason, /第 [12] 片/);
  s.EventPipeline.GlobalTags.push('fjzl.三头魔偶.记忆之花3');
  assert.match(read().reason, /炽刃/);
  s.Inventory.MainWeaponInfos.Long = { AcquiredCycle: 0, AlreadySnapSoul: 0, WeaponLevel: 10 };
  assert.equal(read().state, 'locked');
  s.Inventory.MainWeaponInfos.Long.AlreadySnapSoul = 1;
  assert.equal(read().state, 'ready', '已铸魂的长形黑伤可在本周目用于战斗');
  delete s.Inventory.MainWeaponInfos.Long;
  s.Inventory.MainWeaponInfos.XieHuo = { AcquiredCycle: 0 };
  assert.equal(read().state, 'ready');
});

test('戏梦山庄的虎炮战、挂画后花瓣、战后花瓣和玉儿对话分别判断', () => {
  const s = fullSave(), at = (kind, id) => collectionAccess(pangPoint(kind, id, 'XiMeng'), s, true);
  const tiger = () => at('phantom', 'TigerCannon');
  const studyPetal = () => at('flower', 'F_08043');
  const aftermath = () => [at('flower', 'FS_12004').state, at('flower', 'FS_14001').state];
  assert.equal(tiger().state, 'locked');
  assert.match(tiger().reason, /挂画/);
  s.EventPipeline.GlobalTags.push('XMSZ.冷荼书房.挂画幻像消失');
  assert.equal(tiger().state, 'ready');
  assert.equal(studyPetal().state, 'ready', '打开挂画可先收集第三片三面魔偶记忆');
  assert.deepEqual(aftermath(), ['locked', 'locked']);
  s.EventPipeline.GlobalTags.push('qsd.Boss战.结束');
  assert.deepEqual(aftermath(), ['ready', 'locked']);
  s.EventPipeline.GlobalTags.push('qsd.Boss战.玉儿对话');
  assert.deepEqual(aftermath(), ['ready', 'ready']);
});

test('百相傩面和月雷华灯指出本区缺项，已消耗或交付的道具仍算取得', () => {
  const s = fullSave();
  const mask = pangPoint('accessory', 'AC_MagicWeapon', 'XiMeng');
  const lamp = pangPoint('accessory', 'AC_Electrified', 'XiMeng');
  const read = p => collectionAccess(p, s, true);
  for (const id of ['AC_MagicWeapon_1', 'AC_MagicWeapon_3', 'T_12001', 'T_12002'])
    s.Inventory.InventoryInfos[id] = { AcquiredCycle: 1, CurrentAmount: 0 };
  assert.deepEqual(read(mask).requirements.filter(r => !r.satisfied).map(r => r.text), ['取得傩面碎片·怒']);
  assert.deepEqual(read(lamp).requirements.filter(r => !r.satisfied).map(r => r.text), ['取得云月金簪']);
  s.Inventory.InventoryInfos.AC_MagicWeapon_2 = { AcquiredCycle: 0 };
  assert.equal(read(mask).state, 'locked');
  s.Inventory.InventoryInfos.AC_MagicWeapon_2.AcquiredCycle = 1;
  assert.equal(read(mask).state, 'ready');
  const q = record('MiaoShouKongKong'); q.CompletedBranches = ['4-1'];
  s.Narrative.NarrativeSavedQuests.push(q);
  assert.equal(read(lamp).state, 'locked');
  q.CompletedBranches.push('6-1');
  assert.equal(read(lamp).state, 'ready');
});

test('陆家村的井下路线读取三位大师解脱记录，荡秽结算不代替井口开放', () => {
  const s = fullSave(), p = pangPoint('flower', 'F_05041', 'LuJiaCun');
  s.EventPipeline.GlobalTags.push('ljc.击杀.荡秽', 'bsmw.掌门本体.已解脱1', 'bsmw.掌门本体.已解脱2');
  assert.equal(collectionAccess(p, s, true).state, 'locked');
  s.EventPipeline.GlobalTags.push('bsmw.掌门本体.已解脱3');
  assert.equal(collectionAccess(p, s, true).state, 'ready');
});

test('沐小葵战后根据追加战证据识别妖锯是否已经错过', () => {
  const s = fullSave(), p = pangPoint('weapon', 'YuuBlade', 'LuJiaCun');
  const read = () => collectionAccess(p, s, true);
  assert.equal(read().state, 'locked');
  assert.match(read().reason, /红丝带/);
  s.EventPipeline.GlobalTags.push('ljc.沐小葵.战斗结束');
  assert.equal(read().label, '已错过');
  s.EventPipeline.GlobalTags.push('ljc.沐小葵.玉妖铁鬼死亡');
  assert.equal(read().state, 'ready');
});

test('庞镇烧枝支路单独检查烈焰狮头，继承的能力可用但钥匙仍按本周目', () => {
  const s = fullSave(), p = pangPoint('bell', 'Bell_SZ_018');
  assert.equal(collectionAccess(p, s, true).state, 'locked');
  s.Inventory.ShaChiWeaponInfo.LionHead = { AcquiredCycle: 0 };
  assert.equal(collectionAccess(p, s, true).state, 'ready');
  const house = pangPoint('accessory', 'AC_DrinkCost');
  s.Inventory.InventoryInfos.K_05011 = { AcquiredCycle: 0 };
  assert.equal(collectionAccess(house, s, true).state, 'locked');
  s.Inventory.InventoryInfos.K_05011 = { AcquiredCycle: 1, CurrentAmount: 0 };
  assert.equal(collectionAccess(house, s, true).state, 'ready');
});
test('进入后街不等于已击败武轩，首领自身奖励不要求先取得自身奖励', () => {
  const s = fullSave(); s.EventPipeline.GlobalTags.push('pz.后街.进入');
  assert.equal(collectionAccess(pangPoint('phantom', 'TanLang', 'HouJie'), s, true).state, 'ready');
  const p = pangPoint('bell', 'Bell_SZ_006', 'HouJie');
  assert.equal(collectionAccess(p, s, true).state, 'locked');
  s.EventPipeline.GlobalTags.push('pz.击杀.堕落将军');
  assert.equal(collectionAccess(p, s, true).state, 'ready');
  assert.equal(collectionAccess(p, s, false).state, 'locked');
});
test('谢秋冬之后的路线依据本周目击杀记录，不使用同名药瓶或旧周目击杀代替', () => {
  const s = fullSave(), p = pangPoint('bell', 'Bell_SZ_010', 'HouJie');
  s.EventPipeline.GlobalTags.push('pz.后街.进入', 'pz.击杀.堕落将军');
  s.Inventory.MedicineInfos.Medicine_Recover = { AcquiredCycle: 1 };
  s.BossRecord.BP_Monster_MadDoctor = { Records: { '0_boss': { KillCount: 1 } } };
  assert.equal(collectionAccess(p, s, true).state, 'locked');
  s.BossRecord.BP_Monster_MadDoctor.Records['1_boss'] = { KillCount: 1 };
  assert.equal(collectionAccess(p, s, true).state, 'ready');
});
test('一个点位的多项前置分别列出，取得侠胆之前不把限时遭遇列为可取', () => {
  const s = fullSave(), p = pangPoint('flower', 'F_06042', 'HouJie');
  s.EventPipeline.GlobalTags.push('pz.后街.进入', 'pz.击杀.堕落将军');
  let a = collectionAccess(p, s, true);
  assert.deepEqual(a.requirements.filter(r => !r.satisfied).map(r => r.id), ['flame', 'heroic']);
  s.Inventory.ShaChiWeaponInfo.LionHead = { AcquiredCycle: 1 };
  s.Inventory.InventoryInfos.I_06006 = { AcquiredCycle: 1 };
  assert.equal(collectionAccess(p, s, true).state, 'ready');
  s.EventPipeline.GlobalTags.push('pz.不灭侠胆.任务失败');
  a = collectionAccess(p, s, true);
  assert.equal(a.state, 'locked');
  assert.equal(a.label, '任务已失效');
});
test('周平子遗书奖励分别核对琵琶与遗书，已交付数量归零仍识别', () => {
  const s = fullSave(), p = pangPoint('accessory', 'AC_UltimateBreak');
  s.EventPipeline.GlobalTags.push('quest.幻术琵琶.组装好');
  assert.match(collectionAccess(p, s, true).reason, /遗书/);
  s.Inventory.InventoryInfos.R_070017 = { AcquiredCycle: 1, CurrentAmount: 0 };
  assert.equal(collectionAccess(p, s, true).state, 'ready');
});
test('兰家任务已完成前置分支时可接续，明确失败覆盖曾完成的分支', () => {
  const s = fullSave(), p = pangPoint('accessory', 'AC_Combo');
  const q = record('LanJiaGongZi'); q.CompletedBranches = ['2'];
  s.Narrative.NarrativeSavedQuests.push(q);
  assert.equal(collectionAccess(p, s, true).state, 'ready');
  q.QuestCompletion = 'EQuestCompletion::QC_Failed';
  assert.equal(collectionAccess(p, s, true).label, '任务已失效');
});
test('榫卯碎片在本周目消耗后仍能说明可交付，缺一块不能提前开放', () => {
  const s = fullSave(), p = pangPoint('accessory', 'AC_ShachiWeapon');
  s.Inventory.InventoryInfos.AC_ShachiWeapon_1 = { AcquiredCycle: 1, CurrentAmount: 0 };
  assert.equal(collectionAccess(p, s, true).state, 'locked');
  s.Inventory.InventoryInfos.AC_ShachiWeapon_2 = { AcquiredCycle: 1, CurrentAmount: 0 };
  assert.equal(collectionAccess(p, s, true).state, 'ready');
});
test('四张面具才开放梅谷遗迹，地图已到达或继承面具都不代替本周目条件', () => {
  const s = fullSave(), p = point({ rawMap: 'MeiGu_YiJi', kind: 'bell', id: 'Ruins' });
  for (const id of ['K_05003', 'K_12001', 'K_08001']) s.Inventory.InventoryInfos[id] = { AcquiredCycle: 1 };
  s.Inventory.InventoryInfos.K_16001 = { AcquiredCycle: 0 };
  assert.equal(collectionAccess(p, s, true).state, 'locked');
  s.Inventory.InventoryInfos.K_16001 = { AcquiredCycle: 1, CurrentAmount: 0 };
  assert.equal(collectionAccess(p, s, true).state, 'ready');
});
test('镜林深处琥珀和混沌狂戒属于冰封后回访，不再全留待核实', () => {
  const s = fullSave();
  for (const p of [point({ kind: 'amber', id: undefined, order: 4 }), point({ kind: 'accessory', id: 'AC_Chaos' })]) {
    assert.equal(collectionAccess(p, s, true).state, 'locked');
    s.EventPipeline.GlobalTags.push('fjzl.风雪数据层.激活');
    assert.equal(collectionAccess(p, s, true).state, 'ready');
    s.EventPipeline.GlobalTags = [];
  }
});
test('有关龙体花瓣只要求荆野本周目战后回访，不要求冰封', () => {
  const s = fullSave(), p = point({ kind: 'flower', id: 'F_02021' });
  assert.equal(collectionAccess(p, s, true).state, 'locked');
  s.BossRecord.BP_Monster_JingYe = { Records: { '1_jingye': { KillCount: 1 } } };
  const a = collectionAccess(p, s, true);
  assert.equal(a.state, 'ready');
  assert.match(a.reason, /不需要等冰封/);
});
test('普通路线收集与门锁已开分开展示，未知任务发奖不靠改名冒充已核实', () => {
  const s = fullSave(), p = point({ kind: 'amber', id: undefined, order: 1, actor: 'BP_Chest' });
  assert.equal(collectionAccess(p, s, true).state, 'route');
  p.condition = 'BPF_BossDeath';
  assert.equal(collectionAccess(p, s, true).state, 'unknown');
});
