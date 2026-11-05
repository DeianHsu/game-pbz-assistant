// Reviewed 2026-11-03. Guide deadlines and native save predicates are separate.
export const sources = {
  trophies: { title: 'PowerPyx 奖杯路线', url: 'https://www.powerpyx.com/phantom-blade-zero-trophy-guide-roadmap/' },
  ending: { title: 'PowerPyx 真结局路线', url: 'https://www.powerpyx.com/phantom-blade-zero-true-ending-guide/' },
  steam: { title: '游民星空 Steam 成就指南', url: 'https://www.gamersky.com/handbook/202610/2237267.shtml' },
  bosses: { title: '游民星空 首领成就与隐藏阶段', url: 'https://www.gamersky.com/handbook/202610/2237267_2.shtml' },
  missables: { title: 'Kungfupunk 玩家断线表', url: 'https://kungfupunk.com/zh-hans/phantom-blade-zero-missable-quests' },
  alternatives: { title: 'AllThingsHow 易错过内容（含陈柱不同说法）', url: 'https://allthings.how/phantom-blade-zero-missables/' },
  qixing: { title: '游民星空 七星剑阵与红衣女剑客', url: 'https://www.gamersky.com/handbook/202610/2238397.shtml' },
  chivalry: { title: '游侠网 不灭侠胆六处花瓣路线', url: 'https://gl.ali213.net/html/2026-11/1821581.html' },
  mountain: { title: 'PowerPyx 枷笼山收集路线', url: 'https://www.powerpyx.com/phantom-blade-zero-mountain-of-imprisonment-collectible-locations/' },
  snow: { title: 'PowerPyx 断魂山收集路线', url: 'https://www.powerpyx.com/phantom-blade-zero-mount-soulrend-collectible-locations/' },
  cui: { title: 'TigerJek 小翠完整路线', url: 'https://tigerjek.com/cuis-questline-walkthrough-in-phantom-blade-zero/' },
  walkthrough: { title: 'KeenGamer 全流程与离场奖励', url: 'https://www.keengamer.com/articles/guides/phantom-blade-zero-complete-walkthrough-all-quests/' },
  treasures: { title: 'PC Gamer 小张珍宝与戏楼关门说明', url: 'https://www.pcgamer.com/games/action/phantom-blade-zero-quickhand-request-treasure-locations-relics/' },
  estate: { title: 'PowerPyx 戏梦山庄收集路线', url: 'https://www.powerpyx.com/phantom-blade-zero-mirage-estate-pangzhen-collectible-locations/' }
};

export const trueEndingQuests = ['XiGuShenChu', 'XuKongHuanXiang', 'JiGuanChuan', 'XiLouFeiXu', 'HuanShuPiPa', 'KunLunSanJie', 'QiShengHeLai', 'RenOuZhongShu', 'HongFangZi', 'HuXinMiMi'];
export const questAchievements = {
  HuXinMiMi: ['ACH_032', 'ACH_013'], XueMaiJueXing: ['ACH_033', 'ACH_013'], BaiShanMiWen: ['ACH_034'],
  GuiTu: ['ACH_035'], LanJiaGongZi: ['ACH_036'], GeJueXieZi: ['ACH_037'],
  JianXiYiShi: ['ACH_038'], JiuSiFuShang: ['ACH_038'], XueRouHua: ['ACH_038'],
  MiaoShouKongKong: ['ACH_039'], JiaoTuSanKu: ['ACH_039'], RongShuZhiXin: ['ACH_040'], ShaoZhu: ['ACH_058']
};
export const treasureGroups = [
  { name: '血色森林', branch: '1-1', ids: ['T_02001', 'T_02002', 'T_02003'] },
  { name: '陆家村', branch: '3-1', ids: ['T_05001', 'T_05002', 'T_05003'] },
  { name: '庞镇', branch: '4-1', ids: ['T_06001', 'T_06002', 'T_06004', 'T_06005'] },
  { name: '梅谷湖', branch: '5-1', ids: ['T_08001', 'T_06003', 'T_08003'] },
  { name: '戏梦山庄', branch: '6-1', ids: ['T_12001', 'T_12002', 'T_12003'] }
];

// The flower IDs and numbered release events are paired in the native encounter assets.
export const chivalryEncounters = [
  { id: 'F_06041', map: 'ZhengDaoDaYing', area: '正道大营', name: '紫衣双剑', bell: '乱葬岗', route: '从铃铛下到河道，沿河往左走到尽头。' },
  { id: 'F_06042', map: 'HouJie', area: '庞镇后街', name: '紫衣双剑', bell: '贫民窟', route: '从铃铛沿前面的小路下坡，在低处找紫衣双剑。' },
  { id: 'F_06043', map: 'ZhengDaoDaYing', area: '正道大营', name: '紫衣刀卫', bell: '大营正门', route: '从正门往上走，再沿木坡下去，在坡下找紫衣刀卫。' },
  { id: 'F_06044', map: 'ZhengDaoDaYing', area: '正道大营', name: '紫衣刀卫', bell: '大营瀑布后方', route: '从铃铛往前，经过左侧房屋，在前方大屋背后的小路找紫衣刀卫。' },
  { id: 'F_06045', map: 'ZhengDaoDaYing', area: '正道大营', name: '白山剑护法', bell: '白山派的覆灭之路', route: '从铃铛沿崖边往前，跑墙过去，在路上找白山剑护法。' },
  { id: 'F_06046', map: 'HouJie', area: '庞镇后街', name: '白山剑护法', bell: '戏声缥缈的水塘', route: '传送到铃铛后转身往湖边走，涉水到对岸坍塌的屋顶。' }
];

export const additionalCheckpoints = [
  { id: 'luxiaokui', name: '乘升降机挑战沐小葵前', regions: ['LuJiaCun'], source: sources.bosses.url,
    note: '五条红丝带影响隐藏追加战。这里检查丝带收集；战后还需实际领取妖锯，持有丝带不代表奖励已入包。',
    requirements: [{ quest: 'ShaoZhu', check: 'tags', tags: [1, 2, 3, 4, 5].map(i => 'ljc.沐小葵.获得丝带' + i), title: '调查全部五条少主红丝带', action: '先补齐陆家村五处绸带，再乘升降机触发首领战。', achievements: ['ACH_058'], nativeSource: 'PBZQuest/Collect/ShaoZhu.uasset' }] },
  { id: 'mu-rewards', name: '沐小葵战后离场前', regions: ['LuJiaCun'], source: sources.walkthrough.url,
    note: '按实际持有记录核对一次性场景的奖励。旧周目继承的武器只证明当前持有，不证明本周目触发了隐藏战。',
    requirements: [
      { check: 'item', category: 'weapon', item: 'YuuBlade', title: '领取隐藏追加战奖励妖锯', action: '收齐丝带并打完追加战后领取妖锯；后续用它完成“延时爆破”。', achievements: ['ACH_058'] },
      { check: 'item', category: 'goods', item: 'TU_02002', title: '领取拳心碎片·核', action: '检查追加战奖励；它与后期拳心碎片·壳关联铁拳套铸魂。', achievements: ['ACH_047'], impact: '铸魂候选材料，计数成就可用其他影之武装替代。' },
      { check: 'item', category: 'weapon', item: 'LuanYing', title: '离场前拾取乱莺剑', action: '检查沐小葵场景码头的宝箱，取得后再离开。', achievements: ['ACH_041'], impact: '武器铸魂候选，缺失不必然阻断成就。' },
      { quest: 'XiaoCui', accepted: true, title: '接取小翠并取得红头绳', action: '在人偶试验场与人偶小翠对话，开启后续陆三迁与父母的路线。', impact: '后续饰品与铸魂材料。' }
    ] },
  { id: 'lu-well', name: '陆家村水井与僧人对话前', regions: ['LuJiaCun'], source: sources.alternatives.url,
    note: '“一个不留”的精确断点有单一攻略报告；先推进再进井属于保守路线。对话奖励单独核对，任务完成不代替奖励入包。',
    requirements: [
      { quest: 'YiGeBuLiu', title: '优先推进一个不留', action: '回访驿站和飞贼营地，处理遗物交付；在离开本段剧情前检查尚未完成的目标。', verification: '单一来源的保守建议' },
      { check: 'item', category: 'accessory', item: 'AC_BreakRecover', title: '核对沉香念珠的对话奖励', action: '幸存者小院僧人对话时留意“不信奉”选项；对话前留手动档，随后核对饰品。', source: sources.missables.url, achievements: ['ACH_046'], impact: '30种饰品成就有其他饰品可替代。' }
    ] },
  { id: 'qixing', name: '红衣女剑客与七星剑阵前', regions: ['Zhengdaodaying'], source: sources.qixing.url,
    note: '不要在单独遭遇时击杀红衣女剑客。先通过锁链脱战，留待大师兄战共同解决，战后分别检查花瓣和饰品。',
    requirements: [
      { check: 'item', category: 'goods', item: 'F_03001', title: '取得双侠花瓣“自己的决定”', action: '保持红衣女剑客存活至大师兄战，战后调查大师兄尸体。当前未持有时，这是战前路线提醒。', achievements: ['ACH_044'], impact: '记忆之花计数有其他完整花可替代。' },
      { check: 'item', category: 'accessory', item: 'AC_LowShachi', title: '取得同心双鱼佩', action: '完成双人战后调查红衣女剑客尸体；单独提前击杀会漏奖励。', achievements: ['ACH_046'], impact: '饰品计数有其他饰品可替代。' },
      { quest: 'MoJiaoZhiNv', check: 'red-route', title: '保留魔教之女的后续路线', action: '在鸽舍附近完成女剑客相关对话，通过锁链脱战，避免提前击杀；七星双人战与战后奖励另行检查。', source: sources.qixing.url }
    ] },
  { id: 'chivalry', name: '遇到挣扎的正道高手时', regions: ['Zhengdaodaying', 'Pangzhen', 'HouJie'], source: sources.alternatives.url,
    note: '按本周目六处解脱事件、花瓣和任务状态自动核对；战斗中的跪地窗口仍需及时操作，保存后再确认结果。',
    requirements: [{ quest: 'BuMieXiaDan', check: 'chivalry', title: '在高手完全异变前处理侠胆', action: '先见过剑阵领头人，再回“组织”酒馆向狼头领取破碎的侠胆；之后在高手挣扎时处理，并调查其记忆花瓣。', achievements: ['ACH_044'], impact: '影响特定花瓣，全花收集与10朵成就不是同一口径。' }] },
  { id: 'mountain', name: '枷笼山救人与关键选择', regions: ['DengDingShanDao', 'JiaLong'], source: sources.missables.url,
    note: '本组含任务前置和有分歧的选项。未知事件不会自动显示绿色，陈柱的选择也不会被工具判定为必须击杀。',
    requirements: [
      { quest: 'XiaoCui', branch: '3', title: '救出陆三迁', action: '先处理山门和囚笼中的老人，再继续山顶路线。', source: sources.cui.url },
      { quest: 'XiaoCui', branch: '4-A', branchOnly: true, title: '给陆三迁无根仙露', action: '在横刀毕峰附近寻找无根仙露，救人后交给老人；仅持有药物不算已交付。', source: sources.cui.url, achievements: ['ACH_046'], impact: '关联粗糙煌心，其他饰品也可满足30种计数。' },
      { check: 'item', category: 'goods', item: 'R_070001', title: '取得陆三迁给家人的绝笔信', action: '推进到老人最后的对话，保留给儿子的书信和红头绳，以便后期与小翠父母会面。', source: sources.cui.url },
      { quest: 'WuXiangWang', check: 'cage', title: '打奎艳艳前先救周平子', action: '先帮助推桥并放出囚笼里的周平子，再挑战疯婆子；战后核对遗书。开笼事件、遗书或遗书交付分支可证明该步骤，早期线索不代替救人。' },
      { quest: 'YongShengDaoZhu', check: 'manual', title: '陈柱选项：先留档并核对白雪儿', action: '两家攻略对放过陈柱会否漏奖励存在分歧。交还名单前手动存档；随后核对项链、钥匙和白雪儿的对话，不按单一攻略强制选杀。', verification: '来源存在分歧', otherSources: [sources.mountain, sources.alternatives], achievements: ['ACH_044', 'ACH_046'] },
      { quest: 'BaiXue', title: '跟进白雪儿的肉身与树下线索', action: '按游戏日志完成后街调查；缺少任务记录时不要直接判定已因选项失败。', verification: '选项截止有分歧，完成状态可读' },
      { quest: 'LiuYi', title: '在柳义存活时完成英雄悲歌', action: '找到墨玑子的遗物，回到柳义处交付并处理拔剑目标，避免拖到人物离场。', source: sources.alternatives.url, achievements: ['ACH_044'], impact: '花瓣收集候选，精确离场触发点待实机核对。' }
    ] },
  { id: 'mirage', name: '通过青蛇屋进入戏梦山庄前', regions: ['Pangzhen', 'HouJie', 'MeiGu'], source: sources.ending.url,
    note: '采用攻略给出的十个紫色任务复核清单。来源对结局判定范围有分歧，这是一条保守完整路线；血脉觉醒单列在终局前检查。',
    requirements: trueEndingQuests.map(quest => ({ quest, title: '完成紫色任务', action: '先跟进本任务的当前目标，再通过山庄入口。', achievements: ['ACH_013', ...(quest === 'HuXinMiMi' ? ['ACH_032'] : [])], verification: '保守结局路线，截止未逐条实测' })) },
  { id: 'opera', name: '第一次进入戏楼时', regions: ['XiMeng'], source: sources.treasures.url,
    note: 'PC Gamer 报告演出后戏楼正门可能锁回。先拿珍宝再触发后续演出；这是报道的场景限制，未在本机复现。',
    requirements: [
      { check: 'item', category: 'goods', item: 'T_12002', title: '取得戏楼的金银香囊', action: '用戏票进入后，先检查入口左侧房间的宝箱。交给小张后物品数量可为0，累计获取记录或交付分支仍可证明已拿到。', achievements: ['ACH_039'], evidenceQuest: 'MiaoShouKongKong', evidenceBranch: '6-1' }
    ] },
  { id: 'sanmian', name: '镜林三面魔偶最终战前', source: sources.missables.url,
    note: '任务文本明确要求“以炽刃击败”。武器持有和击败条件分别检查；已结束任务但缺少对应分支时仍提示核对奖励。',
    requirements: [
      { check: 'item', category: 'weapon', item: 'XieHuo', title: '准备炽刃', action: '按三面混沌当前目标取得炽刃，再开始对应的镜林最终战。', achievements: ['ACH_029', 'ACH_041'] },
      { quest: 'SanMianHunDun', branch: '1', branchOnly: true, title: '用炽刃满足最终战条件', action: '按任务指定武器击败魔偶，并核对对应铸魂材料；普通击败不代替特殊条件。', achievements: ['ACH_041'], impact: '特殊铸魂奖励有遗漏风险；10把铸魂成就仍可用其他武器替代。' }
    ] },
  { id: 'snow', name: '山庄之后回访冰封区域', regions: ['FuJiZhiLin', 'XiMeng'], source: sources.estate.url,
    note: '这是后期回访计划，不能在早期强行完成。覆盖隔绝楔子最后交付、三面路线与两件影之武装的铸魂材料。',
    requirements: [
      { quest: 'GeJueXieZi', branch: '3-1', title: '交付血色森林的最后一块浑源石', action: '冰封路线开放后探索森林杀气塔，拿石头后回塔顶交付。', achievements: ['ACH_037'] },
      { quest: 'SanMianHunDun', title: '完成三面混沌路线', action: '继续寻找三面记忆，按当前目标准备炽刃后再进行对应镜林战斗。', achievements: ['ACH_029'] },
      { quest: 'YiBiZhiDao', title: '完成以彼之道的指定武器切磋', action: '回访森林塔顶，按玉妖与铁鬼的限制使用妖锯、铁拳套切磋并领奖。', achievements: ['ACH_047'], impact: '铸魂候选材料。' },
      { quest: 'QuanXin', title: '完成拳心并领取碎片·壳', action: '塔顶对话后调查遗冢地墓碑，核对拳心碎片·壳。', achievements: ['ACH_047'], impact: '与核配对用于铁拳套铸魂。' }
    ] },
  { id: 'crusher', name: '挑战力者和锯者前', regions: ['DuanHun', 'DengDing', 'HunDuan'], source: sources.snow.url,
    note: '先与最后营地的小翠父母会面并交付信物。部分攻略把整个小翠任务写成战前完成；此处只核对战前会面分支，战后奖励另列。',
    requirements: [{ quest: 'XiaoCui', branch: '5', title: '找到小翠父母并交付信物', action: '在最后的正道营地处理小翠父母的对话，再进入首领战。' }] },
  { id: 'crusher-reward', name: '力者和锯者战后', source: sources.cui.url,
    note: '奖励检查独立于战前会面，避免要求玩家在开打前取得战后材料。',
    requirements: [{ check: 'item', category: 'goods', item: 'TU_11007', title: '领取白山派头带', action: '战后与小翠父亲完成最后对话并检查铸魂材料。', achievements: ['ACH_041'], impact: '武器铸魂候选，计数成就允许其他武器替代。' }] },
  { id: 'treasures', name: '妙手拾遗：五地珍宝交付', planning: true, source: sources.trophies.url,
    note: '收集与交付分开核对。游戏资源中识别到16件珍宝，梅谷湖任务条件为3件；部分攻略写4件，因此以本机任务条件及物品表为准。',
    requirements: treasureGroups.map(group => ({ quest: 'MiaoShouKongKong', branch: group.branch, title: '交付' + group.name + '珍宝', action: '集齐本地区清单后，回对应藏身处找小张交付。', achievements: ['ACH_039'] })) },
  { id: 'cleanup', name: '通关后开启新周目前', planning: true, source: sources.trophies.url,
    note: '已解锁状态按账号记录显示，任务和物品仍按所选槽位核对。计数成就只要求阈值，不要求拿完每一件同类收集品。',
    requirements: ['ACH_028', 'ACH_029', 'ACH_030', 'ACH_032', 'ACH_033', 'ACH_034', 'ACH_035', 'ACH_036', 'ACH_037', 'ACH_038', 'ACH_039', 'ACH_040', 'ACH_041', 'ACH_042', 'ACH_043', 'ACH_044', 'ACH_045', 'ACH_046', 'ACH_047', 'ACH_048', 'ACH_058', 'ACH_062', 'ACH_066']
      .map(achievement => ({ check: 'achievement', achievement, achievements: [achievement], title: '核对成就', action: '查看下方成就面板的条件、进度与相关节点，完成后再开启新周目。' })) }
];

export const checkpointOrder = ['valley', 'jingye', 'baichilian', 'luxiaokui', 'mu-rewards', 'lu-well', 'pangzhen', 'qixing', 'baishan', 'chivalry', 'mountain', 'qingshe', 'mirage', 'opera', 'sanmian', 'snow', 'crusher', 'crusher-reward', 'ending', 'treasures', 'cleanup'];
