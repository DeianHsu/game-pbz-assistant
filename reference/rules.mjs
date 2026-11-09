import { additionalCheckpoints, baiXueSteps, checkpointOrder, chivalryEncounters, questAchievements, questFailureRules, sources, unknownQuestFailure } from './risk-data.mjs';
import { ownedItem } from './achievements.mjs';
import { baiXueNecklaceGiven } from './collection-access.mjs';
import { detectStage, stageGate } from './stages.mjs';

const POWERPYX = 'https://www.powerpyx.com/phantom-blade-zero-trophy-guide-roadmap/';
const GAMERSKY = 'https://www.gamersky.com/handbook/202611/2239917.shtml';
const ZHANG = 'https://www.bilibili.com/video/BV16esZ6aESu/';

// Only native quest IDs/branch IDs observed in build 26266538 are used.
// Deadlines are guide claims, not a promise of complete game coverage.
const baseCheckpoints = [
  { id: 'valley', name: '离开悲泣溪谷前', note: '保守提前检查；隔绝楔子的精确失效触发点，攻略仍未确认。', source: POWERPYX,
    requirements: [{ quest: 'GeJueXieZi', branch: '1-1', title: '交出第一块浑源石', action: '在溪谷杀气塔顶将第一块浑源石交给友善的鬼差。后续区域的步骤可以以后继续。' }] },
  { id: 'jingye', name: '击败荆野前', note: '采齐药材后还要回去交任务。', source: POWERPYX,
    requirements: [{ quest: 'JianXiYiShi', title: '完成见习医师', action: '返回悲泣溪谷驿站，将三种药材交给玉儿。' }] },
  { id: 'baichilian', name: '击败白赤练前', note: '检查悲泣溪谷与血色森林的交付、接取和救人步骤。血肉花以较早截止时间检查；全任务不必在这里结清。', source: GAMERSKY,
    requirements: [
      { quest: 'NanYanZhiYin', title: '完成难言之隐', action: '按当前任务提示走完跑腿步骤并交付。' },
      { quest: 'QingLiMenHu', title: '完成清理门户', action: '取得羽弓后回驿站屋顶，交给老弓手。' },
      { quest: 'JiuSiFuShang', title: '完成救死扶伤', action: '救治四名飞贼，再回飞贼营地向玉儿交付。' },
      { quest: 'DaoYiYouDao', title: '完成盗亦有道', action: '将飞贼血书交给飞贼营地的梁上君，完成问答。' },
      { quest: 'BaiShanMiWen', accepted: true, title: '接取白山秘闻', action: '在飞贼营地大桥上与兰兰对话，先接下任务；后续步骤在其他区域。', source: POWERPYX },
      { quest: 'JiaoTuSanKu', accepted: true, title: '救出妙手小张', action: '挂笼小道放下囚笼后，打开笼门并对话。接取狡兔三窟是救人的已知证据。', source: ZHANG },
      { quest: 'XueRouHua', branch: 'S2', title: '把血肉花交给玉儿', action: '击败新娘阿花后拾取血肉花，回驿站交给玉儿。后续到庞镇的步骤可晚些做。', source: POWERPYX },
      { quest: 'XianYin', title: '收齐弦音的六朵记忆之花', action: '检查镜林六朵虚空留下的记忆之花，关系到白赤练战斗支援；这是可选提示。', optional: true, source: 'https://www.gamersky.com/z/dbzero/handbook/' }
    ] },
  { id: 'pangzhen', name: '进入庞镇前', note: '先接两人的任务；打通陆家村水井密道后，返回村口分别告知，再进入庞镇。', source: POWERPYX,
    requirements: [
      { quest: 'GuiTu', branch: '2', title: '回村口告知老根头密道已通', action: '先与老根头接取归途；打通密道后回到村口，完成“告知其密道已通”。' },
      { quest: 'LanJiaGongZi', branch: '2', title: '回村口告知兰少狄密道已通', action: '先与兰少狄接取兰家大少；打通密道后回到村口，完成“告知其密道已通”。' }
    ] },
  { id: 'baishan', name: '推进正道大营白山秘闻时', note: '这是局部检查：击败乌冷霜后，先调查毕桃桃的肉身，再继续后面的首领。', source: POWERPYX,
    requirements: [{ quest: 'BaiShanMiWen', branch: '2', title: '查看毕桃桃的肉身', action: '任务推进到“查看山道尽头毕桃桃的肉身”时，务必先互动查看。' }] },
  { id: 'qingshe', name: '进入青蛇屋外围前', note: '游戏任务资源中发现泣声何来的中断标签。这里只覆盖已核对的任务，其他后期断线条件仍待补齐。', source: null,
    requirements: [{ quest: 'QiShengHeLai', branches: ['3', '4'], title: '推进泣声何来的宗祠步骤', action: '先完成登上宗祠寻找哭声、进入宗祠地下这两个目标。精确截止事件尚未在游戏内复现。' }] },
  { id: 'ending', name: '结局路线复核', advisory: true, note: '持续规划用的复核清单，不能据此保证真结局；还须完成游戏内前置路线。', source: POWERPYX,
    requirements: [
      { quest: 'HuXinMiMi', title: '完成湖心秘密', action: '优先跟进湖心秘密及相关紫色迷局，结合任务日志继续推进。' },
      { quest: 'XueMaiJueXing', title: '完成血脉觉醒', action: '完成五座龙柱对应的挑战；可以跨区域继续。' }
    ] }
];

baseCheckpoints.find(g => g.id === 'baichilian').requirements.push(
  { check: 'item', category: 'accessory', item: 'AC_ResistNonBreak', title: '核对坚岩护腕', action: '彭猛前后分别与驿站的正道弟子对话，再去坟前领取；检查实际饰品记录。', achievements: ['ACH_046'], impact: '30种饰品有替代物，不是单件必需成就。' },
  { check: 'item', category: 'phantom', item: 'UnnamedBow', title: '确认羽弓已经领取', action: '清理门户完成后核对羽弓，别只停留在取得任务物品的阶段。', achievements: ['ACH_047'] },
  { check: 'item', category: 'accessory', item: 'AC_Stealth', title: '核对盗亦有道的屏息绑带', action: '问答完成后检查饰品奖励。', achievements: ['ACH_046'], impact: '饰品计数有替代物。' },
  { check: 'item', category: 'accessory', item: 'AC_Drink', title: '核对见习医师的香薰药盒', action: '检查玉儿交付后的饰品奖励。', achievements: ['ACH_046'], impact: '饰品计数有替代物。' }
);
baseCheckpoints.find(g => g.id === 'baishan').regions = ['Zhengdaodaying'];
baseCheckpoints.find(g => g.id === 'qingshe').note = '游戏资源出现泣声何来的中断标签。与“进入戏梦山庄”的十任务总复核分别显示，精确事件触发尚未实机复现。';
baseCheckpoints.find(g => g.id === 'ending').note = '终局前复核湖心秘密与血脉觉醒；山庄入口前的十个紫色任务另列。终局入口的警告本身不能用来推断前置失败。';
export const checkpoints = [...baseCheckpoints, ...additionalCheckpoints].sort((a, b) => checkpointOrder.indexOf(a.id) - checkpointOrder.indexOf(b.id));

export const STATE_LABELS = { done: '已完成', active: '进行中', failed: '已失败', interrupted: '已中断', missing: '存档未记录', unknown: '待核实' };
export function questId(classPath = '') { return classPath.split('/').at(-1).split('.')[0]; }
export function questState(record) {
  if (!record) return 'missing';
  switch (record.QuestCompletion) {
    case 'EQuestCompletion::QC_Succeded':
    case 'EQuestCompletion::QC_Succeeded': return 'done';
    case 'EQuestCompletion::QC_Started': return 'active';
    case 'EQuestCompletion::QC_Failed': return 'failed';
    default: return 'unknown';
  }
}
function branchCompleted(record, branch) {
  return Array.isArray(record?.CompletedBranches) && record.CompletedBranches.includes(branch)
    || record?.QuestBranches?.some(b => b.BranchID === branch && b.BranchType === 'EBranchType::BranchCompleted') === true;
}
function currentItem(slot, category, id) {
  const item = ownedItem(slot, category, id), cycle = slot.PBZGameSystem?.CycleCount;
  if (!item.known || !Number.isInteger(cycle)) return null;
  if (!item.record) return false;
  return Number.isInteger(item.record.AcquiredCycle) ? item.record.AcquiredCycle === cycle : null;
}
function nextBaiXueStep(slot, records, tags) {
  const snow = records.get('BaiXue'), ledger = records.get('YongShengDaoZhu');
  const snowState = questState(snow), ledgerState = questState(ledger);
  const got = id => currentItem(slot, 'goods', id) === true;
  const active = (q, id) => q?.QuestBranches?.some(b => b.BranchID === id && b.BranchType === 'EBranchType::BranchActivating');
  if (snowState === 'failed') return { id: 'failed', quest: 'BaiXue' };
  if (snowState === 'done' || currentItem(slot, 'accessory', 'AC_Bleed') === true) return { id: 'done', quest: 'BaiXue' };
  const spared = tags.has('ddsd.杀气怪面.放走'), defeated = tags.has('ddsd.杀气怪面.死亡');
  let id;
  if (tags.has('pz.老槐树.可以挖掘') || got('F_06022')) id = 'tree';
  else if (tags.has('pz.老槐树.解锁记忆之花') || got('F_06004')) id = 'petal2';
  else if (baiXueNecklaceGiven(slot) === true) id = 'petal1';
  else if (snowState === 'active' && active(snow, '1') && !spared) id = 'puppet';
  else if (got('K_05007') && got('I_10003')) id = 'home';
  else if (spared) id = 'spared';
  else if (tags.has('ddsd.杀气怪面.不放走') && !defeated) id = 'fight';
  else if (defeated || ledgerState === 'done' || snowState === 'active' || tags.has('ddsd.白雪儿.接任务') || got('K_05007')) id = 'puppet';
  else if (ledgerState === 'failed') return { id: 'failed', quest: 'YongShengDaoZhu' };
  else if (tags.has('ddsd.获得物品.赎罪名单') || got('R_070002') || branchCompleted(ledger, '1') && ledgerState === 'active' || active(ledger, '2')) id = 'deliver';
  else id = ledgerState === 'active' || tags.has('ddsd.杀气怪面.对话3') ? 'ledger' : 'start';
  return { ...baiXueSteps[id], id };
}
function baiXueCheck(step, slot, failures) {
  if (step.id === 'done') return { satisfied: true, state: 'done', mode: 'auto', evidence: '白雪儿已完成，或本周目已取得饰品雪与血。' };
  if (step.id === 'failed') return { quest: step.quest, satisfied: false, state: 'failed', mode: 'auto', evidence: failures.get(step.quest)?.failure.reason };
  const petals = ['F_06004', 'F_06022'].map(id => currentItem(slot, 'goods', id));
  const accessory = currentItem(slot, 'accessory', 'AC_Bleed');
  const progress = step.map === 'HouJie' ? `花瓣 ${petals.includes(null) ? '待核对' : petals.filter(Boolean).length + '/2'} · 雪与血${accessory === null ? '待核对' : '待领取'}` : '';
  return { quest: step.quest, satisfied: false, state: step.verify ? 'unknown' : 'active', mode: step.verify ? 'manual' : 'auto',
    stateLabel: step.verify ? '领取待核对' : '下一步', title: step.title, action: step.action, bell: step.bell,
    evidence: step.evidence, source: step.source, otherSource: step.otherSource, progress };
}
function zhouRescued(record, has, letter) {
  return has('ddsd.周平子.开笼子') || has('ddsd.周平子.获得遗书') || letter === true
    || branchCompleted(record, '1') || record?.QuestBranches?.some(b => b.BranchID === '1' && b.BranchType === 'EBranchType::BranchActivating');
}
function questFailure(id, record, state, tags, slot) {
  if (state === 'done' || state === 'unknown') return null;
  const rule = questFailureRules[id];
  if (rule && tags.has(rule.tag) && (record || rule.state === 'failed') && !rule.unlessTags?.some(tag => tags.has(tag))
      && !rule.unlessBranches?.every(branch => branchCompleted(record, branch))
      && !(id === 'WuXiangWang' && zhouRescued(record, tag => tags.has(tag), currentItem(slot, 'goods', 'R_070017')))) {
    const context = Object.entries(rule.context || {}).filter(([tag]) => tags.has(tag));
    return { state: state === 'failed' ? state : rule.state || 'interrupted', reason: rule.reason + context.map(([, text]) => text).join(''),
      evidence: [rule.tag, ...context.map(([tag]) => tag)].join('、'), action: rule.action || '', source: rule.source || '' };
  }
  return state === 'failed' ? { state, reason: unknownQuestFailure, evidence: record.QuestCompletion } : null;
}
function evaluateTaskRisk(rule, slot, record, catalog) {
  const state = questState(record), tags = slot.EventPipeline?.GlobalTags;
  const knownTags = Array.isArray(tags), has = tag => knownTags && tags.includes(tag);
  const details = rule.check === 'chivalry' ? chivalryEncounters.map((encounter, i) => {
    const collected = currentItem(slot, 'goods', encounter.id);
    const freed = has(`pz.不灭侠胆.帮助正道解脱${i + 1}`);
    const flower = catalog.items?.find(item => item.category === 'goods' && item.id === encounter.id)?.name || encounter.id;
    return { ...encounter, flower, label: `第 ${i + 1} 处 · ${encounter.name} · ${encounter.area}`, state: collected === true ? 'done' : freed ? 'active' : 'unknown',
      text: collected === true ? '本周目花瓣已取得' : freed ? '已记录解脱，花瓣尚未记录取得' : '尚无解脱或花瓣记录，不能直接判为失败' };
  }) : null;
  const response = (state, stateLabel, evidence, extra = {}) => ({ satisfied: state === 'done', state, stateLabel, mode: 'auto', evidence,
    ...(details && { riskDetails: details, locationSource: sources.chivalry.url }), ...extra });
  if (state === 'failed') return response('failed', '任务已失败', '所选槽位明确记录任务失败；不会用残留分支或旧物品覆盖失败状态。');
  if (state === 'unknown') return response('unknown', '任务状态待核实', '任务包含当前尚未识别的状态，不能用残留事件推断完成。', { mode: 'manual' });
  if (rule.check === 'red-route') {
    const reward = currentItem(slot, 'goods', 'F_03008') === true && currentItem(slot, 'accessory', 'AC_LowShachi') === true;
    if (reward) return response('done', '双人战奖励已领取', '本周目红衣女剑客花瓣 F_03008 与同心双鱼佩均已取得；奖励领取与任务日志分开核对。');
    if (!knownTags) return response('unknown', '路线记录待核实', '缺少女剑客离场、死亡和剑阵事件记录。', { mode: 'manual' });
    const escaped = has('zddy.红衣女剑客.荡绳离开'), dead = has('zddy.击杀.红衣女剑客');
    const formation = ['zddy.剑阵.出场', 'zddy.剑阵.二阶段', 'zddy.击杀.剑阵1', 'zddy.击杀.剑阵2', 'zddy.剑阵.完成任务', 'achievment.剑横北斗.完成'].some(has);
    if (dead && !formation) return response('failed', '提前击杀风险', '已记录红衣女剑客死亡，尚无七星剑阵入战、击杀或完成事件；结合攻略提示存在提前击杀的奖励遗漏风险。这里不改写任务日志状态。', { riskNote: '请先核对旧手动存档，继续推进不会复活已经击杀的女剑客。' });
    if (escaped) return response('done', '已记录荡绳离开', '存档存在 zddy.红衣女剑客.荡绳离开；鸽舍脱战步骤已确认，七星双人战及奖励仍由另外两项检查。');
    if (dead || state === 'done') return response('unknown', '击杀时序待核对', '已结束任务或记录女剑客死亡，但缺少离场及成对奖励证据；单独死亡标记不能区分提前击杀与双人战击杀。', { mode: 'manual' });
    return response(state === 'active' ? 'active' : 'missing', state === 'active' ? '等待鸽舍脱战步骤' : '尚无鸽舍任务记录', '任务、死亡和荡绳离场记录分开检查；尚无离场证据，不能据此宣称路线已安全完成。');
  }
  if (rule.check === 'chivalry') {
    if (has('pz.不灭侠胆.任务失败')) return response('failed', '任务已失败', '存档存在 pz.不灭侠胆.任务失败；以明确失败事件为准。');
    if (state === 'done') return response('done', '任务已完成', '原生任务状态已完成，不要求六处全部收齐才归档。');
    const completed = currentItem(slot, 'goods', 'TU_19006');
    if (completed === true) return response('done', '侠胆奖励已取得', '本周目已取得 TU_19006（不灭侠胆），当前数量归零仍按获取周目确认。');
    const freed = details.filter(d => d.state === 'active' || d.state === 'done').length, collected = details.filter(d => d.state === 'done').length;
    const jade = currentItem(slot, 'goods', 'I_06006'), active = record?.QuestBranches?.some(b => b.BranchID === '1' && b.BranchType === 'EBranchType::BranchActivating');
    const evidence = `读取本周目花瓣、六个“帮助正道解脱”事件与明确失败标记；已记录解脱或花瓣 ${freed} 处，花瓣取得 ${collected}/6。未记录不等于该高手已异变或任务失败。`;
    if (!knownTags || jade === null || details.some(d => currentItem(slot, 'goods', d.id) === null)) return response('unknown', '遭遇记录待核实', evidence + '部分必要字段缺失。', { mode: 'manual' });
    return response(state === 'active' ? 'active' : 'missing', jade || active ? '自动跟踪解脱与花瓣' : '前置尚未完成', evidence,
      { progress: `花瓣 ${collected}/6`, riskNote: '交战后留意跪地窗口，及时帮助弟子解脱，再调查原地出现的花瓣。',
        ...(!jade && !active ? { action: '当前先见过剑阵领头人，再回“组织”酒馆找狼头领取破碎的侠胆；现在尚未进入持侠胆处理高手的阶段。' } : {}) });
  }
  if (rule.check === 'cage') {
    const letter = currentItem(slot, 'goods', 'R_070017');
    if (state === 'done' || zhouRescued(record, has, letter)) return response('done', '救人路线已有证据', '开笼事件、遗书获取、遗书交付分支或任务完成记录已存在；早期 S1 线索本身不代替救人。');
    return response(knownTags && letter !== null ? 'missing' : 'unknown', '尚无开笼或遗书记录', '没有可确认的开笼、遗书或任务证据；先按救人步骤推进，不据此推断周平子已死。', { mode: knownTags && letter !== null ? 'auto' : 'manual' });
  }
}
export function requirementResult(rule, record) {
  const state = questState(record);
  // Failed/unknown records never become green through old completed branches.
  if (state === 'failed' || state === 'unknown' || state === 'missing') return { satisfied: false, state };
  const branches = rule.branches || (rule.branch ? [rule.branch] : []);
  const satisfied = (!rule.branchOnly && state === 'done') || (rule.accepted ? state === 'active' : branches.length > 0 && branches.every(b => branchCompleted(record, b)));
  return { satisfied, state };
}

function evaluateRequirement(rule, slot, catalog, records, achievements) {
  if (!rule.check) return { ...requirementResult(rule, records.get(rule.quest)), mode: 'auto' };
  if (['red-route', 'chivalry', 'cage'].includes(rule.check)) return evaluateTaskRisk(rule, slot, records.get(rule.quest), catalog);
  if (rule.check === 'achievement') {
    const achievement = achievements?.rows.find(a => a.id === rule.achievement);
    return { satisfied: achievement?.state === 'done', state: achievement?.state || 'unknown', stateLabel: achievement?.stateLabel, mode: 'auto', evidence: achievement?.evidence || '没有可识别的账号成就记录。' };
  }
  if (rule.check === 'tags') {
    const tags = slot.EventPipeline?.GlobalTags;
    if (!Array.isArray(tags)) return { satisfied: false, state: 'unknown', mode: 'manual', evidence: '所选槽位没有可识别的事件标签。' };
    const found = rule.tags.filter(tag => tags.includes(tag));
    return { satisfied: found.length === rule.tags.length, state: 'active', mode: 'auto', progress: `${found.length}/${rule.tags.length}`, evidence: `原生事件标记 ${found.length}/${rule.tags.length}：${found.join('、') || '尚无'}；不使用 TasksProgress 数组下标猜测。` };
  }
  if (rule.check === 'item') {
    const item = catalog.items?.find(i => i.id === rule.item && i.category === rule.category);
    if (!item) return { satisfied: false, state: 'unknown', mode: 'manual', evidence: '当前物品表无法核对这个物品，保留待核实。' };
    const result = ownedItem(slot, rule.category, rule.item);
    const handedIn = rule.evidenceQuest && requirementResult({ branch: rule.evidenceBranch }, records.get(rule.evidenceQuest)).satisfied;
    const cycle = Number.isInteger(result.record?.AcquiredCycle) ? `，获取记录为第${result.record.AcquiredCycle + 1}周目，可能为继承` : '';
    return { satisfied: result.owned || Boolean(handedIn), state: result.known ? 'missing' : 'unknown', stateLabel: '未记录获得', mode: result.known ? 'auto' : 'manual',
      evidence: handedIn ? '已完成对应珍宝交付分支，证明已取得并交付。' : `${item.name}（${rule.item}）：${result.owned ? '有持有或累计获得记录' : result.known ? '没有获得记录' : '背包字段缺失'}${cycle}。物品记录不代替剧情事件。` };
  }
  const record = records.get(rule.completeQuest || rule.acceptedQuest);
  const satisfied = rule.completeQuest ? questState(record) === 'done' : rule.acceptedQuest ? ['active', 'done'].includes(questState(record)) : false;
  return { satisfied, state: satisfied ? 'done' : 'unknown', mode: satisfied ? 'auto' : 'manual', evidence: satisfied ? '对应任务状态已证明这条路线开启或完成。' : '尚未建立能可靠判定该选择/遭遇的存档映射，需现场核对；不自动推断已错过。' };
}
function bossKilled(slot, id) {
  const cycle = slot.PBZGameSystem?.CycleCount;
  return Object.entries(slot.BossRecord?.[id]?.Records || {}).some(([key, r]) => key.startsWith(`${cycle}_`) && r.KillCount > 0);
}
export function analyzeSlot(slot, catalog, achievements) {
  if (!Array.isArray(slot.Narrative?.NarrativeSavedQuests)) throw new Error('当前存档没有可识别的任务记录，不能判断任务进度。');
  const records = new Map(slot.Narrative.NarrativeSavedQuests.map(q => [questId(q.QuestClass), q]));
  const metadata = new Map(catalog.quests.map(q => [q.id, q]));
  const stage = detectStage(slot);
  const tags = new Set(slot.EventPipeline?.GlobalTags || []);
  const baiXueStep = nextBaiXueStep(slot, records, tags);
  const allIds = new Set([...metadata.keys(), ...records.keys()]);
  const quests = [...allIds].map(id => {
    const info = metadata.get(id), record = records.get(id);
    const status = questState(record), failure = questFailure(id, record, status, tags, slot), state = failure?.state || status;
    const branches = (record?.QuestBranches || []).map(branch => ({ id: branch.BranchID,
      state: branch.BranchType, completed: branchCompleted(record, branch.BranchID),
      active: branch.BranchType === 'EBranchType::BranchActivating', ...info?.branches?.[branch.BranchID] }));
    return { id, name: info?.name || id, type: info?.type || (record?.QuestClass?.includes('/Tutorial/') ? 'Tutorial' : 'Other'),
      state, stateLabel: STATE_LABELS[state], recorded: Boolean(record), branches, failure,
      deadlines: checkpoints.filter(g => g.requirements.some(r => r.quest === id || id === 'YongShengDaoZhu' && r.check === 'bai-xue')).map(g => g.name) };
  }).filter(q => q.type !== 'Tutorial' && q.type !== 'Quest_Branchline');
  const failures = new Map(quests.filter(q => q.failure).map(q => [q.id, q]));
  const has = (id, branch) => requirementResult({ branch }, records.get(id)).satisfied;
  const passed = {
    valley: bossKilled(slot, 'BP_Monster_HookMan_P2'),
    jingye: bossKilled(slot, 'BP_Monster_JingYe'),
    baichilian: bossKilled(slot, 'BP_Monster_ChiLian_P2') || questState(records.get('MainCh1-LinZhongShaJi')) === 'done',
    pangzhen: tags.has('pz.后街.进入'),
    baishan: questState(records.get('BaiShanMiWen')) === 'done' || has('BaiShanMiWen', '3'),
    qingshe: tags.has('quest.任务中断.进入青蛇屋外围'),
    ending: slot.PBZGameSystem?.bIsFinishGame === true,
    luxiaokui: bossKilled(slot, 'BP_Monster_MuXiaoKui') || bossKilled(slot, 'BP_Monster_MuXiaoKui_P2'),
    'mu-rewards': false,
    'lu-well': questState(records.get('MainCh1-ShiXinCun')) === 'done',
    qixing: tags.has('achievment.剑横北斗.完成'),
    chivalry: questState(records.get('BuMieXiaDan')) === 'done',
    mountain: false,
    mirage: stage.rank >= 7,
    opera: false, sanmian: questState(records.get('SanMianHunDun')) === 'done', snow: questState(records.get('GeJueXieZi')) === 'done' && questState(records.get('QuanXin')) === 'done',
    crusher: tags.has('dhy.Seq113.力者入战'), 'crusher-reward': false, treasures: false, cleanup: false
  };
  const gates = checkpoints.map(gate => {
    const items = gate.requirements.map(rule => {
      const result = rule.check === 'bai-xue' ? baiXueCheck(baiXueStep, slot, failures) : evaluateRequirement(rule, slot, catalog, records, achievements);
      const quest = result.quest || rule.quest, record = records.get(quest), info = metadata.get(quest);
      const current = (rule.check === 'bai-xue' ? [] : record?.QuestBranches || []).filter(b => b.BranchType === 'EBranchType::BranchActivating')
        .map(b => info?.branches?.[b.BranchID]?.objective).filter(Boolean);
      const achievementIds = rule.achievements || questAchievements[quest] || [];
      const title = rule.title === '完成紫色任务' ? `完成${info?.name || quest}` : rule.check === 'achievement' ? `核对${achievements?.rows.find(a => a.id === rule.achievement)?.name || rule.achievement}` : result.title || rule.title;
      return { ...rule, ...result, title, questName: info?.name || quest || '', taskState: quest ? questState(record) : null, taskStateLabel: quest ? STATE_LABELS[questState(record)] : null,
        failure: result.satisfied ? null : failures.get(quest)?.failure || null,
        stateLabel: result.mode === 'manual' ? result.stateLabel || '需现场核对' : result.stateLabel || STATE_LABELS[result.state], current,
        source: result.source || rule.source || gate.source, verification: rule.verification || '状态字段已核对；截止尚未实机复现',
        achievements: achievementIds.map(id => ({ id, name: achievements?.rows.find(a => a.id === id)?.name || id, unlocked: achievements?.rows.find(a => a.id === id)?.state === 'done' })),
        evidence: result.evidence || (record ? `任务状态：${record.QuestCompletion}；已完成分支：${(record.CompletedBranches || []).join('、') || '无记录'}` : '所选槽位没有此任务记录；不直接断言未接取或已失败。') };
    });
    const pending = items.filter(i => !i.optional && !i.satisfied && !i.failure).length;
    return stageGate({ ...gate, passed: passed[gate.id], items, pending, manual: items.filter(i => !i.satisfied && !i.failure && i.mode === 'manual').length }, stage);
  });
  const counts = Object.fromEntries(['done', 'active', 'failed', 'interrupted', 'unknown'].map(state => [state, quests.filter(q => (q.recorded || q.failure) && q.state === state).length]));
  const system = slot.PBZGameSystem;
  const candidates = gates.filter(g => g.available && g.currentPending && !g.planning && g.id !== 'ending');
  const location = system.CurrentLevelName || '';
  const recommended = candidates.find(g => !g.passed && g.regions?.some(region => location.toLowerCase().includes(region.toLowerCase())));
  const currentItems = gates.filter(g => g.available && !g.planning).flatMap(g => g.items.filter(i => i.available && !i.satisfied && !i.failure && !i.optional));
  return { gates, quests, questFailures: [...failures.values()], baiXueStep, counts, stage, recorded: quests.filter(q => q.recorded).length,
    currentQuestIds: [...new Set(currentItems.map(i => i.quest).filter(Boolean))],
    currentAchievementIds: [...new Set(currentItems.flatMap(i => i.achievements.map(a => a.id)))],
    coverage: { checkpoints: gates.length, checks: gates.reduce((n, g) => n + g.items.length, 0), manual: gates.reduce((n, g) => n + g.manual, 0), achievements: catalog.achievements?.length || 0,
      currentCheckpoints: gates.filter(g => g.available && !g.planning && g.currentPending).length, currentPending: currentItems.length, currentManual: currentItems.filter(i => i.mode === 'manual').length }, sources: Object.values(sources),
    recommendedGate: recommended?.id || candidates[0]?.id || (gates.find(g => g.id === 'ending' && g.available && g.currentPending)?.id ?? null),
    location: system.CurrentLevelName, bell: catalog.bells[system.LastSaveActorID] || system.LastSaveActorID,
    cycle: Number.isInteger(system.CycleCount) ? system.CycleCount + 1 : null,
    saveTime: system.DateTimeString, playTime: system.HasGameTime,
    trackedQuest: metadata.get(questId(slot.Narrative.TrackedQuestPath))?.name || '' };
}
