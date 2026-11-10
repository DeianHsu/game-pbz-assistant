import { collectionGuides } from './collection-guides.mjs';
import { additionalCheckpoints } from './risk-data.mjs';
import { collectionAccess } from './collection-access.mjs';
import { pointAccessRoute } from './collection-access-data.mjs';
import { itemRecord } from './item-record.mjs';

export const collectionCategories = [
  ['bell', '铃铛'], ['weapon', '武器及影之武装'], ['accessory', '饰品及药瓶'], ['challenge', '挑战地点'],
  ['amber', '杀气琥珀碎片'], ['blackstone', '黑石碎片'], ['flower', '记忆之花']
].map(([id, name]) => ({ id, name }));
const fields = { weapon: 'MainWeaponInfos', phantom: 'ShaChiWeaponInfo', accessory: 'AccessoryInfos', medicine: 'MedicineInfos', flower: 'InventoryInfos' };
const stages = { xigu: 1, fujizhilin: 2, lujiacun: 3, zhengdaodaying: 3, pangzhen: 4, houjie: 4, meiguhu: 5, meigu_yiji: 5, dengdingshandao: 6, ximeng: 7, duanhunshan: 8, duanhunya: 8 };
const lower = value => String(value || '').toLowerCase();
const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);

export function collectionState(point, slot) {
  if (point.kind === 'bell') {
    const manager = slot.BellManager;
    const arrays = [manager?.ActivateBellIDs, manager?.ActivateCraneBellIDs];
    if (arrays.some(a => Array.isArray(a) && a.some(id => lower(id) === lower(point.id)))) return { state: 'done', evidence: '铃铛激活记录已存在。' };
    return { state: arrays.every(Array.isArray) ? 'missing' : 'unknown', evidence: '未找到对应铃铛的激活记录。' };
  }
  if (fields[point.kind]) {
    const table = slot.Inventory?.[fields[point.kind]], cycle = slot.PBZGameSystem?.CycleCount;
    if (!isRecord(table) || !Number.isInteger(cycle)) return { state: 'unknown', evidence: '缺少可识别的背包或周目记录。' };
    const record = itemRecord(table, point.kind, point.id);
    if (!record) return { state: 'missing', evidence: '当前槽位没有该物品的获取记录。' };
    if (!Number.isInteger(record.AcquiredCycle)) return { state: 'unknown', evidence: '物品记录未保存可识别的获取周目。' };
    return { state: record.AcquiredCycle === cycle ? 'done' : 'missing',
      evidence: record.AcquiredCycle === cycle ? '本周目获取记录已存在；消耗、交付或合成不会使它重新变成缺失。' : `有第 ${record.AcquiredCycle + 1} 周目记录，但本周目尚未取得。` };
  }
  if (['banyan', 'pillar', 'scarecrow'].includes(point.kind)) {
    const nodes = slot.EventPipeline?.ExecuteNodeGuid;
    if (!isRecord(nodes) || !point.nodes?.length) return { state: 'unknown', evidence: '缺少可识别的挑战完成事件。' };
    return { state: point.nodes.some(id => Object.hasOwn(nodes, id)) ? 'done' : 'missing', evidence: '挑战只按对应完成事件判断；到访或场景物件记录不代替挑战完成。' };
  }
  const checks = [], actors = slot.LevelActorManager, nodes = slot.EventPipeline?.ExecuteNodeGuid;
  if (point.actor && point.actor !== 'None') {
    if (!isRecord(actors)) checks.push(null);
    else {
      const keys = Object.keys(actors).map(lower), query = lower(point.actor), dash = query.indexOf('-');
      // A qualified ID may match an old bare key, never another level's qualified key.
      checks.push(keys.includes(query) || dash > 0 && keys.includes(query.slice(dash + 1)));
    }
  }
  if (point.domain && point.domain !== 'None') {
    const domains = slot.PBZGameSystem?.CompleteAddItemMobDomainNames;
    checks.push(Array.isArray(domains) ? domains.some(d => lower(d) === lower(point.domain)) : null);
  }
  if (point.nodes?.length) checks.push(isRecord(nodes) ? point.nodes.some(id => Object.hasOwn(nodes, id)) : null);
  const state = checks.includes(true) ? 'done' : !checks.length || checks.includes(null) ? 'unknown' : 'missing';
  return { state, evidence: state === 'done' ? '场景物件记录、战斗发奖记录或对应事件节点已存在。' : state === 'missing' ? '对应场景物件、战斗发奖和事件节点均未记录完成。' : '点位有记录，但缺少足够的存档字段来判断。' };
}

function acquisition(point) {
  const key = `${point.rawMap}:${point.kind}:${point.id || point.order}`;
  const guide = collectionGuides[key];
  if (guide) return { ...guide, detail: 'specific' };
  const route = pointAccessRoute(point);
  if (route) return { steps: [route.action], source: route.source, detail: 'specific' };
  const risk = additionalCheckpoints.flatMap(g => g.requirements.map(r => ({ ...r, source: r.source || g.source })))
    .find(r => r.item && lower(r.item) === lower(point.id) && r.category === point.kind);
  if (risk) return { steps: [risk.action], source: risk.source, detail: 'specific' };
  const method = point.kind === 'bell' ? '到达后互动激活铃铛。'
    : /Chest/i.test(point.actor || '') ? '检查此点对应的宝箱。'
    : /Rubbish|MemoryFlower/i.test(point.actor || '') ? '调查此点的场景拾取物。'
    : ['banyan', 'pillar', 'scarecrow'].includes(point.kind) ? `互动并完成${{ banyan: '榕树', pillar: '龙柱', scarecrow: '稻草人' }[point.kind]}挑战。`
    : point.domain && point.domain !== 'None' ? '完成此点的敌群战斗并领取结算奖励。'
    : point.nodes?.length ? '此点与剧情、对话或挑战奖励关联；按对应区域任务推进后核对领取。'
    : '到点后检查附近拾取物或宝箱；具体触发条件尚待核实。';
  return { steps: [method], detail: 'nearby-bell', source: null };
}

export function analyzeCollections(slot, catalog, stage) {
  const regions = (catalog.maps || []).map(region => {
    const bells = region.points.filter(p => p.kind === 'bell');
    const reached = id => lower(stage.location).includes(lower(id)) || stage.regions.some(name => lower(name).includes(lower(id)));
    const seen = new Set();
    const points = region.points.filter(p => {
      if (!['bell', 'weapon', 'phantom', 'accessory', 'medicine'].includes(p.kind)) return true;
      const key = `${p.kind}:${lower(p.id)}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).map(point => {
      const result = collectionState(point, slot);
      const sameMapBells = bells.filter(b => b.position && b.key !== point.key && lower(b.rawMap) === lower(point.rawMap));
      const nearest = point.position ? sameMapBells
        .map(b => ({ id: b.id, name: b.name, position: b.position,
          activated: collectionState(b, slot).state === 'done',
          distance: Math.round(Math.hypot(...b.position.map((v, i) => v - point.position[i])) / 100) }))
        .sort((a, b) => a.distance - b.distance).slice(0, 3) : [];
      const petalName = point.condition?.startsWith('BPF_BuMieXiaDan_Memory_')
        ? catalog.items?.find(item => item.category === 'goods' && lower(item.id) === lower(point.id))?.name : null;
      const name = petalName || point.name || ({ amber: '杀气琥珀碎片', blackstone: '黑石碎片', banyan: '榕树挑战', pillar: '龙柱挑战', scarecrow: '稻草人挑战' }[point.kind]) || '未识别收集点';
      const regionOpen = reached(point.rawMap) || stage.rank >= (stages[lower(point.rawMap)] ?? Infinity);
      const access = collectionAccess({ ...point, ...result, nearest }, slot, regionOpen);
      return { ...point, ...result, name, nearest, access, available: access.state !== 'locked',
        guide: acquisition(point) };
    });
    const categories = collectionCategories.map(category => {
      const list = points.filter(p => p.category === category.id);
      return { ...category, total: list.length, done: list.filter(p => p.state === 'done').length,
        missing: list.filter(p => p.state === 'missing').length, unknown: list.filter(p => p.state === 'unknown').length };
    });
    const total = categories.reduce((sum, c) => sum + c.total, 0), done = categories.reduce((sum, c) => sum + c.done, 0), unknown = categories.reduce((sum, c) => sum + c.unknown, 0);
    const visited = region.members.some(reached);
    const accessCounts = Object.fromEntries(['ready', 'route', 'locked', 'unknown'].map(state => [state, points.filter(p => p.state !== 'done' && p.access.state === state).length]));
    return { id: region.id, name: region.name, members: region.members, categories, points, total, done, unknown, accessCounts,
      percentage: unknown ? null : Math.floor(done / total * 100), available: visited || stage.rank >= (stages[lower(region.id)] ?? Infinity),
      visited, current: region.members.some(id => lower(stage.location).includes(lower(id))) };
  });
  return { regions, selectedMap: regions.find(m => m.current)?.id || regions.find(m => m.visited)?.id || regions[0]?.id,
    scope: '按游戏地图的七类统计；装备与花瓣按本周目获取记录判断，铃铛按激活记录判断。' };
}
