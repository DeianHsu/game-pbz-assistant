// Access is separate from collection completion. A map visit is not proof that every door is open.
import { pointAccessRoute, accessSources, physicalRouteSources } from './collection-access-data.mjs';
const forestSource = 'https://www.powerpyx.com/phantom-blade-zero-crimson-forest-collectible-locations/';
const valleySource = 'https://www.powerpyx.com/phantom-blade-zero-weeping-creek-valley-collectible-locations/';
const luSource = 'https://www.powerpyx.com/phantom-blade-zero-village-of-lu-collectible-locations/';
const labels = { done: '已收集', ready: '已知前置满足', locked: '暂不可取', route: '本区流程收集', unknown: '解锁待核实' };
const result = (state, reason, source = null, evidence = '') => ({ state, label: labels[state], reason, source, evidence });
const icePoints = new Set(['bell:Bell_LZSJ_017', 'bell:Bell_LZSJ_018', 'bell:Bell_LZSJ_019',
  'blackstone:5', 'blackstone:6', 'amber:4', 'amber:6', 'accessory:AC_Chaos', 'accessory:AC_ResistIce', 'medicine:Medicine_AdditionalRecover']);
const inventoryFields = { goods: 'InventoryInfos', weapon: 'MainWeaponInfos', phantom: 'ShaChiWeaponInfo', accessory: 'AccessoryInfos', medicine: 'MedicineInfos' };

function itemAcquired(slot, id, category = 'goods', possession = false) {
  const records = slot.Inventory?.[inventoryFields[category]], cycle = slot.PBZGameSystem?.CycleCount;
  if (!records || !Number.isInteger(cycle)) return null;
  const item = records[id];
  if (!item) return false;
  if (possession) return true;
  return Number.isInteger(item.AcquiredCycle) ? item.AcquiredCycle === cycle : null;
}
function quest(slot, id) {
  return slot.Narrative?.NarrativeSavedQuests?.find(q => q.QuestClass.split('/').at(-1).split('.')[0] === id);
}
const started = q => ['EQuestCompletion::QC_Started', 'EQuestCompletion::QC_Succeeded', 'EQuestCompletion::QC_Succeded'].includes(q?.QuestCompletion);
const tag = (slot, id) => Array.isArray(slot.EventPipeline?.GlobalTags) ? slot.EventPipeline.GlobalTags.includes(id) : null;
const gate = (satisfied, blocked, ready, source, evidence) => result(satisfied === null ? 'unknown' : satisfied ? 'ready' : 'locked', satisfied === null ? `存档中的前置记录无法确认；${blocked}` : satisfied ? ready : blocked, source, evidence);
const any = (...states) => states.includes(true) ? true : states.includes(null) ? null : false;
const every = (...states) => states.includes(false) ? false : states.includes(null) ? null : true;
function branch(slot, id, branchId) {
  const q = quest(slot, id);
  if (!q) return Array.isArray(slot.Narrative?.NarrativeSavedQuests) ? false : null;
  if (!started(q)) return false;
  return q.CompletedBranches?.includes(branchId) || q.QuestBranches?.some(b => b.BranchID === branchId && b.BranchType === 'EBranchType::BranchCompleted') || false;
}
function complete(slot, id) {
  const q = quest(slot, id);
  if (!q) return Array.isArray(slot.Narrative?.NarrativeSavedQuests) ? false : null;
  return ['EQuestCompletion::QC_Succeded', 'EQuestCompletion::QC_Succeeded'].includes(q.QuestCompletion);
}
function killed(slot, id) {
  if (!slot.BossRecord || !Number.isInteger(slot.PBZGameSystem?.CycleCount)) return null;
  const cycle = slot.PBZGameSystem.CycleCount;
  return Object.entries(slot.BossRecord[id]?.Records || {}).some(([key, record]) => key.startsWith(`${cycle}_`) && record.KillCount > 0);
}
export function routeAccess(route, slot) {
  if (route.quest && (quest(slot, route.quest)?.QuestCompletion === 'EQuestCompletion::QC_Failed' || route.quest === 'BuMieXiaDan' && tag(slot, 'pz.不灭侠胆.任务失败') === true)) {
    return { ...result('locked', '存档明确记录相关任务已失败；此项不能靠继续主线补回，请核对旧存档或下一周目。', route.source), label: '任务已失效' };
  }
  const checks = {
    city: ['进入庞镇', () => tag(slot, 'pz.庞镇.到达')],
    redCaptain: ['击败红衣鬼差，进入庞镇中心', () => any(tag(slot, 'pz.击杀.红衣鬼差P2'), itemAcquired(slot, 'HuoLiuXing', 'phantom'))],
    cavalry: ['击败鬼差高手斩骑，开放酒馆后续路线', () => any(tag(slot, 'pz.击杀.鬼差斩骑'), itemAcquired(slot, 'PoJun', 'weapon'))],
    backstreet: ['穿过幻鬼酒馆，进入后街', () => tag(slot, 'pz.后街.进入')],
    wuXuan: ['击败后街的堕落将军武轩', () => any(tag(slot, 'pz.击杀.堕落将军'), itemAcquired(slot, 'TanLang', 'phantom'))],
    wraith: ['击败骨婉约，开放井底路线', () => tag(slot, 'pz.击杀.骨婉约')],
    doctor: ['击败神医谢秋冬，开放青蛇屋后段', () => killed(slot, 'BP_Monster_MadDoctor')],
    youLong: ['击败庞镇的游龙二帮主', () => any(tag(slot, 'pz.击杀.游龙二帮主'), itemAcquired(slot, 'YouLongTou', 'phantom'))],
    changHong: ['击败长鸿，进入玉儿父亲所在屋', () => any(tag(slot, 'ljc.击杀.长鸿P2'), itemAcquired(slot, 'ThunderSpear', 'phantom'))],
    flame: ['取得烈焰狮头，烧开枯枝', () => itemAcquired(slot, 'LionHead', 'phantom', true)],
    dormantLion: ['击败舞狮尊主，取得熄火烈焰狮头', () => any(itemAcquired(slot, 'I_06004'), tag(slot, 'pz.舞狮.获得破狮子头'))],
    lionDead: ['击败舞狮尊主烈焰', () => any(tag(slot, 'pz.击杀.舞狮尊主烈焰'), itemAcquired(slot, 'I_06004'))],
    soulclaimer: ['击败鬼差高手勾魂（战利品为别离残钩）', () => itemAcquired(slot, 'DualHook', 'weapon')],
    lionKey: ['取得厚重的狮门钥匙或已打开舞狮馆大门', () => any(itemAcquired(slot, 'K_05009'), tag(slot, 'pz.舞狮.打开大门'))],
    huangKey: ['在幻鬼酒馆向牛掌柜取得黄家大宅钥匙', () => itemAcquired(slot, 'K_05011')],
    genKey: ['取得老根头家的黄铜钥匙', () => itemAcquired(slot, 'K_05004')],
    cellar: ['取得后街秘密地窖开关', () => itemAcquired(slot, 'K_06006')],
    courtyard: ['在枷笼山赎罪名单后续取得庞镇后街小院钥匙', () => itemAcquired(slot, 'K_05007')],
    necklace: ['取得沾血的项链，推进白雪儿回访', () => itemAcquired(slot, 'I_10003')],
    digTree: ['推进白雪儿至老槐树可以挖掘', () => tag(slot, 'pz.老槐树.可以挖掘')],
    pipa: ['集齐三个部件并修复幻术琵琶', () => any(tag(slot, 'quest.幻术琵琶.组装好'), complete(slot, 'HuanShuPiPa'))],
    zhouLetter: ['在枷笼山取得周平子的遗书', () => any(itemAcquired(slot, 'R_070017'), tag(slot, 'ddsd.周平子.获得遗书'), tag(slot, 'ddsd.周平子.交付遗书'))],
    lanPassage: ['完成兰家大少的密道告知，再回庞镇接续', () => any(branch(slot, 'LanJiaGongZi', '2'), itemAcquired(slot, 'K_06002'), complete(slot, 'LanJiaGongZi'))],
    cube: ['在梅谷湖收齐暗源方块的榫、卯，再返回渔夫', () => any(every(itemAcquired(slot, 'AC_ShachiWeapon_1'), itemAcquired(slot, 'AC_ShachiWeapon_2')), tag(slot, 'pz.渔夫.带回方块'), tag(slot, 'pz.渔夫.带方块见幻鬼'))],
    danceFan: ['完成天香阁步骤，带回残破舞扇', () => any(itemAcquired(slot, 'I_06009'), tag(slot, 'pz.头牌花旦.获得舞扇'), tag(slot, 'pz.头牌花旦.带回舞扇'))],
    xueTokens: ['在正道大营收齐小雪的三件大侠信物', () => any(every(...['I_03001', 'I_03002', 'I_03003'].map(id => itemAcquired(slot, id))), complete(slot, 'XiaoXue'), tag(slot, 'ljc.小雪.完成'))],
    towerKey: ['取得八卦阁楼顶钥匙', () => itemAcquired(slot, 'K_05008')],
    heroic: ['见过正道大营剑阵领头人后，回狼头领处取得破碎的侠胆', () => itemAcquired(slot, 'I_06006')],
    fleshLily: ['完成早期向玉儿交付血肉花的步骤', () => any(branch(slot, 'XueRouHua', 'S2'), tag(slot, 'xg.玉儿.给玉儿血肉花'), complete(slot, 'XueRouHua'))],
    pangTreasures: ['集齐或已交付庞镇四件珍宝', () => any(every(...['T_06001', 'T_06002', 'T_06004', 'T_06005'].map(id => itemAcquired(slot, id))), branch(slot, 'MiaoShouKongKong', '4-1'))],
    masks: ['收齐炎茹、雷婷、蛊鹤、寒岁四张灭法面具', () => every(...['K_05003', 'K_12001', 'K_08001', 'K_16001'].map(id => itemAcquired(slot, id)))],
    loongToken: ['取得龙形令牌或阴、阳两半令牌', () => any(itemAcquired(slot, 'K_06005'), every(itemAcquired(slot, 'K_06003'), itemAcquired(slot, 'K_06004')))],
    genHome: ['完成归途，交回老根头的木梳', () => complete(slot, 'GuiTu')],
    brotherFlower: ['先在黄家大宅取得再会兄长的第一朵花瓣', () => itemAcquired(slot, 'F_06003')],
    kinFlower: ['先在庞镇取得相煎何急的第一朵花瓣', () => itemAcquired(slot, 'F_06002')],
    lakeTreasures: ['集齐或已交付梅谷湖三件珍宝', () => any(every(...['T_08001', 'T_06003', 'T_08003'].map(id => itemAcquired(slot, id))), branch(slot, 'MiaoShouKongKong', '5-1'))],
    leaveNone: ['在陆家村推进一个不留后回访溪谷', () => {
      const q = quest(slot, 'YiGeBuLiu'), layers = slot.EventPipeline?.LoadedDataLayer;
      const layerReady = layers ? Object.values(layers).flat().some(s => String(s).includes('Monster_YiGeBuLiu_XiGu')) : null;
      return any(q ? started(q) : Array.isArray(slot.Narrative?.NarrativeSavedQuests) ? false : null, layerReady);
    }]
  };
  const required = route.needs.map(id => ({ id, text: checks[id][0], satisfied: checks[id][1]() }));
  const blocked = required.filter(r => r.satisfied === false), unknown = required.filter(r => r.satisfied === null);
  const state = blocked.length ? 'locked' : unknown.length ? 'unknown' : 'ready';
  const reason = blocked.length ? '尚需：' + blocked.map(r => r.text).join('；') + '。'
    : unknown.length ? '缺少可识别的前置记录：' + unknown.map(r => r.text).join('；') + '。'
    : '已核对的路线门槛均已满足。' + route.action;
  return { ...result(state, reason, route.source, '逐项核对本周目任务、事件、钥匙和战利品；获取能力可使用已持有的继承装备，收集计数仍按本周目。'), requirements: required };
}

export function collectionAccess(point, slot, regionOpen) {
  if (point.state === 'done') return result('done', '该点已计入已收集。');
  if (!regionOpen) return result('locked', '此子区尚未开放；推进主线到该区域后再处理。');
  const map = point.rawMap.toLowerCase(), key = `${point.kind}:${point.id || point.order}`;
  const nearbyReached = point.nearest?.[0]?.activated === true;
  const route = pointAccessRoute(point);
  if (route) return routeAccess(route, slot);
  if (map === 'meigu_yiji') return routeAccess({ needs: ['masks'], action: '四张灭法面具门槛已满足，可进入幻术师遗迹；内部继续按路线开门。', source: accessSources.lake }, slot);
  if (map === 'dengdingshandao') {
    const repaired = any(tag(slot, 'quest.幻术琵琶.组装好'), complete(slot, 'HuanShuPiPa'));
    if (repaired !== true) return gate(repaired, '先修复幻术琵琶，才能穿过梅谷湖雾门进入枷笼山。', '', accessSources.mountain, '读取幻术琵琶组装标记及任务完成记录。');
  }
  if (map === 'fujizhilin' && icePoints.has(key)) {
    return gate(tag(slot, 'fjzl.风雪数据层.激活'), '需等血色森林冰封后回访杀气塔，当前先不用找。',
      '冰封门槛已满足，可以回访杀气塔；塔内仍需按路线开门、清敌。', forestSource,
      '冰封读取 fjzl.风雪数据层.激活；本机 BPF_DataLayer_Snow 与 BPF_BingXueGuQiu_MusicUnlock 均引用此标记。点位范围按杀气塔铃铛及其原生坐标逐项绑定。');
  }
  if (map === 'xigu' && (point.id === 'Bell_QingDaoFu' || point.id === 'F_12001')) {
    return gate(itemAcquired(slot, 'K_04902'), '需“人偶舌头”打开红房子内门；完成后续的梦差幻境三处传送门后再来。',
      '本周目已取得人偶舌头，可以回红房子开门；钥匙使用后数量归零仍算取得。', valleySource, '读取 Inventory.InventoryInfos.K_04902.AcquiredCycle，与当前周目比较。');
  }
  if (map === 'zhengdaodaying') {
    const hasKey = itemAcquired(slot, 'K_03002');
    if (hasKey !== true) return gate(hasKey, '需“正道大营外门钥匙”打开入口，当前先不把营内收集当作可取。', '', luSource, '读取本周目 K_03002 的获取记录，不因处于同一关卡文件或附近铃铛而推定大门已开。');
  }
  if (/^BPF_BuMieXiaDan_Memory_/.test(point.condition || '')) return routeAccess({ needs: ['heroic'], action: '持破碎的侠胆处理正道高手遭遇，在异变前帮助其解脱并调查花瓣。', source: accessSources.camp, quest: 'BuMieXiaDan' }, slot);
  if (map === 'fujizhilin' && point.id === 'CiGuHunDun') {
    const frozen = tag(slot, 'fjzl.风雪数据层.激活');
    if (frozen !== true) return gate(frozen, '需后期冰封和三面混沌的镜林战斗；当前先推进主线。', '', forestSource, '三面魔偶出场流程 BPF_SanTouMoOuChuChang 引用冰封和溪谷初战标记。');
    if (tag(slot, 'fjzl.三头魔偶.激活') === true) return result('ready', '镜林三面魔偶已激活，继续三面混沌的当前目标；特殊奖励仍须按要求使用炽刃。', forestSource, '读取 fjzl.三头魔偶.激活。');
    const current = quest(slot, 'SanMianHunDun');
    return result('unknown', `冰封已开启，但镜林最终战的开启记录尚未确认。${current && started(current) ? '请继续三面混沌的当前目标。' : '还需核对三面混沌路线。'}`, forestSource);
  }
  if (map === 'fujizhilin' && point.id === 'F_02021') {
    return gate(killed(slot, 'BP_Monster_JingYe'), '先击败荆野，再查战场后方山崖下的尸体附近。',
      '本周目已击败荆野；花瓣在战场后方山崖下，不需要等冰封。', 'https://www.18183.com/gonglue/202610/nlo97vjh.html', '读取本周目 BP_Monster_JingYe 击杀记录，并核对具体花瓣位置。');
  }
  if (map === 'fujizhilin' && point.kind === 'banyan') {
    const current = quest(slot, 'RongShuZhiXin');
    if (!current && Array.isArray(slot.Narrative?.NarrativeSavedQuests)) return result('locked', '先在血色森林与虚空大人对话，接取“榕树之心”后再挑战。', forestSource);
    if (started(current) && nearbyReached) return result('ready', '榕树之心已接取，迷雾消散处已到达；此挑战首次通行即可打，无需等后期。', forestSource, '读取当前槽位榕树之心任务及此点最近铃铛的激活记录。');
  }
  if (map === 'fujizhilin' && point.kind === 'pillar') {
    const current = quest(slot, 'XueMaiJueXing');
    const inTrials = current?.QuestBranches?.some(b => b.BranchID === '1' && b.BranchType === 'EBranchType::BranchActivating');
    if ((inTrials || tag(slot, 'lz.龙柱.回忆起特殊杀气') === true) && nearbyReached) return result('ready', '血脉觉醒已开启试炼，附近铃铛已激活；难度高可以晚点打，不属于必须等后期解锁。', forestSource, '读取血脉觉醒试炼分支或特殊杀气回忆标记，并核对最近铃铛。');
  }
  if (map === 'lujiacun' && nearbyReached && ['medicine:GuiShen', 'accessory:AC_SummonDuration', 'amber:4'].includes(key)) {
    return result('ready', point.id === 'AC_SummonDuration' ? '本地区首次通行即可完成这条支线，无需等后期；按下方步骤交付后领取。' : '附近区域已到达，攻略列为首次通行可取；没有已知后期剧情门槛。', luSource, '已核对具体走法与首次通行范围，且此点最近铃铛已激活。');
  }
  const physical = point.kind === 'bell' || (!point.condition || point.condition === 'None') && (/Chest|Rubbish/i.test(point.actor || '') || point.domain && point.domain !== 'None');
  if (physical && physicalRouteSources[map]) return result('route', '攻略将此项列在本地区路线内；可随本区探索继续处理。这里未逐门确认当前通路，不等同于“眼前的门已开”。', physicalRouteSources[map], '已核对本区路线范围；实时门锁状态仍与“已知前置满足”分开展示。');
  return result('unknown', '只确认尚未收集；此点的门、通路或剧情条件还未核实，暂不判为现在可取。');
}
