import { collectionState } from './collections.mjs';
import { treasureGroups, sources } from './risk-data.mjs';
import { treasureStages } from './stages.mjs';
import { bookGuide } from './book-guides.mjs';
import { routeAccess } from './collection-access.mjs';
import { itemRecord, weaponFormBases } from './item-record.mjs';
import { pipaRepair, soulComponentProducts, soulComponents, soulForms, soulGuides, soulRecipes, soulSources } from './soul-data.mjs';

export const collectibleCategories = [
  ['weapon', '主武器'], ['phantom', '影之武装'], ['accessory', '饰品'], ['medicine', '药瓶'],
  ['book', '书籍与篇章'], ['petal', '记忆花瓣'], ['flower', '完整记忆之花'], ['treasure', '小张珍宝'],
  ['soul', '铸魂材料'], ['soul-part', '铸魂合成部件'], ['key', '钥匙与机关'], ['quest', '剧情道具'], ['part', '饰品部件'], ['material', '升级材料'],
  ['bell', '铃铛'], ['challenge', '挑战地点'], ['amber', '琥珀碎片点'], ['blackstone', '黑石碎片点']
].map(([id, name]) => ({ id, name }));
const lower = s => String(s || '').toLowerCase();
export const collectionAliases = { WoodenSword: ['WoodenSwordHun'], Tang: ['Tang_HorseCartCombat', 'TangPrologue', 'HeiMoShangPrologue'] };
for (const [form, base] of Object.entries(weaponFormBases)) (collectionAliases[base] ||= []).push(form);
export const unlistedCollectionItems = [...Object.values(collectionAliases).flat(), 'I_060001', 'I_000006', 'Bell_Item_PlaceHolder',
  'ZhuGuangBaoQi', 'MoQie', 'BaWangLianQiu', 'MoShou', 'XueSeLingDang'];
const ignored = new Set(unlistedCollectionItems);
const recipeMaterials = new Set(Object.values(soulRecipes));
const collectionKey = (category, id) => `${category}:${lower(id)}`;
const goodsCategory = id => /^R_|^Page_/.test(id) ? 'book' : /^FS?_/.test(id) ? 'petal' : /^FA_/.test(id) ? 'flower'
  : /^T_/.test(id) ? 'treasure' : recipeMaterials.has(id) ? 'soul' : soulComponentProducts[id] ? 'soul-part' : /^K_/.test(id) ? 'key' : /^I_/.test(id) ? 'quest'
  : /^AC_/.test(id) ? 'part' : /^(Weapon_Material|Ac_Material|Medi_Material)_/.test(id) ? 'material' : null;

export function analyzeCollectibles(slot, catalog, collections, analysis) {
  const rows = new Map(), mapped = new Map();
  const chivalryFlowerName = catalog.items?.find(item => item.category === 'goods' && item.id === 'FA_0604')?.name || '';
  for (const region of collections.regions) for (const point of region.points) {
    const inventoryCategory = point.kind === 'flower' ? 'goods' : point.kind;
    const key = point.id ? collectionKey(inventoryCategory, point.id) : `point:${point.key}`;
    const origins = mapped.get(key) || [];
    origins.push({ ...point, regionId: region.id, regionName: region.name }); mapped.set(key, origins);
  }
  for (const item of catalog.items || []) {
    const key = collectionKey(item.category, item.id), origins = mapped.get(key) || [];
    if (ignored.has(item.id)) continue;
    const category = item.category === 'goods' ? goodsCategory(item.id) : item.category;
    if (!category || !origins.length && !/[\u4e00-\u9fff]/.test(item.name)) continue;
    const states = [item.id, ...(collectionAliases[item.id] || [])].map(id => collectionState({ kind: item.category === 'goods' ? 'flower' : item.category, id }, slot));
    const state = states.find(s => s.state === 'done') || states.find(s => s.state === 'unknown') || states[0];
    const chivalryPetal = origins.some(p => p.condition?.startsWith('BPF_BuMieXiaDan_Memory_'));
    const subtitle = chivalryPetal ? chivalryFlowerName : item.rowName !== item.name ? item.rowName : '';
    rows.set(key, { key, id: item.id, name: item.name, subtitle, category, inventoryCategory: item.category,
      description: item.description || '', ...state, origins });
  }
  // Bells, challenge sites and resource chests are individual locations, not inventory types.
  for (const [key, origins] of mapped) if (!rows.has(key)) {
    const point = origins[0];
    if (!['bell', 'banyan', 'pillar', 'scarecrow', 'amber', 'blackstone'].includes(point.kind)) continue;
    const state = origins.find(p => p.state === 'done') || origins.find(p => p.state === 'unknown') || point;
    rows.set(key, { key, id: point.id || '', name: point.name, subtitle: '', description: '',
      category: ['banyan', 'pillar', 'scarecrow'].includes(point.kind) ? 'challenge' : point.kind,
      state: state.state, evidence: state.evidence, origins });
  }
  const allRules = analysis.gates.flatMap(g => g.items.filter(i => i.check === 'item').map(i => ({ ...i, gateName: g.name })));
  const gearByMaterial = new Map([...rows.values()].filter(row => soulRecipes[lower(row.id)])
    .map(row => [soulRecipes[lower(row.id)], row]));
  const order = { ready: 0, route: 1, unknown: 2, locked: 3, done: 4 };
  const items = [...rows.values()].map(row => {
    const treasure = row.category === 'treasure' && treasureGroups.find(g => g.ids.includes(row.id));
    const book = row.category === 'book' ? bookGuide(row.id) : null;
    const soul = soulGuides[row.id];
    const product = soulComponentProducts[row.id];
    const gear = gearByMaterial.get(product || row.id);
    const components = soulComponents[row.id]?.map(id => rows.get(collectionKey('goods', id))?.name || id);
    const handIn = treasure && slot.Narrative?.NarrativeSavedQuests?.find(q => q.QuestClass.includes('/MiaoShouKongKong.'));
    if (treasure && ['EQuestCompletion::QC_Started', 'EQuestCompletion::QC_Succeeded', 'EQuestCompletion::QC_Succeded'].includes(handIn?.QuestCompletion)
      && (handIn.CompletedBranches?.includes(treasure.branch) || handIn.QuestBranches?.some(b => b.BranchID === treasure.branch && b.BranchType === 'EBranchType::BranchCompleted')
        || handIn.QuestCompletion !== 'EQuestCompletion::QC_Started')) {
      row.state = 'done'; row.evidence = '本周目对应地区的珍宝交付已完成，交付后背包归零仍确认已取得。';
    }
    const origin = [...row.origins].sort((a, b) => order[a.access.state] - order[b.access.state])[0];
    const rule = allRules.filter(r => lower(r.item) === lower(row.id) && r.category === row.inventoryCategory)
      .sort((a, b) => Number(b.available) - Number(a.available))[0];
    let access = origin?.access || { state: 'unknown', label: '未收集', reason: '本周目存档确认尚未取得。当前资料未能确认它的具体获取地点或解锁条件。' };
    let guide = origin?.guide || { detail: 'nearby-bell', steps: [], source: null };
    if (soul) {
      guide = { ...soul, detail: 'specific' };
      access = analysis.stage.rank >= soul.rank || collections.regions.some(r => r.id === soul.regionId && r.available)
        ? routeAccess(soul, slot) : { state: 'locked', label: '暂不可取', reason: `先推进至${soul.regionName}。` };
    } else if (!origin && book) {
      const requiredRank = book.minRank ?? book.rank;
      const open = requiredRank === undefined || analysis.stage.rank >= requiredRank;
      guide = { detail: book.steps?.length ? 'specific' : 'nearby-bell', bell: book.bell || '', steps: book.steps || [],
        source: book.source, sourceLabel: book.sourceLabel, mapUrl: book.mapUrl };
      access = !open
        ? { state: 'locked', label: '未收集', reason: book.reason || `所属地区为${book.regionName}，当前阶段尚未开放；先收起，开放后再查。` }
        : book.steps?.length
          ? { state: 'route', label: '未收集', reason: '存档确认本周目尚未取得；下方列出可核实的路线。' }
          : { state: 'unknown', label: '未收集', reason: `存档确认本周目尚未取得。书籍索引确认所属地区为${book.regionName}，但现有资料没有给出可靠的具体拾取路线。` };
    } else if (!origin && rule) {
      access = { state: rule.available ? 'route' : 'locked', label: rule.available ? '任务流程领取' : '后续阶段领取',
        reason: `对应节点：${rule.gateName}。${rule.available ? '按任务步骤推进并领取奖励。' : '尚未到该节点，当前先收起。'}` };
      guide = { detail: 'specific', steps: [rule.action], source: rule.source };
    } else if (!origin && treasure) {
      access = { state: analysis.stage.rank >= treasureStages[treasure.branch] ? 'route' : 'locked', label: '地区珍宝', reason: `属于${treasure.name}的小张珍宝清单，交付后仍保留获取记录；具体宝箱通路未逐一判断。` };
      guide = { detail: 'specific', steps: [`在${treasure.name}寻找${row.name}，集齐本区清单后交给小张。`], source: sources.trophies.url };
    }
    if (components?.length) guide = { ...guide, steps: [...guide.steps, `收齐${components.join('、')}后合成。`] };
    if (gear && !guide.source) guide = { ...guide, source: soulSources[gear.category] };
    if (row.state === 'done') access = { state: 'done', label: '已收集', reason: row.evidence };
    const regions = [...new Set([...row.origins.map(p => p.regionId), soul?.regionId, book?.regionId].filter(Boolean))];
    const regionNames = [...new Set([...row.origins.map(p => p.regionName), soul?.regionName, book?.regionName].filter(Boolean))];
    return { ...row, origins: row.origins.map(p => ({ key: p.key, regionId: p.regionId, regionName: p.regionName,
      name: p.name, bell: p.guide?.bell || p.nearest[0]?.name || '', access: p.access.state })), access, guide,
      regionIds: regions, regionNames, soulWeapon: gear?.name || '', soulProduct: product ? rows.get(collectionKey('goods', product))?.name || product : '',
      bell: guide.bell || origin?.guide?.bell || origin?.nearest[0]?.name || '',
      available: ['ready', 'route'].includes(access.state) || access.state === 'unknown' && (regions.some(id => collections.regions.find(r => r.id === id)?.available) || Boolean(book && analysis.stage.rank >= (book.minRank ?? book.rank))),
      steps: row.category === 'flower' && !guide.steps.length ? ['收集对应的记忆花瓣并合成完整记忆之花；花瓣和完整花分开统计。'] : guide.steps };
  });
  const itemByKey = new Map(items.map(row => [row.key, row]));
  for (const row of items) {
    const id = lower(row.id), recipe = soulRecipes[id], pipa = id === 'cuixinpipa';
    if (!recipe && !pipa) continue;
    const inventory = (row.category === 'weapon' ? slot.Inventory?.MainWeaponInfos : slot.Inventory?.ShaChiWeaponInfo) || {};
    const value = itemRecord(inventory, row.category, row.id)?.AlreadySnapSoul;
    const transformed = Object.entries(weaponFormBases).some(([form, base]) => base === row.id && itemRecord(inventory, 'weapon', form));
    const material = recipe && itemByKey.get(collectionKey('goods', recipe));
    row.temper = { state: transformed || value === true || Number.isInteger(value) && value > 0 ? 'done' : value === false || value === 0 ? 'pending' : 'unknown',
      material: material?.name || recipe || '', form: soulForms[id] || '', regionIds: material?.regionIds || [], regionNames: material?.regionNames || [], bell: material?.bell || '',
      steps: pipa ? pipaRepair.steps : material?.steps || [], source: pipa ? pipaRepair.source : material?.guide.source || soulSources[row.category] };
  }
  const categories = collectibleCategories.map(category => {
    const list = items.filter(i => i.category === category.id);
    return { ...category, total: list.length, done: list.filter(i => i.state === 'done').length, unknown: list.filter(i => i.state === 'unknown').length };
  }).filter(c => c.total);
  return { items, categories, total: items.length, done: items.filter(i => i.state === 'done').length,
    accessCounts: Object.fromEntries(['ready', 'route', 'locked', 'unknown'].map(state => [state, items.filter(i => i.state !== 'done' && i.access.state === state).length])),
    scope: '物品按类型及标识去重，铃铛、挑战和碎片箱按点位统计。装备按基础形态计数，铸魂和合成部件分别显示。按本周目获取记录核对，消耗或交付后仍算取得。' };
}
