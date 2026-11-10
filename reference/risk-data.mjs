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
  ledger: { title: '游民星空 枷笼山图文路线（赎罪名单）', url: 'https://www.gamersky.com/tools/guide-map/roadbooks/53' },
  baiXue: { title: '影之刃百科 白雪儿任务流程', url: 'https://wiki.biligame.com/yingzhiren/%E7%99%BD%E9%9B%AA%E5%84%BF' },
  baiXueChoices: { title: 'AllThingsHow 白雪儿与陈柱离开分支', url: 'https://allthings.how/phantom-blade-zero-bai-xue/' },
  snow: { title: 'PowerPyx 断魂山收集路线', url: 'https://www.powerpyx.com/phantom-blade-zero-mount-soulrend-collectible-locations/' },
  cui: { title: 'TigerJek 小翠完整路线', url: 'https://tigerjek.com/cuis-questline-walkthrough-in-phantom-blade-zero/' },
  walkthrough: { title: 'KeenGamer 全流程与离场奖励', url: 'https://www.keengamer.com/articles/guides/phantom-blade-zero-complete-walkthrough-all-quests/' },
  treasures: { title: 'PC Gamer 小张珍宝与戏楼关门说明', url: 'https://www.pcgamer.com/games/action/phantom-blade-zero-quickhand-request-treasure-locations-relics/' },
  estate: { title: 'PowerPyx 戏梦山庄收集路线', url: 'https://www.powerpyx.com/phantom-blade-zero-mirage-estate-pangzhen-collectible-locations/' }
};

const chen = { quest: 'YongShengDaoZhu', map: 'DengDingShanDao', bell: '宗祠外山门', person: '头痛的陈柱', source: sources.ledger.url };
const puppet = { quest: 'BaiXue', map: chen.map, bell: chen.bell, person: '陈柱身旁坐着的女性人偶', source: sources.baiXue.url };
const courtyard = { quest: 'BaiXue', map: 'HouJie', bell: '青蛇屋', source: sources.baiXue.url };
export const baiXueCourtyardPath = '从青蛇屋铃铛过石板桥，右转上坡，沿路左侧到小院。用小院钥匙开门，上梯经屋顶进卧房。';
export const baiXueSteps = {
  start: { ...chen, branch: '1', title: '找陈柱接取赎罪名单', action: '从宗祠外山门铃铛往东过桥，找头痛的陈柱。多与他对话几次，直到接到找名单的目标。', evidence: '尚无赎罪名单的接取或拾取记录。' },
  ledger: { ...chen, branch: '1', person: '疯婆子战场下方洞窟的悬崖岔道', title: '到洞窟拾取赎罪名单', action: '从宗祠外山门右侧下楼，经过疯婆子奎艳艳的战场，沿木箱后方下到洞窟。到岔路时往右侧洞口走，在悬崖边拾取江湖异闻线索「赎罪名单」。', evidence: '已接取赎罪名单，尚无本周目拾取记录。' },
  deliver: { ...chen, branch: '2', title: '回陈柱处交赎罪名单', action: '从宗祠外山门铃铛往东过桥找陈柱，继续对话到能交名单。「这样并不能洗去你的罪孽」会触发铁面杀手战，战后找女性人偶。「算了，放他一条生路」会走离开分支，等结算后核对小院钥匙和沾血的项链。', evidence: '已记录名单拾取或找回分支。本机游戏资源给离开分支也配置了钥匙和项链。', otherSource: sources.baiXueChoices.url },
  fight: { ...chen, branch: '2', person: '铁面杀手·陈柱', title: '击败铁面杀手', action: '继续陈柱的战斗分支。战后和旁边坐着的女性人偶对话，确认拿到庞镇后街小院钥匙和沾血的项链。', evidence: '已选择与陈柱交战，尚无该战斗的击败事件。' },
  puppet: { ...puppet, branch: '1', title: '与女性人偶对话，接白雪儿', action: '回到陈柱原先坐着的位置，跟他旁边坐着的女性人偶对话。领取沾血的项链，并核对是否已取得庞镇后街小院钥匙。', evidence: '存档已到陈柱结算或女性人偶的任务步骤。' },
  spared: { ...puppet, branch: '1', person: '陈柱离开后的对话结算', title: '核对陈柱离开后的钥匙和项链', action: '核对陈柱离开后的对话与奖励，等结算完毕再重新读取存档。拿到庞镇后街小院钥匙和沾血的项链后，可直接按青蛇屋路线前往小院。', evidence: '已记录陈柱离开。钥匙和项链的本周目获取记录尚未齐全。', source: sources.baiXueChoices.url, verify: true },
  home: { ...courtyard, branch: '2', person: '后街小院卧房·床上的白雪儿', title: '到后街小院给白雪儿戴项链', action: baiXueCourtyardPath + '与床上的白雪儿互动，交付沾血的项链。', needs: ['courtyard', 'necklace'], evidence: '本周目小院钥匙和沾血的项链已有获取记录。' },
  petal1: { ...courtyard, branch: '3', person: '后街小院卧房·床边', title: '拾取花瓣「其一：儿时的老树」', action: baiXueCourtyardPath + '给白雪儿戴上项链后，拾取卧房里床边的第一片花瓣。', needs: ['courtyard', 'baiXueNecklaceGiven'], evidence: '已有交付项链或卧房分支完成的记录。' },
  petal2: { ...courtyard, branch: '3', person: '后街小院·院内水井附近', title: '拾取花瓣「其二：用心悔过」', action: baiXueCourtyardPath + '拿到白雪儿的第一片花瓣并关闭拾取提示后，从卧房另一侧出去，下到水井附近的院子，拾取第二片。', needs: ['courtyard', 'baiXueSecondPetal'], evidence: '已记录第一片花瓣或第二片花瓣的解锁事件。' },
  tree: { ...courtyard, branch: '3', person: '后街小院·水井旁的老槐树', title: '调查老槐树下，领取「雪与血」', action: baiXueCourtyardPath + '穿过白雪儿的卧房下到院子，拿完第二片花瓣并关掉拾取提示，再调查水井旁大树下的交互点。', needs: ['courtyard', 'digTree'], evidence: '已记录第二片花瓣或老槐树可挖掘事件。' }
};
export const baiXuePickupSteps = { 'flower:F_06004': baiXueSteps.petal1, 'flower:F_06022': baiXueSteps.petal2, 'accessory:AC_Bleed': baiXueSteps.tree };

export const trueEndingQuests = ['XiGuShenChu', 'XuKongHuanXiang', 'JiGuanChuan', 'XiLouFeiXu', 'HuanShuPiPa', 'KunLunSanJie', 'QiShengHeLai', 'RenOuZhongShu', 'HongFangZi', 'HuXinMiMi'];
export const questAchievements = {
  HuXinMiMi: ['ACH_032', 'ACH_013'], XueMaiJueXing: ['ACH_033', 'ACH_013'], BaiShanMiWen: ['ACH_034'],
  GuiTu: ['ACH_035'], LanJiaGongZi: ['ACH_036'], GeJueXieZi: ['ACH_037'],
  JianXiYiShi: ['ACH_038'], JiuSiFuShang: ['ACH_038'], XueRouHua: ['ACH_038'],
  MiaoShouKongKong: ['ACH_039'], JiaoTuSanKu: ['ACH_039'], RongShuZhiXin: ['ACH_040'], ShaoZhu: ['ACH_058']
};

// Explicit events from the native quest and NPC graphs. Shared cutoffs apply to recorded tasks only.
export const unknownQuestFailure = '游戏日志已标记任务失败，存档未记录具体原因。';
export const cuiCamp = {
  branch: '5', branchOnly: true,
  bell: '最后的正道营地',
  action: '先在最后的正道营地找陆解元，交还小翠的红头绳和陆三迁的信，同意安葬家人并完成墓前对话。之后再打力者和锯者。',
  alert: '小翠战前截止 · 先在最后的正道营地交信和红头绳，完成安葬，再打力者和锯者。',
  deliveredTag: 'xsd.陆解元.可干力者',
  missed: '已进入力者和锯者的首领战，战前未完成小翠父母的会面，陆解元的战后奖励路线已中断。',
  recovery: '回到首领战开始前的存档，在最后的正道营地向陆解元交付信物并安葬家人。',
  source: 'https://pbz-wiki.org/zh/guides/cui-quest/'
};
export const questFailureRules = {
  XiaoCui: {
    tag: 'ddsd.陆三迁2.死亡', unlessBranches: ['3'],
    unlessTags: ['ddsd.陆三迁2.完成任务'],
    reason: '陆三迁未获救，已在囚笼道的吊笼中死亡。',
    context: { 'ddsd.开门.独木桥': '此档已开启通往宗祠的独木桥。', 'ddsd.击杀.荒行子2': '此档也已击败荒行子。' },
    action: '回到陆三迁还活着的存档，在囚笼道降下吊笼、救出陆三迁并交给他无根仙露，再沿独木桥上山。',
    source: sources.cui.url
  },
  WuXiangWang: {
    tag: 'ddsd.周平子.死亡', reason: '周平子在获救前死亡，遗书交付路线已中断。',
    action: '回到周平子还活着的存档，先帮忙推桥，再打开牢笼救人。', source: sources.missables.url
  },
  LiuYi: {
    tag: 'ddsd.柳义.未开笼子死亡', unlessTags: ['ddsd.柳义.完成任务'],
    reason: '柳义在获救前死亡，无法继续他的交付和拔剑步骤。'
  },
  BuMieXiaDan: {
    tag: 'pz.不灭侠胆.任务失败', state: 'failed',
    reason: '有正道高手错过了解脱时机。存档记录了任务失败，未指明是哪一处。', source: sources.missables.url
  },
  QiShengHeLai: {
    tag: 'quest.任务中断.进入青蛇屋外围', unlessBranches: ['3', '4'],
    reason: '进入青蛇屋外围时，宗祠和宗祠地下的任务步骤还没有全部完成。', source: sources.missables.url
  },
  XueRouHua: {
    tag: 'quest.任务中断.抵达陆家村', unlessBranches: ['1'],
    reason: '抵达陆家村前，尚未完成血肉花的第一个目标。', source: sources.missables.url
  },
  ...Object.fromEntries(['JiuSiFuShang', 'DaoYiYouDao', 'QingLiMenHu', 'NanYanZhiYin'].map(id => [id, {
    tag: 'quest.一个不留.营地变怪', reason: '任务未完成时，驿站与飞贼营地已触发变异，相关人物的原有任务路线已中断。',
    source: sources.missables.url
  }]))
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
    note: '核对枷笼山救人、陈柱的选项和白雪儿回访。白雪儿路线按所选槽位的任务、事件和本周目道具更新。',
    requirements: [
      { quest: 'XiaoCui', branch: '3', title: '上宗祠前救出陆三迁', action: '走通往宗祠的独木桥之前，先在囚笼道用脱落的牢笼拉杆降下吊笼，救出陆三迁并交给他无根仙露。', source: sources.cui.url },
      { quest: 'XiaoCui', branch: '4-A', branchOnly: true, title: '交无根仙露并在宗祠回访陆三迁', action: '在横刀毕峰附近取得无根仙露，救人后交给陆三迁，随后到圣母娘娘宗祠的铃铛旁找他。', source: sources.cui.url, achievements: ['ACH_046'], impact: '关联粗糙煌心，其他饰品也可满足30种计数。' },
      { quest: 'XiaoCui', check: 'item', category: 'goods', item: 'R_070001', title: '取得陆三迁给家人的绝笔信', action: '推进到老人最后的对话，保留给儿子的书信和红头绳，以便后期与小翠父母会面。', source: sources.cui.url },
      { quest: 'WuXiangWang', check: 'cage', title: '打奎艳艳前先救周平子', action: '先帮助推桥并放出囚笼里的周平子，再挑战疯婆子；战后核对遗书。开笼事件、遗书或遗书交付分支可证明该步骤，早期线索不代替救人。' },
      { quest: 'BaiXue', check: 'bai-xue', title: '赎罪名单与白雪儿', source: sources.baiXue.url, achievements: ['ACH_044', 'ACH_046'], impact: '两片花瓣可合成白雪儿的记忆之花，树下还可领取饰品雪与血。' },
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
  { id: 'crusher', name: '挑战力者和锯者前', regions: ['DuanHun', 'DengDing', 'HunDuan'], source: cuiCamp.source,
    note: '一旦进入首领战，小翠的战前会面就会关闭。战后再与陆解元对话领取白山派头带。',
    requirements: [{ quest: 'XiaoCui', branch: cuiCamp.branch, check: 'cui-camp', title: '小翠 · 交付信物并安葬前，先别打力者和锯者',
      bell: cuiCamp.bell, action: cuiCamp.action, alert: cuiCamp.alert,
      verification: '按小翠的战前分支、陆解元的营地事件和首领战入战事件核对。' }] },
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
