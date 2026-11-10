const names = ['未知阶段', '悲泣溪谷阶段', '血色森林阶段', '陆家村阶段', '庞镇阶段', '梅谷湖阶段', '枷笼山阶段', '戏梦山庄阶段', '断魂山阶段', '通关后'];
const started = q => ['EQuestCompletion::QC_Started', 'EQuestCompletion::QC_Succeded', 'EQuestCompletion::QC_Succeeded'].includes(q?.QuestCompletion);
const done = q => ['EQuestCompletion::QC_Succeded', 'EQuestCompletion::QC_Succeeded'].includes(q?.QuestCompletion);
const completed = (q, id) => q?.CompletedBranches?.includes(id) || q?.QuestBranches?.some(b => b.BranchID === id && b.BranchType === 'EBranchType::BranchCompleted');
const active = (q, id) => q?.QuestBranches?.some(b => b.BranchID === id && b.BranchType === 'EBranchType::BranchActivating');

export function detectStage(slot) {
  const quests = new Map((slot.Narrative?.NarrativeSavedQuests || []).map(q => [q.QuestClass.split('/').at(-1).split('.')[0], q]));
  const tags = new Set(slot.EventPipeline?.GlobalTags || []), cycle = slot.PBZGameSystem?.CycleCount;
  const killed = id => Object.entries(slot.BossRecord?.[id]?.Records || {}).some(([key, r]) => key.startsWith(`${cycle}_`) && r.KillCount > 0);
  const visited = Object.entries(slot.MapSubsystem?.UnLockMaskInfos || {})
    .filter(([, cycles]) => Array.isArray(cycles?.[cycle]) && cycles[cycle].length > 0).map(([region]) => region);
  const location = slot.PBZGameSystem?.CurrentLevelName || '';
  const regions = [...visited, location];
  let rank = 1;
  for (const [id, stage] of [
    ['MainCh1-LinZhongShaJi', 2], ['MainCh1-ShiXinCun', 3], ['MainCh2-SiZhen', 4],
    ['MainCh2-XinZhiZongJi', 4], ['MainCh2-SiDaSheWu', 4], ['MainCh3-LongYuZuo', 8]
  ]) if (started(quests.get(id))) rank = Math.max(rank, stage);
  for (const [pattern, stage] of [[/PangZhen|HouJie/i, 4], [/MeiGu/i, 5], [/DengDing|JiaLong/i, 6], [/XiMeng/i, 7], [/DuanHun|HunDuan/i, 8]]) {
    if (regions.some(region => pattern.test(region))) rank = Math.max(rank, stage);
  }
  const xinZhiZongJi = quests.get('MainCh2-XinZhiZongJi');
  const approachingEstate = started(xinZhiZongJi) && active(xinZhiZongJi, 'S5') === true;
  const estate = quests.get('MainCh3-PoJu');
  const afterEstate = done(estate) || completed(estate, '2') || active(estate, '3');
  if (completed(estate, '1') || active(estate, '2')) rank = Math.max(rank, 7);
  if (afterEstate) rank = Math.max(rank, 7);
  if (slot.PBZGameSystem?.bIsFinishGame === true) rank = 9;
  const lu = quests.get('MainCh1-ShiXinCun');
  const afterMu = killed('BP_Monster_MuXiaoKui') || killed('BP_Monster_MuXiaoKui_P2') || done(lu) || active(lu, '4') || completed(lu, '4');
  const victory = ['dhy.力者战斗.2阶段击杀', 'dhy.Seq116处决力者.播放结束', 'achievment.锯理力争.完成'].find(tag => tags.has(tag));
  const crusherEntry = tags.has('dhy.Seq113.力者入战') ? 'dhy.Seq113.力者入战' : victory || '';
  return { rank, name: names[rank], location, regions, afterMu, afterEstate,
    readyForEstate: started(estate), approachingEstate, crusherEntry, afterCrusher: Boolean(victory), finished: rank === 9 };
}

const minimumStage = {
  valley: 1, jingye: 1, baichilian: 2, luxiaokui: 3, 'mu-rewards': 3, 'lu-well': 3, pangzhen: 3,
  qixing: 4, baishan: 4, chivalry: 4, mountain: 6, qingshe: 6, mirage: 6, opera: 7,
  sanmian: 8, snow: 8, crusher: 8, 'crusher-reward': 8, ending: 8, treasures: 2, cleanup: 9
};
export { minimumStage };
export const treasureStages = { '1-1': 2, '3-1': 3, '4-1': 4, '5-1': 5, '6-1': 7 };

export function isGateAvailable(id, stage) {
  if (id === 'mu-rewards' && !stage.afterMu) return false;
  if (id === 'crusher-reward' && !stage.afterCrusher) return false;
  // Optional exploration can reach the camp before the Pangzhen story chapter.
  if (['qixing', 'baishan', 'chivalry'].includes(id) && /Zhengdaodaying/i.test(stage.location)) return true;
  if (['qingshe', 'mirage'].includes(id) && (stage.approachingEstate || stage.readyForEstate)) return true;
  if (['snow', 'sanmian'].includes(id) && stage.afterEstate) return true;
  return stage.rank >= (minimumStage[id] ?? Infinity);
}

export function stageGate(gate, stage) {
  const available = isGateAvailable(gate.id, stage);
  const items = gate.items.map(item => ({ ...item, available: available && (gate.id !== 'treasures' || stage.rank >= treasureStages[item.branch])
    && (gate.id !== 'crusher-reward' || gate.cuiDelivered) }));
  const current = items.filter(i => i.available && !i.optional && !i.satisfied && !i.failure);
  return { ...gate, available, items, currentPending: current.length, currentManual: current.filter(i => i.mode === 'manual').length };
}
