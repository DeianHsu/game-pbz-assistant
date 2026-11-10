// Native point IDs, grouped by the route/door prerequisites checked against the walkthrough.
import { baiXuePickupSteps, treasureGroups } from './risk-data.mjs';

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
function add(map, targets, needs, action, source = accessSources.pang, quest = null, cutoff = null) {
  for (const target of targets.split(' ')) routes.set(`${map}:${target}`, { needs, action, source, quest, cutoff });
}

// Alternative save records for one requirement. Multiple requirements on a point are cumulative.
export const pointChecks = {};
function check(id, title, ...evidence) {
  pointChecks[id] = { title, evidence };
  return id;
}
const tag = id => ({ kind: 'tag', id });
const tags = (...ids) => ({ kind: 'tags', ids });
const killed = id => ({ kind: 'killed', id });
const item = (id, category = 'goods') => ({ kind: 'item', id, category });
const ownedWeapon = id => ({ ...item(id, 'weapon'), possession: true });
const branch = (id, step) => ({ kind: 'branch', id, step });
const done = id => ({ kind: 'done', id });
const deadline = (event, reason, ...unless) => ({ event, reason, unless });
const regional = (map, source) => (targets, needs, action, quest, cutoff) => add(map, targets, needs, action, source, quest, cutoff);

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
for (const [id, step] of Object.entries(baiXuePickupSteps)) {
  add(step.map, id, step.needs, step.action, step.source, step.quest);
}
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

const lengTuPetals = 'https://allthings.how/phantom-blade-zero-leng-tus-memory-flower/';
const maskSource = 'https://wiki.biligame.com/yingzhiren/%E7%99%BE%E7%9B%B8%E5%82%A9%E9%9D%A2';
const lanternSource = 'https://wiki.biligame.com/yingzhiren/%E6%9C%88%E9%9B%B7%E5%8D%8E%E7%81%AF';
const operaComplete = check('operaComplete', '用戏票进入戏楼，完成皮影戏后抵达灵堂',
  tag('XMSZ.PiYingXi.皮影戏播放完传出'), tag('XMSZ.灵堂.开门'), tag('XMSZ.灵堂.击杀赤影骨刃'));
const yuDing = check('estateYuDing', '在演武场击败偃月刀偶玉鼎',
  tag('pz.击杀.戏票怪物'), item('RenOuYanYueDao', 'weapon'), killed('BP_Monster_FemaleVessel_YuDing'));
const qiuFeng = check('estateQiuFeng', '在灵堂击败赤影骨刃囚锋',
  tag('XMSZ.灵堂.击杀赤影骨刃'), item('AC_EvadePhantom', 'accessory'), killed('BP_Monster_YingMei_RedShadowBoneBlade'));
const studyPassage = check('studyPassage', '调查冷荼书房楼上的挂画，打开通往圣躯府邸的密道',
  tag('XMSZ.冷荼书房.挂画幻像消失'), tag('XMSZ.冷荼书房.挂画消失存档'),
  tag('qsd.Boss战.结束'), branch('MainCh3-PoJu', '2'), done('MainCh3-PoJu'));
const leiDang = check('leiDang', '在圣躯心池推进「破局」，打完雷当战并等剧情结算',
  tag('qsd.Boss战.结束'), tag('qsd.Boss战.玉儿对话'), branch('MainCh3-PoJu', '2'), done('MainCh3-PoJu'));
const estateYuer = check('estateYuer', '雷当战后继续和圣躯心池的玉儿对话，等对话结束',
  tag('qsd.Boss战.玉儿对话'), tag('qsd.Boss战.记忆之花对话'));
const maskFragments = ['喜', '怒', '哀'].map((name, i) =>
  check(`nuoMask${i + 1}`, '取得傩面碎片·' + name, item(`AC_MagicWeapon_${i + 1}`)));
const estateTreasureNames = ['将军铜镜', '金银香囊', '云月金簪'];
const estateTreasures = treasureGroups.find(group => group.branch === '6-1').ids.map((id, i) =>
  check(id, '取得' + estateTreasureNames[i], item(id), branch('MiaoShouKongKong', '6'),
    branch('MiaoShouKongKong', '6-1'), tag('xsd.藏身处小张.收集完奇珍异宝'), done('MiaoShouKongKong')));

function estate(targets, needs, action, source = accessSources.estate) {
  add('XiMeng', targets, needs, action, source);
}
estate('flower:F_07013', [], '从冷荼书房铃铛进屋，右转进入走廊，再进右手小房间，调查底层角落的花瓣。');
estate('flower:F_07041', [], '从山庄后门上台阶穿过门，进入第一处庭院，调查路上的花瓣。');
estate('flower:F_07011', [], '从傩面祭台下台阶回到前一段庭院，检查右手侧屋内的花瓣。');
estate('flower:F_07021', [], '从傩面祭台往山庄后门方向下楼，在两段楼梯之间的路边调查花瓣。');
estate('flower:F_07022', [], '从竹影道往戏梦山庄小张藏身处走，调查这段支路上的花瓣。');
estate('flower:F_07042 flower:F_07012', [], '从演武场的玉鼎战区去将军铜镜所在的大屋。上楼分别检查楼上栏边和跨过屋内连桥后的花瓣。');
estate('flower:F_08041', [yuDing], '从演武场到玉鼎战场，走战场右侧台阶到亭子，拾取三面魔偶第一片记忆。');
estate('flower:F_08042', [operaComplete, qiuFeng], '从灵堂进囚锋的战场，调查屋内祭台，拾取三面魔偶第二片记忆。');
estate('flower:F_07023', [operaComplete], '从灵堂囚锋战场左侧下楼，沿路进入左手房屋，调查入口左侧的花瓣。');
estate('flower:F_07024 flower:F_07043', [operaComplete], '沿柳风亭至冷荼书房的主路，检查路边建筑和塔后庭院的花瓣。');
estate('flower:F_08043', [studyPassage], '从冷荼书房上楼调查挂画，走画后密道，检查转往圣躯府邸的拐角桌。', 'https://www.18183.com/gonglue/202611/g0bp72af.html');
estate('bell:Bell_XM_006 bell:Bell_XM_007', [studyPassage], '从冷荼书房挂画后的密道进入圣躯府邸，再从府邸出门前往圣躯心池。');
estate('phantom:TigerCannon', [studyPassage], '从圣躯府邸往圣躯心池推进「破局」，沿台阶进入战场击败「虎炮」雷当，战后领取。', 'https://wiki.biligame.com/yingzhiren/%E7%A0%B4%E5%B1%80');
estate('flower:FS_12004', [leiDang], '战后从玉儿所在处往圣躯心池铃铛折返，查看燃烧摊位之间的圆形石台，拾取「装载煌心之躯」。', lengTuPetals);
estate('flower:FS_14001', [estateYuer], '雷当战后和玉儿交谈，等剧情结束，调查她原来躺着的位置旁地毯上的花瓣。', lengTuPetals);
estate('weapon:RenOuYanYueDao', [], '在演武场击败十二号·偃月刀偶「玉鼎」，战后取得偃月刀。');
estate('accessory:AC_EvadePhantom', [operaComplete], '完成戏楼流程后从灵堂进入首领房间，击败赤影骨刃囚锋。');
estate('accessory:AC_MagicWeapon', maskFragments, '从傩面祭台铃铛上台阶找老乞丐，把喜、怒、哀三块傩面碎片交给他。', maskSource);
estate('accessory:AC_Electrified', estateTreasures, '传送到戏梦山庄小张藏身处，把将军铜镜、金银香囊、云月金簪交给这里的妙手小张。交过仍未入包时，在这个藏身处检查结算。', lanternSource);
estate('amber:3', [yuDing], '从演武场经过玉鼎战场，往戏票拾取点右侧上楼进院，沿左边的岔路找到尽头宝箱。');
estate('medicine:Medicine_Element', [], '从戏园外场沿树林跨倒木，下到水道后进河边小洞拾取法事药酒。');
estate('accessory:AC_ExecutionSwitchCool', [], '从戏园外场过倒木，下水道进洞。洞里有法事药酒，再爬梯上去开箱取刽子手头巾。');
estate('pillar:1', [operaComplete], '从连廊走外侧崖路，借锁镰两次抓钩到戏梦山庄龙柱，再上台阶与龙柱互动。');

const tripleSource = 'https://www.gamersky.com/handbook/202610/2235539_21.shtml';
const winter = check('forestWinter', '从青蛇屋进入戏梦山庄，等血色森林冰封', tag('fjzl.风雪数据层.激活'));
const firstPuppet = check('firstPuppet', '在悲泣溪谷的圣母像裂缝击败三面魔偶，取得三头小娃娃',
  tag('xg.三头娃娃.挑战成功'), tag('fjzl.三头魔偶.激活'));
const blazingEdge = check('blazingEdge', '在梅谷湖击败庞镇杀气塔底的祝原并完成湖中龙柱，合成炎火之握，将长形黑伤铸魂成炽刃', ownedWeapon('XieHuo'));
const triplePetals = [1, 2, 3].map(i => check(`triplePetal${i}`, `取得戏梦山庄三面魔偶第 ${i} 片记忆之花`,
  item('F_0804' + i), tag('fjzl.三头魔偶.记忆之花' + i)));
add('FuJiZhiLin', 'weapon:CiGuHunDun', [winter, firstPuppet, ...triplePetals, blazingEdge],
  '装备炽刃，从镜林入口走到丝线缠绕的巨树，完成玉琮的追加战并核对刺骨混沌。', tripleSource);
add('MeiGuHu', 'banyan:1', [], '从陆家村浅滩船坞划船向东登岛，激活湖中榕树船坞。上坡互动人面榕树并打完挑战。', accessSources.lake);

const valley = regional('XiGu', accessSources.valley);
const outpostChanged = deadline('quest.一个不留.营地变怪', '驿站与飞贼营地已经异变，原人物的对话奖励已错过。');
const graveHint = check('graveHint', '先找驿站屋内躲在箱子后的人，问出斧老大墓地线索', tag('xg.村庄.石斧护符情报'));
const brokenBow = check('brokenBow', '清理恶弓手营地，取得断弦的羽弓',
  item('I_01006'), tag('xg.老弓手.交还羽弓'));
const herbs = check('outpostHerbs', '凑齐见习医师的三种药材', tag('xg.营地玉儿.收集药材可提交'),
  tag('xg.营地玉儿.收集药材结束'), done('JianXiYiShi'));
const valleyGate = check('valleyGate', '取得杀气塔底营地外门钥匙，从溪谷平原入口开门', item('K_01004'));
const dragonKey = check('valleyDragonKey', '在远眺龙柱处取得锈蚀的龙形钥匙，打开龙柱通道', item('K_01001'));
valley('blackstone:1', [], '从溪谷平原入口上坡到恶弓手营地，清掉分散在营地各处的弓手，领取碎片和断弦的羽弓。');
valley('amber:3', [], '从驿站拆路障上楼，清理屋内及外侧的守卫，检查清敌后的琥珀碎片。');
valley('weapon:GuiTouBlade', [], '从溪谷杀气塔一层绕塔外侧，沿缺口向下到血肉花田，击败新娘阿花。');
valley('weapon:IronBlade', [], '沿红丝线障壁后方的主路到锈刃凉亭，击败痴狂暴徒残钢。');
valley('phantom:ShachiHook', [], '从瀑布吊桥过桥到大瀑布，击败六绝凶镰追命并结算两段战斗。');
valley('phantom:BrutalAxe', [], '沿驿站主路前往斧老大斩落处，击败斧老大彭猛。');
valley('phantom:UnnamedBow', [brokenBow], '回驿站屋顶，把断弦的羽弓交给老弓手修复。', 'QingLiMenHu', outpostChanged);
valley('accessory:AC_ResistNonBreak', [graveHint], '从斧老大关押处沿木栈道去马厩旁，调查坟墓。', null,
  deadline('quest.一个不留.营地变怪', '驿站已异变，原来的墓地情报无法再问。', graveHint));
valley('accessory:AC_Drink', [herbs], '回驿站找玉儿交付见习医师所需药材，领取香薰药盒。', 'JianXiYiShi', outpostChanged);
valley('accessory:AC_Attack', [], '从初见玉儿处过桥，到红丝线障壁前的混战处击败持大刀的敌人。');
valley('bell:Bell_NLES_006', [valleyGate], '从溪谷平原入口用钥匙开门，沿右侧岔路进屋到远眺龙柱处。');
valley('bell:Bell_NLES_009 pillar:1', [valleyGate, dragonKey], '从远眺龙柱处用锈蚀的龙形钥匙开门，过隧道，用巨凶斧开路，沿路抵达悲泣溪谷龙柱。');

const forest = regional('FuJiZhiLin', accessSources.forest);
const ironFever = check('ironFever', '在镜林入口击败拳痴铁狂', tag('fjzl.击杀.拳痴'), item('TieGongZhuQuanTao', 'phantom'));
const zhangFreed = check('zhangFreed', '从挂笼小道的吊笼中救出妙手小张，和他对话',
  tag('fjzl.小张.打开笼子对话后'), tag('fjzl.小张.显示分身'), branch('JiaoTuSanKu', '1'), done('JiaoTuSanKu'));
const forestTreasures = treasureGroups[0].ids.map((id, i) => check(id, '取得' + ['染血印玺', '掌门鼻烟壶', '古弩'][i],
  item(id), tag('fjzl.藏身处小张.收集完奇珍异宝'), branch('MiaoShouKongKong', '1'), branch('MiaoShouKongKong', '1-1'), done('MiaoShouKongKong')));
const foodParts = [1, 2].map(i => check(`foodPart${i}`, '取得食物防腐护符残片·之' + (i === 1 ? '一' : '二'), item('AC_ResistPoison_' + i)));
forest('flower:F_02063', [ironFever], '在镜林入口的拳痴战场内调查第一片花瓣。');
forest('flower:F_02064', [ironFever], '打完拳痴后从战场进后面的洞，调查第二片花瓣。');
forest('flower:F_02001', [], '从血色森林铃铛沿剧情前进，在铃铛附近调查虚空留下的第一片花瓣。');
forest('flower:F_02031', [], '从远眺庞镇之桥沿断桥附近的崖路探索，调查路边花瓣。');
forest('flower:F_02022', [], '从飞贼营地的小张洞穴出去，顺崖边木道进洞，查染血印玺宝箱所在洞穴附近的花瓣。');
forest('flower:F_02023', [], '从湖岸拱桥一带往崖边搜寻，调查有关「龙体」的第三片残存记忆。');
forest('flower:F_02032 flower:F_02033', [], '从亡命徒陷阱往骑马敌人的方向走，查小洞入口及附近坡道上的花瓣。');
forest('flower:F_02041', [], '从人偶思乡之崖沿悬崖山舍一带的支路找第四片「龙体」花瓣。');
forest('flower:F_02011', [], '从镜林深处穿过门进入镜林，检查主路上的白赤练第一片花瓣。');
forest('flower:F_02012', [], '从镜林深处按镜面谜题驱散迷雾，往丝线缠绕的巨树方向走，调查战场前的第二片花瓣。');
const voidPaths = [
  '从镜林入口下坡进东边的山洞，调查岔路口的花瓣。',
  '从遗冢地查看墓碑旁的花瓣。',
  '走进遗冢地后的迷雾森林，沿灯光探索，查看其中一处灯下的花瓣。',
  '从迷雾消散处往北穿过山洞，在另一端洞口调查花瓣。',
  '在镜林深处铃铛附近查找花瓣，与「沉思杂记（镜林游记）」相邻。',
  '从镜林深处进入三面镜子的区域，查看中间路上的花瓣。'
];
voidPaths.forEach((action, i) => add('FuJiZhiLin', 'flower:F_0205' + (i + 1), [], action, 'https://www.gamersky.com/handbook/202610/2236271.shtml'));
forest('weapon:ChiZheCanJian', [], '在远眺庞镇之桥一带沿主路挑战剑痴花千笑，战后取得痴者残剑。');
forest('phantom:TieGongZhuQuanTao', [], '到镜林入口挑战拳痴铁狂，战后取得铁拳套。');
forest('weapon:snakedual accessory:ac_shachi', [], '从丝线缠绕的巨树挑战白赤练，打完两阶段并推进战后剧情。战前收齐六片虚空记忆可触发弦者助战。');
forest('accessory:AC_Tang', [zhangFreed], '救出小张后，从飞贼营地沿崖边小路翻上去进藏身洞，和小张对话。');
forest('phantom:MiaoShouFeiDao', [zhangFreed, ...forestTreasures], '回飞贼营地的小张藏身洞，交齐本区三件珍宝领取妙手飞刀。');
forest('accessory:AC_Stealth', [], '飞贼营地找梁上飞，交飞贼血书并完成「盗亦有道」问答。', 'DaoYiYouDao', outpostChanged);
forest('accessory:AC_BreakDrink', [], '完成救死扶伤的四名伤员救治，再回飞贼营地向玉儿交付。', 'JiuSiFuShang', outpostChanged);
forest('accessory:AC_HeavyAttackShachi', [], '沿白山秘闻进飞贼营地地牢找小菊，对话并处理异变遭遇，检查独孤绝印。');
forest('accessory:AC_ResistPoison', foodParts, '从亡命徒陷阱一带找两片防腐护符残片。第一片在地面岔路洞中，另一片要用坑道开关下洞，过右手的桥拾取。');

const village = regional('LuJiaCun', accessSources.lu);
const riverPuppet = check('riverPuppet', '击败三人偶水井下游的女性人偶', tag('ljc.击杀.河道女性人偶'));
const biHai = check('biHai', '在飞贼密道入口附近击败碧海大师残躯', tag('ljc.击杀.佛教掌门'), item('KuYeSiZhuChuan', 'phantom'));
const biYuan = check('biYuan', '在圣母雕像场击败毕远掌门残躯', tag('ljc.击杀.道教掌门'), item('RenOuQingTongJian', 'weapon'));
const openWell = check('openWell', '在陆家村让碧海、毕远和机关巨怪处的三位大师安息，解除井口丝线',
  tags(...[1, 2, 3].map(i => 'bsmw.掌门本体.已解脱' + i)), branch('MainCh1-ShiXinCun', 'S1'), tag('ljc.水井.进入'));
const firefly = check('firefly', '收齐陆家村六片萤火记忆，打开幽蓝萤火之庙的雾门',
  { kind: 'items', ids: [1, 2, 3, 4, 5, 6].map(i => 'F_0501' + i) }, tag('ljc.击杀.荡秽'));
const ribbons = check('ribbons', '挑战沐小葵前调查五条少主红丝带',
  tags(...[1, 2, 3, 4, 5].map(i => 'ljc.沐小葵.获得丝带' + i)), tag('ljc.沐小葵.满足额外剧情条件'), tag('ljc.沐小葵.玉妖铁鬼死亡'));
const muVictory = check('muVictory', '打完沐小葵，从战后码头离场前拾取', tag('ljc.沐小葵.战斗结束'), tag('ljc.沐小葵.显示乱莺'));
const thiefManual = check('thiefManual', '在血色森林取得飞贼的秘籍', item('I_02002'), tag('quest.一个不留.飞贼秘籍'));
const beads = check('valleyBeads', '在悲泣溪谷取得念珠', item('I_01004'), tag('quest.一个不留.佛珠'));
const luTreasures = check('luTreasures', '取得或交齐陆家村三件流失珍宝',
  { kind: 'items', ids: treasureGroups[1].ids }, branch('MiaoShouKongKong', '3'), branch('MiaoShouKongKong', '3-1'), done('MiaoShouKongKong'));
village('amber:1', [riverPuppet], '清掉下游的女性人偶，返回三人偶水井下方的桥边，和桥下农户交谈。');
village('flower:F_05031', [riverPuppet], '从三人偶水井下河，越过倒木击败女性人偶，再调查战斗点出现的花瓣。');
village('bell:Bell_SXC_01_17 flower:F_05041', [openWell], '从三人偶水井下井，调查落地点附近的飞贼三兄弟花瓣，并激活水井之下铃铛。');
village('flower:F_05051', [biYuan], '在圣母雕像场毕远战场边调查正道大师花瓣。');
village('flower:F_05052', [biHai], '在飞贼密道入口附近的碧海战场查花瓣。');
village('flower:F_05053', [], '从机关巨怪残骸进屋，处理正在攻击怪物的机关，再检查场地里的花瓣。');
village('flower:F_05011', [], '从兰公子藏身处附近过桥，到拙壁战场旁的小路调查萤火第一片花瓣。');
village('flower:F_05012', [], '从三人偶水井下到桥底，沿河道向北到尽头，拾取萤火第二片记忆。');
village('flower:F_05015 flower:F_05016', [], '从幽蓝萤火之庙一带检查庙内、附近房屋和雾门外，拾取对应的萤火花瓣。');
village('flower:F_05013', [], '从大廊桥到陆家村小张藏身处的河沟支路，查看田边建筑里的萤火花瓣。');
village('flower:F_05014', [], '从机关巨怪残骸进屋，上梯开箱，再从地板的缺口跳下，查萤火第四片花瓣。');
village('flower:F_05021', [], '沿圣母雕像场附近的崖边木道和场地周围调查花瓣。');
village('flower:F_03041', [], '从岔路口沿山脊走到正道大营外门，调查门外铃铛旁的花瓣。');
village('flower:F_05032', [], '从飞贼密道入口进入下方河道，沿河找这一片陆家村民的花瓣。');
village('flower:F_05033', [], '从幸存者小院向下走，回头看洞口前的花瓣。');
village('flower:F_05034', [], '从梯田铃铛进右侧房屋，检查桌边的花瓣。');
village('weapon:YuuBlade', [ribbons], '进人偶试验场升降机前找齐红丝带，挑战沐小葵并打完玉妖、铁鬼追加战。', 'ShaoZhu',
  deadline('ljc.沐小葵.战斗结束', '沐小葵战斗已结束，当时未满足五条红丝带的追加战条件。', ribbons));
village('weapon:LuanYing amber:3', [muVictory], '沐小葵战后在离场码头拾取乱莺剑，打开左侧树旁的宝箱，再离场。');
village('weapon:RenOuQingTongJian', [], '沿雕像场前的主路进入场地，挑战毕远掌门残躯，战后取得天玄青铜剑。');
village('phantom:KuYeSiZhuChuan', [], '从飞贼密道入口去附近的开阔场地，击败碧海大师残躯。');
village('phantom:CuiXinPiPa', [openWell], '从三人偶水井下井走到人偶试验场，击败乐师偶玉瓒。');
village('phantom:CaoOuSiXian', [firefly], '从幽蓝萤火之庙穿雾，到残偶弃置坑底，击败荡秽并领取操偶铃铛。');
village('phantom:ZhuoBiDun', [], '从老根头藏身处过桥，击败守门人拙壁。');
village('accessory:AC_BreakRegen', [], '从三人偶水井向上走，进织户屋内，处理女织及大娘亲遭遇后取慈母护符。');
village('accessory:AC_Control', [zhangFreed, luTreasures], '从陆家村小张藏身处找小张，交齐婚烛、白玉双童和揭幕雕像。');
village('accessory:AC_ResistRanged', [thiefManual], '去通向庞镇的密道，在受伤飞贼还活着时把秘籍交给他。', 'YiGeBuLiu');
village('accessory:AC_BreakRecover', [beads], '幸存者小院找僧人，选「不信奉」，再交念珠。', null,
  deadline('ljc.正道高手.死亡', '小院僧人已退场，原来的念珠交付对话无法继续。', 'monkChoice'));
check('monkChoice', '僧人不信奉分支', tag('ljc.正道高手.不信奉'));
village('scarecrow:1', [], '从梯田穿过右侧屋子向下走，到稻草人前互动，挑战灭法之法炎茹。');

const camp = regional('ZhengDaoDaYing', accessSources.camp);
const courtKey = check('courtKey', '击败七星剑阵并取得校场大门钥匙', item('K_03004'), tag('ljc.校场钥匙.启用'));
const swordPuppet = check('swordPuppet', '在校场击败剑偶玉璧',
  tag('bsmw.剑偶.死亡'), tag('bsmw.剑偶.死亡有任务'), tag('bsmw.剑偶.死亡无任务'), killed('BP_Monster_HuaShan_JianOu'));
const sawBiTaotao = check('sawBiTaotao', '完成白山秘闻的毕桃桃肉身调查', tag('zddy.毕桃桃.见到肉身'),
  branch('BaiShanMiWen', '2'), done('BaiShanMiWen'));
const pairedFlowers = check('pairedFlowers', '保留红衣女剑客至七星剑阵，在双人战后等记忆之花出现',
  tag('zddy.剑阵.显示记忆之花'), tag('zddy.七星剑阵记忆之花.0'));
const formation = check('formation', '七星剑阵已触发', tag('zddy.剑阵.出场'), tag('zddy.剑阵.二阶段'), tag('zddy.击杀.剑阵1'),
  tag('zddy.击杀.剑阵2'), tag('zddy.剑阵.完成任务'), tag('achievment.剑横北斗.完成'));
const redCutoff = deadline('zddy.击杀.红衣女剑客', '存档记录红衣女剑客已被击杀，尚未触发七星剑阵，双人战的奖励路线已错过。', formation, pairedFlowers);
camp('flower:F_03001 flower:F_03008 accessory:AC_LowShachi', [pairedFlowers], '回高塔后方出口的剑阵战场，分别调查大师兄和红衣女剑客留下的花瓣。女剑客处同时检查同心双鱼佩。', null, redCutoff);
camp('flower:F_03002 flower:F_03005 flower:F_03006', [], '从栈道入口沿悬崖木栈道上行，检查沿路各级平台和放下梯子的捷径附近。');
camp('flower:F_03003', [], '从箭塔之下往大营正门走，调查沿路栈道的七星弟子花瓣。');
camp('flower:F_03004', [], '从鸽舍沿营内木梯和栈道上行，调查四师兄的花瓣。');
camp('flower:F_03007', [], '从三高塔沿相连木架继续探索，检查塔边七师弟的花瓣。');
camp('flower:F_03031 flower:F_03012 flower:F_03013', [], '从乱葬岗下到墓地及周围坡道，检查荒行子部下与倩倩的花瓣。');
camp('flower:F_03011', [], '从夕阳小径上楼梯并用锁镰抓到右侧崖上，检查人面榕树旁房屋里的花瓣。');
camp('flower:F_04011 flower:F_04012 flower:F_04013', [swordPuppet], '打完校场的剑偶玉璧后，走右侧台阶并查看屋内上层，拾取三处花瓣。');
camp('weapon:SlitheringSword blackstone:2', [], '沿白山派的覆灭之路绕到幽禁之地，击败软剑乌冷霜，结算灵蛇软剑和黑石碎片。');
camp('bell:Bell_YXZR_009 weapon:BaiShanShuangJian', [courtKey], '从通往校场的路下坡，用钥匙开门进入校场，击败剑偶玉璧。战前先处理白山秘闻的肉身调查。');
camp('bell:Bell_YXZR_017', [swordPuppet], '打完剑偶玉璧后从校场走楼下的长廊，到达校场深处。');
camp('accessory:AC_HeavyAttackDamage', [courtKey, sawBiTaotao], '先在白山派的覆灭之路后段调查毕桃桃的肉身，再进校场击败她的人偶玉璧，领取残破容器。', 'BaiShanMiWen',
  deadline('bsmw.剑偶.死亡无任务', '存档记录在白山秘闻条件未满足时击败了剑偶玉璧，错过对应奖励。'));
camp('phantom:JinGua', [], '从大营正门进入大营，击败万钧客，领取长柄金瓜。');
camp('phantom:JianKeZhaoJiLing', [], '沿高塔后方出口和三高塔一带去找七星剑阵领头人，战后领取剑客召集令。');
const idolParts = ['头', '臂', '躯', '腿'].map((name, i) =>
  check(`idolPart${i + 1}`, '取得力士神像碎片·' + name, item(`AC_PowerWeapon_${i + 1}`)));
camp('accessory:AC_PowerWeapon', idolParts, '头在夕阳小径的入口神像旁，臂在栈道眺望台过桥的神龛，躯在通往校场的路下方建筑，腿在乌冷霜战场树旁。四片齐全后合成。');
camp('banyan:1', [], '从夕阳小径上台阶，用锁镰抓上右侧崖壁，到人面榕树处互动并打完挑战。');

const lake = regional('MeiGuHu', accessSources.lake);
const heartpiercer = check('heartpiercer', '打开白蛇屋大门并击败鬼差高手穿心',
  item('TianShaShuangYue', 'weapon'), killed('BP_Monster_GuiChai_Cyan_ShuangYue'));
const brotherFight = check('brotherFight', '在陆家村浅滩船坞一带击败阿瑾', tag('pz.击杀.再会兄长怪物'));
const kinFight = check('kinFight', '在梅谷村东岛击败「相煎何急」对应的怪物', tag('pz.击杀.相煎何急怪物'));
lake('flower:F_13001', ['brotherFlower', brotherFight], '从陆家村浅滩船坞去找阿瑾，战后在码头调查花瓣。');
lake('flower:F_11001', ['kinFlower', kinFight], '从梅谷村东岛船坞去处理「相煎何急」遭遇，清敌后调查花瓣。');
lake('flower:FS_12001', [], '从白蛇屋铃铛进点着蜡烛的大厅，检查供桌上的花瓣。');
lake('flower:FS_12002', [], '从白蛇屋顺山脊小路下坡，过绳桥到竹林边的石桌平台，调查石桌旁的花瓣。');
lake('flower:FS_12003', [heartpiercer], '穿心战后进入放白蛇眼的殿内，绕过桌子，到深处烛台旁调查花瓣。');
lake('flower:F_12011', [], '从梅谷村西岛船坞沿右边台阶上去，进第二栋房屋查「捕鱼」花瓣。');
lake('flower:F_12012 flower:F_12013', [], '从水行帮船坞上岸，沿游龙帮主战区及其周边房屋调查水行帮的两片花瓣。');
lake('flower:F_12014', [], '从梅谷村东岛船坞沿主路上岸，调查白河帮众「捕旱鱼」花瓣。');
const songhousePetals = ['在高楼废墟右前方的水面上。', '在废墟右侧的小岛边，查靠近废墟的那侧角落。',
  '在高楼废墟正前方的水面上。', '靠近高楼，在废墟左前侧的水面上。', '绕到废墟左后方的水面。', '绕到废墟右后方的水面。'];
songhousePetals.forEach((place, i) => add('MeiGuHu', 'flower:F_0801' + (i + 1), [],
  '从庞镇船坞驾船，面向梅谷乐坊倾斜的高楼废墟。' + place, 'https://www.18183.com/gonglue/202611/djirfiv0.html'));
lake('blackstone:3', ['pipa'], '从梅谷乐坊船坞用修复后的幻术琵琶驱散左侧屏障，打开里面的宝箱。');
lake('amber:4', [], '从白蛇屋船坞上岸进右侧放聚宝盆的屋子。出屋后贴左侧外墙绕到房后，打开宝箱。');
lake('phantom:DuYanGong', [], '从独眼之岛船坞上岸，挑战独眼弓客，战后领取独眼弓。');
lake('phantom:YouLongCha', [], '从水行帮船坞进入水行帮地盘，击败游龙帮主，领取游龙叉。');
lake('pillar:1', [], '从湖中榕树船坞乘船沿东侧崖壁走，跟橙色灯笼进洞，靠岸穿过敌群到湖中龙柱船坞。');
lake('scarecrow:1', [], '从梅谷村东岛船坞沿主干道去岛的东面，到大树旁的稻草人处互动，挑战灭法之法蛊鹤。');

const mountain = regional('DengDingShanDao', accessSources.mountain);
const shrineKey = check('shrineKey', '取得通往宗祠的山门钥匙，打开宗祠外山门', item('K_10002'), tag('ddsd.开门.独木桥'));
const ledger = check('chenLedger', '在宗祠外山门下方洞窟取得赎罪名单',
  item('R_070002'), tag('ddsd.获得物品.赎罪名单'), branch('ShuZuiMingDan', '1'), done('ShuZuiMingDan'));
const jadeFace = check('jadeFace', '在圣母娘娘宗祠击败玉面郎君', tag('ddsd.击杀.玉面'), item('JadeDualChakram', 'weapon'));
const guillotine = check('guillotine', '击败荒行子，取得影之武装血滴子', item('XueDiZi', 'phantom'), tag('ddsd.击杀.荒行子2'));
check('bloodDropTool', '取得血滴子以开启荒行子书房的机关', { ...item('XueDiZi', 'phantom'), possession: true });
const inkRelic = check('inkRelic', '在囚笼道找到墨玑子的遗物', tag('ddsd.获得物品.墨机子残剑'),
  branch('LiuYi', '1'), done('LiuYi'));
const luRescued = check('luRescued', '降下囚笼道的吊笼，救出陆三迁并给他无根仙露',
  tag('ddsd.陆三迁2.有喝仙露'), tag('ddsd.陆三迁3.获得书信'), branch('XiaoCui', '4-A'));
mountain('blackstone:1', [shrineKey], '打开宗祠外山门后过桥，沿榕树后的上山路击败敌群，领取黑石碎片。');
mountain('amber:1', [ledger], '从宗祠外山门找陈柱交赎罪名单，选择交战，打完铁面杀手后检查战利品和旁边的女性人偶。');
mountain('amber:2', [], '从宗祠外山门往下走，进入雾门附近的战区，击败守路精英领取碎片。');
mountain('flower:F_70001', [], '从铁杀营地回头爬崖壁，滑墙进屋，落到中层调查花瓣。');
mountain('flower:F_70002', [], '从铁杀营地沿囚笼路线走，查木架和牢笼附近的花瓣。');
mountain('flower:F_70003', [], '从囚笼道沿牢笼外的洞道推进，调查沿路花瓣。');
mountain('flower:F_70004', [], '沿洞道去宗祠外山门，调查铃铛前路上的遗体。');
mountain('flower:F_70005', [], '从奎艳艳战场找脚手架下的木箱，打碎木箱后滑下岩壁，调查落脚处花瓣。');
mountain('flower:F_70006', [shrineKey, jadeFace], '打完玉面郎君，到战场右侧房间调查花瓣。');
mountain('weapon:JadeDualChakram', [shrineKey], '沿宗祠外山门上山，进入圣母娘娘宗祠挑战玉面郎君，战后领取玉双环。');
mountain('weapon:HorizontalBlade', [], '从横刀平台到雾门内，击败横刀毕峰，取得荡寇凶刃。');
mountain('phantom:Mojian', [inkRelic], '在囚笼道用脱落的牢笼拉杆放下装有遗物的笼子，取得染血剑后，回柳义处交付并拔剑。', 'LiuYi',
  deadline('ddsd.柳义.未开笼子死亡', '柳义在获救前已经死亡，英雄悲歌的交付路线已中断。'));
mountain('phantom:XueDiZi', [shrineKey], '从圣母娘娘宗祠走上层主路，打完荒行子两阶段，领取血滴子。');
mountain('phantom:xukonghuashan bell:Bell_DDSD_008', [guillotine], '回荒行子战场，用血滴子打开隐藏通道，顺路跳下到人偶囚室，完成洞内剧情取得虚空华扇。');
mountain('accessory:AC_BigHit', ['flame'], '从铁杀营地沿陆三迁最初关押处一带的岔路走，用烈焰狮头烧开枯枝。下坡打开吊笼，救出宋小武并和他对话。');
mountain('accessory:AC_MartialWeapon', [shrineKey, luRescued], '交完无根仙露后在圣母娘娘宗祠前回访陆三迁，与他对话取得粗糙煌心和信。', 'XiaoCui',
  deadline('ddsd.陆三迁2.死亡', '陆三迁在囚笼道获救前已经死亡，错过宗祠前的奖励。', luRescued));
mountain('banyan:1', [shrineKey], '从宗祠外山门开门过木桥，去前方人面榕树处互动挑战。');

const final = regional('DuanHunYa', accessSources.final);
const lakeSecret = check('lakeSecret', '完成湖心秘密，摧毁湖心仪式', tag('dhy.结局条件.湖心秘密'), done('HuXinMiMi'));
const dragonTrials = check('dragonTrials', '完成血脉觉醒的五处龙柱试炼', tag('dhy.结局条件.血脉觉醒'), done('XueMaiJueXing'),
  tags(...[1, 2, 3, 4, 5].map(i => 'lz.龙柱.龙柱结算' + i)));
final('flower:F_13011', [], '进入断魂山后沿坡上行，在山神庙前查看左侧路边的花瓣。');
final('flower:FS_18002', [], '从山神庙沿主路过木桥，调查银白之路铃铛前的花瓣。');
final('flower:FS_18005 flower:F_13012', [], '从最后的正道营地走木桥，沿寒崖冰窟一段检查冰面和洞边的两处花瓣。');
final('flower:FS_18006', [], '在巨物盘踞处铃铛附近的冰面调查玄礼花瓣。');
final('flower:F_13013', [], '沿巨物盘踞处到力者和锯者战场，检查战区另一侧通向断魂崖的路边。');
final('weapon:Jigsaw', [], '从巨物盘踞处沿主路进入战场，击败力者和锯者，结算断肢锯。小翠支线另影响白山派头带。');
final('weapon:FangHuaXieShan', [], '沿断魂崖推进到大梦倾颓处，击败梦华圣母娘娘并结算武器。');
final('weapon:zimingjian', [lakeSecret, dragonTrials], '走决战结局路线，击败梦华后跟随左殇进入金色光柱，打完后续左殇战，核对紫冥剑。');

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
