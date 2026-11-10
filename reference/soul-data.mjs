// Costs in the release weapon tables, matched to obtainable equipment and inventory rows.
export const soulRecipes = {
  tang: 'TU_17001', ironblade: 'TU_09001', double: 'TU_15002', long: 'TU_15001', guitoublade: 'TU_11006',
  chizhecanjian: 'TU_0701', zhanmablade: 'TU_11003', snakedual: 'TU_1101', renouqingtongjian: 'TU_11002',
  dualhook: 'TU_02001', tianshashuangyue: 'TU_06004', pojun: 'TU_12001', slitheringsword: 'TU_07001',
  baishanshuangjian: 'TU_11007', horizontalblade: 'TU_0901', jadedualchakram: 'TU_12002', yuublade: 'TU_04001',
  jigsaw: 'TU_11005', renouyanyuedao: 'TU_13001', ciguhundun: 'TU_18001', baiying: 'TU_18009',
  fanghuaxieshan: 'TU_18011', zimingjian: 'TU_18008', luanying: 'TU_19002',
  brutalaxe: 'TU_06001', unnamedbow: 'TU_06005', shachihook: 'TU_10001', miaoshoufeidao: 'TU_05003',
  tiegongzhuquantao: 'TU_1302', zhuobidun: 'TU_03001', kuyesizhuchuan: 'TU_19004', caoousixian: 'TU_14001',
  huoliuxing: 'TU_11012', lionhead: 'TU_05004', xukonghuashan: 'TU_19005', jingua: 'TU_01001',
  jiankezhaojiling: 'TU_19006', duyangong: 'TU_19001', youlongcha: 'TU_10002', youlongtou: 'TU_10003',
  huangjinhuochong: 'TU_11011', mojian: 'TU_08001', tanlang: 'TU_03002', xuedizi: 'TU_08002',
  thunderspear: 'TU_04003', tigercannon: 'TU_03003', nitouche: 'TU_06002'
};

export const soulComponents = {
  TU_0701: ['TU_05001', 'TU_07002'],
  TU_0901: ['TU_09002', 'TU_09003', 'TU_09004'],
  TU_1101: ['TU_05005', 'TU_11008', 'TU_11009', 'TU_11010'],
  TU_1302: ['TU_02002', 'TU_13004'],
  TU_15001: ['TU_150011', 'TU_150012'],
  TU_15002: ['TU_150021', 'TU_150022'],
  TU_18009: ['TU_180091', 'TU_180092', 'TU_180093', 'TU_180094']
};
export const soulComponentProducts = Object.fromEntries(Object.entries(soulComponents).flatMap(([material, parts]) => parts.map(part => [part, material])));

export const soulForms = { tang: '黑魔伤', long: '炽刃', double: '绝影', caoousixian: '深渊铃铛', cuixinpipa: '幻术琵琶' };
export const pipaRepair = {
  steps: ['收齐陆家村的琴头、正道大营的背板、梅谷湖烟千岁的琴弦，回庞镇“组织”酒馆找幻鬼修复。'],
  source: 'https://kungfupunk.com/zh-hant/weapons/heartrend-pipa'
};
export const soulSources = {
  weapon: 'https://www.gamersky.com/handbook/202611/2241528.shtml',
  phantom: 'https://www.gamersky.com/handbook/202611/2241528_2.shtml'
};
export const soulGuides = {
  TU_08002: {
    regionId: 'ZhengDaoDaYing', regionName: '正道大营', rank: 3, bell: '大营瀑布后方', needs: ['bloodDropTool'], action: '',
    steps: ['击败枷笼山的荒行子，取得并装备血滴子。回到正道大营，从大营瀑布后方铃铛下到院子，沿路下到荒行子的宅子。',
      '进右侧书房，用血滴子触发神像左下的机关。进密室领取强化电锯。'],
    source: 'https://www.gamersky.com/handbook/202610/2236104_25.shtml'
  },
  TU_11012: {
    regionId: 'MeiGuHu', regionName: '梅谷湖', rank: 5, bell: '梅谷村西岛船坞', needs: [],
    steps: ['从梅谷村西岛船坞乘机关船向西，驶进湖西端岩壁的狭缝。靠岸后拾取洞内地上的黄色光点。'],
    source: 'https://wiki.biligame.com/yingzhiren/%E9%95%BF%E6%98%8E%E7%81%AF%E7%81%AB'
  }
};
