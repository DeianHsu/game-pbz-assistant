// Native point IDs, grouped by the route/door prerequisites checked against the walkthrough.
export const accessSources = {
  pang: 'https://www.powerpyx.com/phantom-blade-zero-pangzhen-collectible-locations/',
  forest: 'https://www.powerpyx.com/phantom-blade-zero-crimson-forest-collectible-locations/',
  lake: 'https://www.powerpyx.com/phantom-blade-zero-meigu-lake-collectible-locations/',
  camp: 'https://www.powerpyx.com/phantom-blade-zero-mandate-encampment-collectible-locations/',
  mountain: 'https://www.powerpyx.com/phantom-blade-zero-mountain-of-imprisonment-collectible-locations/',
  valley: 'https://www.powerpyx.com/phantom-blade-zero-weeping-creek-valley-collectible-locations/',
  lu: 'https://www.powerpyx.com/phantom-blade-zero-village-of-lu-collectible-locations/',
  estate: 'https://www.powerpyx.com/phantom-blade-zero-mirage-estate-pangzhen-collectible-locations/',
  final: 'https://www.powerpyx.com/phantom-blade-zero-mount-soulrend-collectible-locations/'
};
const routes = new Map();
export { routes as pointRoutes };
function add(map, targets, needs, action, source = accessSources.pang, quest = null) {
  for (const target of targets.split(' ')) routes.set(`${map}:${target}`, { needs, action, source, quest });
}

add('PangZhen', 'bell:Bell_SZ_026 bell:Bell_SZ_001 bell:Bell_SZ_002 accessory:AC_ResistFire blackstone:1 amber:3', ['city'], '沿庞镇入口路线查找道路、屋顶及室内收集。');
add('PangZhen', 'phantom:HuoLiuXing', ['city'], '击败庞镇入口的红衣鬼差，领取火流星。');
add('PangZhen', 'bell:Bell_SZ_019 bell:Bell_SZ_003 bell:Bell_SZ_016 bell:Bell_SZ_017 blackstone:2 amber:2 flower:F_06031 flower:F_06032', ['redCaptain'], '可在庞镇中心沿市集、黄家宅邸路口与八卦阁路线探索。');
add('PangZhen', 'weapon:PoJun', ['redCaptain'], '击败鬼差高手斩骑，战后取得破军。');
add('PangZhen', 'bell:Bell_SZ_004 bell:Bell_SZ_015 blackstone:4 amber:1', ['cavalry'], '斩骑之后的酒馆、镇南水塘与屋顶路线，可在本区推进。');
add('PangZhen', 'bell:Bell_SZ_018 bell:Bell_SZ_032 weapon:DualHook', ['flame'], '用烈焰狮头烧开八卦阁一带枯枝，沿正道临时居所前往码头货栈；别离残钩由勾魂战后领取。');
add('PangZhen', 'bell:Bell_SZ_013 amber:4', ['flame', 'soulclaimer'], '勾魂战后可下楼抵达庞镇船坞，再查船坞楼内收集。');
add('PangZhen', 'bell:Bell_XM_015 blackstone:3 flower:F_06036 flower:F_06011', ['flame'], '用烈焰狮头清理北侧枯枝，查山庄正门外围及门前屋顶；不要求先进入山庄内部。');
add('PangZhen', 'flower:F_06003 accessory:AC_DrinkCost', ['huangKey'], '用黄家大宅钥匙进入宅内；收集记忆之花，药罐需找齐四个部件。');
add('PangZhen', 'phantom:LionHead', ['dormantLion'], '取得熄火烈焰狮头后，返回景炀轩找雷当修复。');
add('PangZhen', 'accessory:AC_UltimateBreak', ['pipa', 'zhouLetter'], '持周平子遗书回市集，驱散房屋屏障后到楼顶向雨玲交付。', accessSources.pang, 'WuXiangWang');
add('PangZhen', 'accessory:AC_Combo', ['lanPassage'], '继续兰家大少：在兰宅门口领钥匙，触碰铃铛后回访并进入兰宅。', accessSources.pang, 'LanJiaGongZi');
add('PangZhen', 'accessory:AC_ShachiWeapon', ['cube'], '收齐梅谷湖的榫、卯两块方块，先回渔夫处，再向幻鬼交付。', accessSources.pang, 'FangKuai');
add('PangZhen', 'accessory:AC_AnimMovement', ['danceFan'], '把残破舞扇带回幻鬼酒馆交给头牌花旦。');
add('PangZhen', 'accessory:AC_ShachiRegen', ['xueTokens', 'towerKey'], '在八卦阁顶层向八卦童子交付小雪的三件大侠信物。', 'https://www.gamersky.com/handbook/202610/2235544_39.shtml', 'XiaoXue');

add('HouJie', 'phantom:TanLang', ['backstreet'], '沿后街牌坊推进，挑战堕落将军武轩；战后取得贪狼。');
add('HouJie', 'bell:Bell_SZ_005', ['backstreet'], '从镇南水塘穿过街道进入后街牌坊。');
add('HouJie', 'bell:Bell_SZ_006 bell:Bell_SZ_007 bell:Bell_PZ_XiaoZhang_003 bell:Bell_SZ_031 blackstone:1 blackstone:4 amber:3 amber:4 flower:F_06033 accessory:AC_ResistBleed', ['wuXuan'], '武轩之后可沿后街乘凉处、窄巷民居和戏声水塘的路线探索。');
add('HouJie', 'bell:Bell_SZ_009 flower:F_03043 flower:F_03042 medicine:Medicine_Recover', ['wuXuan', 'wraith'], '骨婉约之后可下井，查井底花瓣；继续井底路线挑战神医谢秋冬，取得不尽水。');
add('HouJie', 'bell:Bell_SZ_010 blackstone:2 amber:2 flower:F_06012 flower:F_06013 flower:F_06034 accessory:AC_ResistThunder medicine:Medicine_ResistanceElement phantom:YouLongTou', ['doctor'], '谢秋冬之后可进入青蛇屋、找学徒对话并探索屋顶和水行帮路线；游龙头来自后续首领战。');
add('HouJie', 'bell:Bell_SZ_011 bell:Bell_SZ_023 flower:F_06002 phantom:ThunderSpear banyan:1', ['youLong'], '庞镇游龙之后可到榕树、舞狮馆大门和祠堂广场，继续挑战长鸿。');
add('HouJie', 'bell:Bell_SZ_025 blackstone:3 amber:1 flower:F_06035', ['lionKey'], '持厚重的狮门钥匙打开舞狮馆，查馆内与深处；钥匙使用后仍按获取记录确认。');
add('HouJie', 'bell:Bell_SZ_021', ['lionDead'], '舞狮尊主战后激活尊主封印地铃铛。');
add('HouJie', 'bell:Bell_SZ_014 bell:Bell_SZ_008 accessory:AC_RangedWeapon flower:F_06001', ['flame'], '从戏声水塘一带烧开枯枝，进入后山凉亭及贫民窟支路。');
add('HouJie', 'bell:Bell_SZ_024', ['flame', 'genKey'], '沿贫民窟支路到老根头家，用黄铜钥匙开门。');
add('HouJie', 'flower:F_06005 medicine:Medicine_Duration', ['flame', 'cellar'], '用后街秘密地窖开关开路，击败地窖后续敌人领取花瓣和慈花甘露。');
add('HouJie', 'flower:F_06042', ['flame', 'heroic'], '取得破碎的侠胆后处理不灭侠胆遭遇，及时帮助尚未变怪的正道高手解脱再调查花瓣。', accessSources.pang, 'BuMieXiaDan');
add('HouJie', 'flower:F_06046', ['wuXuan', 'heroic'], '持破碎的侠胆处理窄巷一带的不灭侠胆遭遇，再调查花瓣。', accessSources.pang, 'BuMieXiaDan');
add('HouJie', 'flower:F_06004 flower:F_06022', ['courtyard', 'necklace'], '用后街小院钥匙进入屋内，向床上的人交付沾血项链，再检查院内后续花瓣。', accessSources.pang, 'BaiXue');
add('HouJie', 'accessory:AC_Bleed', ['courtyard', 'digTree'], '完成白雪儿回访后，调查老槐树下可挖掘处领取雪与血。', accessSources.pang, 'BaiXue');
add('HouJie', 'phantom:HuangJinHuoChong', ['pangTreasures'], '集齐庞镇四件珍宝，返回本区小张藏身处交付并领取黄金火铳。');
add('HouJie', 'accessory:AC_RandomDrink', ['changHong', 'fleshLily'], '长鸿之后进入玉儿父亲所在屋内，继续血肉花的探望与治疗步骤。', accessSources.pang, 'XueRouHua');
add('HouJie', 'accessory:AC_Ignite', ['lionDead', 'pipa'], '从尊主封印地上山，用修复后的幻术琵琶解除屏障，再查树旁宝箱。');
add('HouJie', 'scarecrow:1', ['flame'], '沿老根头家支路下坡到稻草人处，挑战灭法之法雷婷。');

add('MeiGuHu', 'bell:Bell_LYZ_013 bell:Bell_LYZ_014 weapon:BaiYing flower:F_18041 flower:F_18042 flower:F_18026', ['masks'], '收齐四张灭法面具，穿过护法四像镜及幻术师遗迹后进入此段。', accessSources.lake);
add('MeiGuHu', 'weapon:TianShaShuangYue', ['loongToken'], '合成龙形令牌后开启白蛇屋大门，完成首领战。', accessSources.lake);
add('MeiGuHu', 'phantom:NiTouChe flower:F_13020', ['genHome'], '完成归途后，在冰湖船坞与老根头会面。', accessSources.lake, 'GuiTu');
add('MeiGuHu', 'accessory:AC_ShachiCool', ['brotherFlower'], '先取得黄家大宅的记忆花瓣，再处理陆家村浅滩船坞一带的再会兄长后续。', accessSources.lake);
add('MeiGuHu', 'medicine:Medicine_UltimateCharge', ['kinFlower'], '先取得庞镇的相煎何急花瓣，再处理梅谷村东岛的对应花瓣。', accessSources.lake);
add('MeiGuHu', 'medicine:Medicine_ShachiAttack', ['lakeTreasures'], '集齐梅谷湖三件珍宝（包括遗迹内珍宝），回本区小张处交付。', accessSources.lake);
add('XiGu', 'bell:Bell_NLES_010 accessory:AC_Deflect', ['leaveNone'], '陆家村触发一个不留后的回访路线，查圣母像山洞及神机指环。', accessSources.valley);

// These sources confirm the region's ordinary physical pickups occur on its own route.
// This is deliberately not a claim that the player's present door has opened.
export const physicalRouteSources = {
  xigu: accessSources.valley, fujizhilin: accessSources.forest, lujiacun: accessSources.lu,
  zhengdaodaying: accessSources.camp, meiguhu: accessSources.lake, meigu_yiji: accessSources.lake,
  dengdingshandao: accessSources.mountain, ximeng: accessSources.estate, duanhunya: accessSources.final
};

export function pointAccessRoute(point) {
  const route = routes.get(`${point.rawMap}:${point.kind}:${point.id || point.order}`);
  if (!route) return undefined;
  const prerequisites = point.rawMap === 'HouJie' && !['Bell_SZ_005', 'TanLang'].includes(point.id) ? ['backstreet', 'wuXuan'] : [];
  return { ...route, needs: [...new Set([...prerequisites, ...route.needs])] };
}
