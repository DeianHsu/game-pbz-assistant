import { baiXueSteps } from './risk-data.mjs';

const catalogSource = 'https://www.gamersky.com/handbook/202611/2240895_6.shtml';
const routeSource = 'https://www-sky.gamehub.wiki/tools/guide-map/roadbooks/53';
const mapBase = 'https://mygames.wiki/zh/phantom-blade-zero/map';

const regions = new Map();
function addRegion(regionId, regionName, rank, ids) {
  for (const id of ids.split(' ')) regions.set(id, { regionId, regionName, rank });
}

addRegion('Xigu', '悲泣溪谷', 1, 'R_01001 R_01032 R_12004 R_12006 R_12001 R_12003');
addRegion('FuJiZhiLin', '血色森林', 2, 'R_02008 R_07009 R_07010 R_07011');
addRegion('LuJiaCun', '陆家村地区', 3, 'R_07013 R_07014');
addRegion('PangZhen', '庞镇地区', 4, 'R_06001 R_06008 R_06014 R_06015 R_06016 R_06017 R_06018 R_06019 R_06020 R_06021 R_06022 R_06031 R_06032 R_06033 R_06035');
addRegion('MeiGuHu', '梅谷湖', 5, 'R_12017 R_12019 R_07015 R_08001 R_11001 R_11002 R_11003 R_07001 R_07018 R_07019 R_07020 R_07004 R_07005 R_12007 R_12014 R_12015 R_12016 R_12009 R_12010 R_12011 R_12012 R_12013');
addRegion('DengDingShanDao', '枷笼山', 6, 'R_070002 R_070017 R_070001 R_070016 R_070018 R_070012 R_040018 R_040019 R_070011 R_070013 R_070014 R_070003 R_070004 R_070005 R_070006 R_070007 R_070008 R_070009 R_070010');
addRegion('Ximeng', '戏梦山庄', 7, 'R_12005 R_07002 R_07016 R_07017 R_13001 R_14004 R_14006 R_07008 R_07007');
addRegion('DuanHunShan', '断魂山', 8, 'R_14001 R_14005 R_070015');

const guides = new Map([
  ['R_01001', { bell: '开端之地', steps: ['激活开端之地铃铛后继续前进，在神龛旁尸体处拾取。'], source: routeSource }],
  ['R_01032', { steps: ['前往血色森林的瀑布后方洞穴，先沿下层积水走到尽头拾取，再返回上层继续前进。'], source: routeSource }],
  ['R_02008', { bell: '荒废官道', steps: ['从血色森林入口穿过河流上阶梯，沿荒废官道前进时在路边拾取。'], source: routeSource }],
  ['R_06001', { bell: '庞镇船坞', steps: ['在庞镇地下酒馆向幻鬼出示破损的幻术琵琶，接取“机关船”；取得烈焰狮头后沿八卦阁前路口至庞镇船坞推进。该书是任务目标“寻找船老大的制作笔录”，按任务追踪在船老大机关船附近调查。'], source: 'https://www.gamersky.com/handbook/202611/2239893.shtml' }],
  ['R_06008', { bell: '幻鬼酒馆', mapUrl: `${mapBase}/pangzhen?pin=loot-60743527`, steps: ['从幻鬼酒馆铃铛返回组织地下酒馆外，沿其北侧阶梯上行；书页在阶梯旁。'], source: routeSource }],
  ['R_06014', { bell: '八卦阁前路口', steps: ['从八卦阁前路口朝机关船方向走，沿途拾取。'], source: routeSource }],
  ['R_06015', { bell: '八卦阁前路口', steps: ['从八卦阁前路口朝机关船方向走，沿途拾取。'], source: routeSource }],
  ['R_06016', { bell: '正道临时居所', steps: ['沿八卦阁前路口至机关船的路线，激活正道临时居所铃铛后在铃铛旁拾取。'], source: routeSource }],
  ['R_06017', { bell: '后山凉亭', steps: ['从戏声缥缈的水塘向后山凉亭方向走，经屋顶到背后梯子，下梯后拾取。'], source: routeSource }],
  ['R_06018', { bell: '青蛇屋', steps: ['从青蛇屋向北过桥、上阶梯，在旁边的房屋内拾取。'], source: routeSource }],
  ['R_06019', { bell: '青蛇屋', steps: ['从青蛇屋穿过隧道到后方铁匠铺，进入屋内拾取。'], source: routeSource }],
  ['R_06020', { bell: '青蛇屋', steps: ['从青蛇屋穿过隧道到后方铁匠铺，进入屋内拾取。'], source: routeSource }],
  ['R_06021', { bell: '青蛇屋', steps: ['进入青蛇屋，在一楼屋内拾取。'], source: routeSource }],
  ['R_06022', { bell: '青蛇屋', steps: ['进入青蛇屋，在一楼屋内与问诊簿同处拾取。'], source: routeSource }],
  ['R_06031', { bell: '玉儿家', steps: ['从玉儿家回到广场，清理敌人后在广场附近拾取。'], source: routeSource }],
  ['R_06032', { bell: '青蛇屋', steps: ['进入青蛇屋上二楼，在楼上拾取“四大蛇屋”书页。'], source: routeSource }],
  ['R_06033', { minRank: 5, reason: '要先到梅谷湖完成方块支线的两块碎片，再回庞镇地下酒馆找渔夫交付；纸条“娘娘的嘱托”在交付后取得。', steps: ['到梅谷湖找齐暗源方块残片·卯与·榫，返回庞镇地下酒馆交给渔夫。'], source: 'https://www.18183.com/gonglue/202611/5igf3n3u.html' }],
  ['R_06035', { bell: '戏梦山庄正门', steps: ['取得熄火烈焰狮头并推进到戏梦山庄正门；剧情结束后在铃铛旁拾取。'], source: routeSource }],
  ['R_07009', { bell: '赤蛇屋', steps: ['推进庞镇“四大蛇屋”相关剧情，取得开启蛇屋所需的龙形令牌与蛇信后，传送到血色森林的赤蛇屋。进入屋内拾取“幻术要纪”。'], source: routeSource }],
  ['R_07010', { bell: '赤蛇屋', steps: ['推进庞镇“四大蛇屋”相关剧情，取得开启蛇屋所需的龙形令牌与蛇信后，传送到血色森林的赤蛇屋。进入屋内拾取“关外草木图志”。'], source: routeSource }],
  ['R_07011', { bell: '赤蛇屋', steps: ['推进庞镇“四大蛇屋”相关剧情，取得开启蛇屋所需的龙形令牌与蛇信后，传送到血色森林的赤蛇屋。进入屋内拾取“关外门派通考”。'], source: routeSource }],
  ['R_07013', { bell: '黑蛇屋', steps: ['推进庞镇“四大蛇屋”相关剧情，取得开启蛇屋所需的龙形令牌与蛇信后，传送到陆家村的黑蛇屋。进入屋内拾取“记录：七巧玲珑与七巧星”。'], source: routeSource }],
  ['R_07014', { bell: '黑蛇屋', steps: ['推进庞镇“四大蛇屋”相关剧情，取得开启蛇屋所需的龙形令牌与蛇信后，传送到陆家村的黑蛇屋。进入屋内拾取“记录：七巧解药”。'], source: routeSource }],
  ['R_12004', { minRank: 6, bell: '红房子', reason: '所属地区为悲泣溪谷，但该书与红房子后续探索有关。先完成梦差幻境的三处幻门并取得人偶舌头，打开红房子后再查。', steps: ['完成陆家村、正道大营、枷笼山的梦差幻境传送门，取得人偶舌头。', '返回悲泣溪谷的红房子铃铛，开门后在后续探索中查找此书；公开攻略尚未给出它在房内的精确位置。'], source: 'https://www.gamersky.com/handbook/202610/2237253.shtml' }],
  ['R_12006', { minRank: 6, bell: '红房子', reason: '所属地区为悲泣溪谷，但该书与红房子后续探索有关。先完成梦差幻境的三处幻门并取得人偶舌头，打开红房子后再查。', steps: ['完成陆家村、正道大营、枷笼山的梦差幻境传送门，取得人偶舌头。', '返回悲泣溪谷的红房子铃铛，开门后在后续探索中查找此书；公开攻略尚未给出它在房内的精确位置。'], source: 'https://www.gamersky.com/handbook/202610/2237253.shtml' }],
  ['R_12001', { minRank: 6, bell: '红房子', reason: '所属地区为悲泣溪谷，但该书与红房子后续探索有关。先完成梦差幻境的三处幻门并取得人偶舌头，打开红房子后再查。', steps: ['完成陆家村、正道大营、枷笼山的梦差幻境传送门，取得人偶舌头。', '返回悲泣溪谷的红房子铃铛，开门后在后续探索中查找此书；公开攻略尚未给出它在房内的精确位置。'], source: 'https://www.gamersky.com/handbook/202610/2237253.shtml' }],
  ['R_12003', { minRank: 6, bell: '红房子', reason: '所属地区为悲泣溪谷，但该书与红房子后续探索有关。先完成梦差幻境的三处幻门并取得人偶舌头，打开红房子后再查。', steps: ['完成陆家村、正道大营、枷笼山的梦差幻境传送门，取得人偶舌头。', '返回悲泣溪谷的红房子铃铛，开门后在后续探索中查找此书；公开攻略尚未给出它在房内的精确位置。'], source: 'https://www.gamersky.com/handbook/202610/2237253.shtml' }],
  ['R_070002', { bell: baiXueSteps.ledger.bell, steps: [baiXueSteps.ledger.action], source: baiXueSteps.ledger.source }],
  ['R_070017', { bell: '枷笼山', steps: ['到枷笼山先推桥并打开囚笼救出周平子，再沿任务目标取得遗书；之后带回庞镇交给雨玲。'], source: 'https://www.powerpyx.com/phantom-blade-zero-mountain-of-imprisonment-collectible-locations/' }]
]);

export function bookGuide(id) {
  const region = regions.get(id);
  const guide = guides.get(id) || {};
  if (!region && !Object.keys(guide).length) return null;
  return {
    ...region,
    ...guide,
    source: guide.source || catalogSource,
    sourceLabel: guide.steps?.length || guide.mapUrl ? '查看路线或地图点位 ↗' : '查看书籍地区索引 ↗'
  };
}

export function bookDirectory() {
  return Object.fromEntries([...new Set([...regions.keys(), ...guides.keys()])].map(id => [id, bookGuide(id)]));
}
