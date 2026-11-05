import { questAchievements, trueEndingQuests, treasureGroups, sources } from './risk-data.mjs';

const achieved = q => ['EQuestCompletion::QC_Succeded', 'EQuestCompletion::QC_Succeeded'].includes(q?.QuestCompletion);
const fields = { weapon: 'MainWeaponInfos', phantom: 'ShaChiWeaponInfo', accessory: 'AccessoryInfos', goods: 'InventoryInfos' };
export function ownedItem(slot, category, id) {
  const table = slot.Inventory?.[fields[category]];
  if (!table || typeof table !== 'object') return { known: false, owned: false };
  const key = Object.keys(table).find(key => key.toLowerCase() === id.toLowerCase()), record = table[key];
  if (!record) return { known: true, owned: false };
  // MaxAmount records previous acquisition even after handing a treasure in.
  const owned = category !== 'goods' || Number(record.CurrentAmount) > 0 || Number(record.MaxAmount) > 0;
  return { known: true, owned, record };
}
export function analyzeTreasures(slot, catalog) {
  const quest = slot.Narrative?.NarrativeSavedQuests?.find(q => q.QuestClass.includes('/MiaoShouKongKong.'));
  const valid = achieved(quest) || quest?.QuestCompletion === 'EQuestCompletion::QC_Started';
  const completed = id => valid && (quest.CompletedBranches?.includes(id) || quest.QuestBranches?.some(b => b.BranchID === id && b.BranchType === 'EBranchType::BranchCompleted'));
  const cycle = slot.PBZGameSystem?.CycleCount;
  return treasureGroups.map(group => {
    const handedIn = achieved(quest) || Boolean(completed(group.branch));
    const collected = handedIn || Boolean(completed(group.branch.split('-')[0]));
    const items = group.ids.map(id => {
      const item = catalog.items?.find(x => x.category === 'goods' && x.id === id), own = ownedItem(slot, 'goods', id);
      const known = collected || own.known && Number.isInteger(cycle) && (!own.record || Number.isInteger(own.record.AcquiredCycle));
      return { id, name: item?.name || id, owned: collected || Boolean(known && own.record?.AcquiredCycle === cycle), known };
    });
    return { ...group, handedIn, collected: items.every(i => i.owned), items };
  });
}
export function analyzeAchievements(saved, slot, catalog) {
  const known = saved && Array.isArray(saved.UnlockedIds), unlocked = new Set(known ? saved.UnlockedIds : []);
  const counters = saved?.Counters || {}, elements = saved?.CompletedElements || {};
  const quests = new Map((slot.Narrative?.NarrativeSavedQuests || []).map(q => [q.QuestClass.split('/').at(-1).split('.')[0], q]));
  const tags = new Set(slot.EventPipeline?.GlobalTags || []);
  const number = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  const collectionCount = key => Array.isArray(elements[key]) ? new Set(elements[key]).size : null;
  const counter = (key, fallback) => number(counters[key]) ?? fallback ?? null;
  const maxLevel = (field, level) => slot.Inventory?.[field] ? Math.max(0, ...Object.values(slot.Inventory[field]).map(r => number(r[level]) ?? 0)) : null;
  const progress = {
    ACH_041: { value: counter('ACH_041', collectionCount('__ACH_041')), target: 10, unit: '种不同主武器', scope: '账号成就记录' },
    ACH_042: { value: maxLevel('MainWeaponInfos', 'WeaponLevel'), target: 30, unit: '级', scope: '所选槽位最高等级' },
    ACH_043: { value: counter('ACH_043'), target: 10, unit: '块整琥珀', scope: '账号成就记录' },
    ACH_044: { value: counter('ACH_044', collectionCount('ACH_044')), target: 10, unit: '朵已合成的不同记忆之花', scope: '账号成就记录' },
    ACH_045: { value: counter('ACH_045'), target: 10, unit: '块整黑石', scope: '账号成就记录' },
    ACH_046: { value: counter('__ACH_046_Accessory', collectionCount('__ACH_046_Accessory')), target: 30, unit: '种饰品', scope: '账号成就记录' },
    ACH_047: { value: counter('ACH_047', collectionCount('__ACH_047')), target: 10, unit: '种不同影之武装', scope: '账号成就记录' },
    ACH_048: { value: maxLevel('ShaChiWeaponInfo', 'ShaChiWeaponLevel'), target: 30, unit: '级', scope: '所选槽位最高等级' },
    ACH_066: { value: known ? [...unlocked].filter(id => id !== 'ACH_066' && catalog.achievements.some(a => a.id === id)).length : null, target: 65, unit: '项其余成就', scope: '账号成就记录' }
  };
  const tagProgress = (prefix, count) => ({ value: Array.from({ length: count }, (_, i) => prefix + (i + 1)).filter(t => tags.has(t)).length, target: count, scope: '所选槽位事件记录' });
  progress.ACH_033 = { ...tagProgress('lz.龙柱.龙柱结算', 5), unit: '次龙柱结算' };
  progress.ACH_040 = { ...tagProgress('rszx.榕树之心.完成挑战', 5), unit: '处榕树挑战' };
  const hints = {
    ACH_013: '先按戏梦山庄入口的十个紫色任务清单复核，再于终局前完成五次龙柱。来源对必要任务范围有分歧，此处采用保守路线。',
    ACH_029: '包含后期冰封区域的玉琮，不能用早期三张脸的遭遇或一次挑战成功代替四个人偶全部击败。',
    ACH_038: '三条玉儿任务都要完成；血肉花早期交付完成后，还需在庞镇继续照看她的父亲。',
    ACH_039: '五地珍宝均需交付；戏楼的金银香囊首次进入时优先拾取。游戏当前条件为16件珍宝，部分攻略的梅谷湖数量不同。',
    ACH_041: '统计10种不同武器的铸魂，同一武器重复操作不重复计数。',
    ACH_043: '按整块累计获得数计数；四片合成一块。消费后的当前背包数量不能代替成就进度。',
    ACH_044: '只计已集齐花瓣并合成的整花；10片花瓣不等于10朵花，也不要求收齐全游戏花瓣。',
    ACH_045: '按整块累计获得数计数；四片合成一块，升级消耗不会倒扣累计数。',
    ACH_046: '按30种不同饰品去重，重复饰品及强化等级不另计。某件限时饰品漏掉后仍可用其他种类补足阈值。',
    ACH_047: '统计10种不同影之武装的铸魂。某条支线奖励是候选材料，未必是唯一达标路线。',
    ACH_058: '妖锯关联沐小葵隐藏追加战。先收五条红丝带并领取武器，再用对应招式完成战斗条件。',
    ACH_062: '需要两次游龙遭遇，庞镇与梅谷湖分别核对；这里以账号成就解锁记录为最终结果。',
    ACH_066: '按本机已保存的其余65项解锁记录统计，不把达到阈值直接当作已解锁。'
  };
  const combatWeapons = {
    ACH_051: ['weapon', 'IronBlade'], ACH_052: ['weapon', 'ChiZheCanJian'], ACH_053: ['weapon', 'SlitheringSword'],
    ACH_054: ['weapon', 'HeiMoShang'], ACH_055: ['weapon', 'ZhanMaBlade'], ACH_056: ['weapon', 'BaiYing'],
    ACH_057: ['weapon', 'RenOuYanYueDao'], ACH_058: ['weapon', 'YuuBlade'], ACH_059: ['weapon', 'JadeDualChakram'],
    ACH_060: ['weapon', 'BaiShanShuangJian'], ACH_061: ['phantom', 'JinGua'], ACH_063: ['phantom', 'TieGongZhuQuanTao'], ACH_064: ['phantom', 'ThunderSpear']
  };
  const rows = catalog.achievements.map(item => {
    const linked = Object.entries(questAchievements).filter(([, ids]) => ids.includes(item.id)).map(([id]) => id);
    if (item.id === 'ACH_013') linked.push(...trueEndingQuests);
    const requirements = [...new Set(linked)].map(id => ({ id, name: catalog.quests.find(q => q.id === id)?.name || id,
      done: achieved(quests.get(id)), recorded: quests.has(id) }));
    const weapon = combatWeapons[item.id];
    const equipment = weapon ? { ...catalog.items.find(i => i.category === weapon[0] && i.id === weapon[1]), ...ownedItem(slot, ...weapon) } : null;
    return { ...item, equipment, state: !known ? 'unknown' : unlocked.has(item.id) ? 'done' : 'active',
      stateLabel: !known ? '无成就记录' : unlocked.has(item.id) ? '本地已解锁' : '未记录解锁', progress: progress[item.id], requirements,
      hint: hints[item.id] || '', category: Number(item.id.slice(4)) <= 13 ? '流程与结局' : Number(item.id.slice(4)) <= 31 ? '首领' : Number(item.id.slice(4)) <= 40 ? '任务' : Number(item.id.slice(4)) <= 48 ? '养成收集' : '战斗技巧',
      evidence: '本地 __Achievements__.UnlockedIds；不代表已向 Steam 成功同步。',
      source: Number(item.id.slice(4)) >= 41 && Number(item.id.slice(4)) <= 48 ? null : sources.steam.url };
  });
  const treasures = analyzeTreasures(slot, catalog);
  return { known, total: rows.length, unlocked: rows.filter(r => r.state === 'done').length, rows, treasures,
    scopeNote: '成就解锁和成就计数属于账号；任务、挑战及珍宝判断属于所选槽位。回看旧槽位不会倒退账号成就。' };
}
