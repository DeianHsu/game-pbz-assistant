import { routeAccess } from './collection-access.mjs';
import { accessSources } from './collection-access-data.mjs';
import { chivalryEncounters, cuiCamp, questAchievements } from './risk-data.mjs';
import { analyzeTreasures } from './achievements.mjs';
import { questOffers } from './quest-offers.mjs';

const maps = {
  XiGu: ['悲泣溪谷', 1, 'XiGu'], FuJiZhiLin: ['血色森林', 2, 'FuJiZhiLin'], LuJiaCun: ['陆家村地区', 3, 'LuJiaCun'],
  PangZhen: ['庞镇地区', 4, 'PangZhen'], HouJie: ['庞镇后街', 4, 'PangZhen'], ZhengDaoDaYing: ['正道大营', 4, 'ZhengDaoDaYing'],
  MeiGuHu: ['梅谷湖', 5, 'MeiGuHu'], MeiGu_YiJi: ['梅谷湖·幻术师遗迹', 5, 'MeiGuHu'],
  DengDingShanDao: ['枷笼山', 6, 'DengDingShanDao'], XiMeng: ['戏梦山庄', 7, 'XiMeng'], DuanHunYa: ['断魂山', 8, 'DuanHunShan']
};
const lower = s => String(s || '').toLowerCase();
const definitions = new Map();
export { maps as navigationMaps, definitions as navigationDefinitions };
const guide = 'https://www.gamersky.com/handbook/202610/2236093.shtml';
const target = (map, person, extra = {}) => ({ map, person, ...extra });
function add(quest, branches, map, person, extra = {}) {
  for (const branch of branches.split(' ')) definitions.set(`${quest}:${branch}`, [target(map, person, extra)]);
}

// The destination belongs to this branch, not to the NPC who first gave the quest.
add('MainCh1-NiLiuErShang', '1 2 3 S1 S2 S3', 'XiGu', '溪谷沿途主线触发点');
add('MainCh1-2-GangTieJuTa', '1 2 3', 'XiGu', '钢铁巨塔／追命');
add('MainCh1-LinZhongShaJi', '1 2 3', 'FuJiZhiLin', '密林官道／白赤练后的通路');
add('MainCh1-ShiXinCun', '1 2 3 4 S1', 'LuJiaCun', '水井／人偶试验场／四十四号人偶');
add('MainCh1-ShiXinCun', '5', 'PangZhen', '飞贼密道出口');
add('MainCh2-SiZhen', '1 2 3 4', 'PangZhen', '镇中心／“组织”地下酒馆／后街入口');
add('MainCh2-XinZhiZongJi', '1', 'HouJie', '玉儿父亲·后街家中', { needs: ['changHong'], area: '玉儿家' });
add('MainCh2-XinZhiZongJi', '3 4', 'PangZhen', '雷当·景炀轩');
add('MainCh2-XinZhiZongJi', '6', 'HouJie', '舞狮馆大门', { needs: ['lionKey'] });
add('MainCh2-XinZhiZongJi', '7', 'HouJie', '舞狮尊主·舞狮馆深处', { needs: ['lionKey'] });
add('MainCh2-XinZhiZongJi', 'S2 S5', 'HouJie', '青蛇屋通往戏梦山庄的密道');
add('MainCh2-SiDaSheWu', 'S1', 'HouJie', '舞狮尊主／雷当·取得并修复烈焰狮头');
add('MainCh2-SiDaSheWu', '5 S3', 'HouJie', '青蛇屋的蛇形机关');
add('MainCh2-SiDaSheWu', 'S4', 'MeiGuHu', '白蛇屋大门', { needs: ['loongToken'] });
add('MainCh3-PoJu', '1 2 S1 S2 S3 S4', 'XiMeng', '山庄／戏楼／可轰开的墙壁');
add('MainCh3-PoJu', '3', 'DuanHunYa', '断魂山入口');
add('MainCh3-LongYuZuo', '1', 'DuanHunYa', '断魂崖');
add('XueRouHua', '1', 'XiGu', '新娘阿花战场·血肉花');
add('XueRouHua', 'S2', 'XiGu', '玉儿·驿站');
add('XueRouHua', 'S1', 'FuJiZhiLin', '玉儿·飞贼营地');
add('XueRouHua', '2', 'HouJie', '玉儿父亲·后街家中', { needs: ['changHong', 'fleshLily'] });
add('XiGuShenChu', 'S1 S2', 'XiGu', '溪谷杀气塔／塔底营地外门');
add('HongFangZi', '1 S1 S2', 'XiGu', '红房子内门', { goods: ['K_04902'], needText: '完成梦差幻境并取得人偶舌头，再回来打开红房子。' });
add('XuKongHuanXiang', '1', 'FuJiZhiLin', '森林深处·虚空幻象');
add('SanMianHunDun', 'S1 S4 S7', 'XiGu', '圣母像裂缝·三面魔偶');
add('SanMianHunDun', 'S2 S3', 'XiMeng', '三面魔偶身份与记忆线索（后续调查）');
add('SanMianHunDun', '1 S5 S6', 'FuJiZhiLin', '镜林三面魔偶·最终战', { ice: true });
add('JiGuanChuan', '1', 'MeiGuHu', '火刀与双锏高手·两个杀气核心');
add('JiGuanChuan', '2 S1 S2', 'PangZhen', '船老大·庞镇船坞', { needs: ['flame', 'soulclaimer'], bell: '庞镇船坞', source: 'https://www.gamersky.com/handbook/202611/2239893.shtml' });
add('HuanShuPiPa', 'S1', 'PangZhen', '幻鬼·地下酒馆');
add('HuanShuPiPa', '2', 'PangZhen', '幻鬼·地下酒馆修复琵琶', { goods: ['I_05001', 'I_04001', 'I_08002'], needText: '先集齐琴头、背板和琴弦，再找幻鬼修复。' });
add('HuanShuPiPa', '3', 'MeiGuHu', '通往枷笼山的雾门', { needs: ['pipa'] });
add('HuanShuPiPa', 'S2', 'MeiGuHu', '机关船／湖以北的琴弦线索');
add('KunLunSanJie', '1 2 S1 S2', 'ZhengDaoDaYing', '大营外门／校场／三杰线索');
add('KunLunSanJie', 'S3', 'HouJie', '魏三船·井底钥匙线索', { needs: ['wuXuan', 'wraith'], source: 'https://www.gamersky.com/handbook/202611/2240681.shtml' });
add('KunLunSanJie', '3 4 5 S4', 'DengDingShanDao', '荒行子／山顶宗祠');
add('HuXinMiMi', '1', 'LuJiaCun', '幻术师萤火·记忆花瓣');
add('HuXinMiMi', '2 2-1', 'MeiGuHu', '荡秽·峡谷深处');
add('HuXinMiMi', '3 4 S1', 'MeiGu_YiJi', '护法四像镜／湖心仪式', { needs: ['masks'] });
add('HuXinMiMi', 'S2', 'XiGu', '红房子·水晶人偶眼珠【阳】', { goods: ['K_04902'], needText: '先取得人偶舌头，打开红房子。' });
add('HuXinMiMi', 'S3', 'MeiGuHu', '九十九号人偶·镶入水晶眼珠');
add('QiShengHeLai', '1', 'XiGu', '溪谷沿途·哭声线索');
add('QiShengHeLai', '2', 'FuJiZhiLin', '森林深处·哭声线索');
add('QiShengHeLai', '3 4 S1', 'DengDingShanDao', '宗祠／宗祠地下·弦者');
add('XiLouFeiXu', '1 2', 'MeiGuHu', '湖面记忆之花／烟千岁');
add('DaoJianFoXin', '1', 'HouJie', '废弃铁匠铺·青铜精华');
add('DaoJianFoXin', '2', 'PangZhen', '铃铛·为天玄青铜剑铸魂', { goods: ['TU_11002'], needText: '先从后街废弃铁匠铺取得青铜精华。' });
add('DaoJianFoXin', '3', 'PangZhen', '毕狄道长·“组织”酒馆');
add('GuiTu', '1 2 4', 'LuJiaCun', '老根头·村口藏身处');
add('GuiTu', '3-A 3-B', 'HouJie', '老根头的故屋·黄灯笼房子', { needs: ['flame', 'genKey'], bell: '老根头家' });
add('MoJiaoZhiNv', 'S1 1', 'ZhengDaoDaYing', '红衣女剑客／女弟子·鸽舍', { source: 'https://www.gamersky.com/handbook/202610/2238397.shtml' });
add('WuXiangWang', '1', 'PangZhen', '雨玲·市集酒楼顶层，交付遗书', { needs: ['pipa', 'zhouLetter'], source: accessSources.pang });
add('WuXiangWang', 'S1', 'DengDingShanDao', '周平子·先推桥开笼救人，再取得遗书', { source: accessSources.mountain });
add('RuMengQiZi', '1 2', 'LuJiaCun', '女织／装有女织意识的人偶·三人偶水井旁', { source: 'https://www.gamersky.com/handbook/202610/2236093_16.shtml' });
add('XiongFu', '1', 'XiGu', '四凶斧案卷·悲泣溪谷', { next: '按进度明细查缺。谋士许丰的密信需推进陆家村的「一个不留」后回驿站，进圣母像山洞，用锁链上到洞外平台拾取。', source: 'https://www.gamersky.com/handbook/202610/2236093_4.shtml' });
add('XiongFu', 'S1', 'XiGu', '害怕的弟子·驿站路边房屋', { bell: '驿站', source: 'https://www.gamersky.com/handbook/202610/2236093_4.shtml' });
add('XiongFu', 'S2', 'XiGu', '斧老大彭猛');
add('XiongFu', '2', 'PangZhen', '八卦童子·八卦阁');
add('XiangJianHeJi', '1', 'MeiGuHu', '农户的弟弟·梅谷村东岛船坞');
add('XiaoCui', '1 2 3', 'DengDingShanDao', '陆三迁·小翠的爷爷／山门与囚笼');
add('XiaoCui', '2-ex 4-A 4-B', 'DengDingShanDao', '陆三迁·宗祠附近回访后续对话');
add('XiaoCui', '5', 'DuanHunYa', '小翠父母·最后的正道营地', { bell: cuiCamp.bell, next: cuiCamp.action, source: cuiCamp.source });
add('JiangHuRenShi', '1', 'DengDingShanDao', '江湖人士·牢房／横刀毕峰', { source: accessSources.mountain });
add('QuanXin', '1', 'FuJiZhiLin', '铁拳门主墓碑·遗冢地', { ice: true });
add('ZaiHuiXiongZhang', '1 S1', 'MeiGuHu', '阿瑾·陆家村浅滩船坞', { bell: '陆家村浅滩船坞', source: 'https://www.gamersky.com/handbook/202611/2240668.shtml' });
add('TouPaiHuaDan', '1 2 3', 'PangZhen', '天香阁门童／头牌花旦舞扇');
add('TouPaiHuaDan', '4', 'PangZhen', '头牌花旦人偶·地下酒馆');
add('BaiShanMiWen', '1 2 3 S1', 'ZhengDaoDaYing', '毕桃桃／孟小师妹／玉璧前的肉身');
add('JiuSiFuShang', '1 2', 'FuJiZhiLin', '受伤飞贼／玉儿·飞贼营地');
add('LanJiaGongZi', '1 2', 'LuJiaCun', '兰少狄·村口');
add('LanJiaGongZi', '3 4 5', 'PangZhen', '兰少狄·兰氏大宅');
add('JianXiYiShi', '1 2', 'XiGu', '玉儿·驿站／三味药材');
add('DaoYiYouDao', '1', 'FuJiZhiLin', '梁上君·飞贼营地');
add('DuanZhi', '1 2 3', 'DuanHunYa', '冰窟石壁／无名大师遗骨／双痕剑');
add('XiaoXue', '1', 'ZhengDaoDaYing', '小雪的大侠信物');
add('XiaoXue', '2', 'PangZhen', '八卦童子·八卦阁顶层', { needs: ['towerKey'] });
add('FangKuai', '1 S2', 'PangZhen', '幻鬼／渔夫·地下酒馆');
add('FangKuai', 'S1', 'MeiGuHu', '渔夫的同伴·水行帮船坞／梅谷村东岛船坞', { source: 'https://www.gamersky.com/handbook/202610/2236093_23.shtml' });
add('QingLiMenHu', '1 2', 'XiGu', '恶弓手／老弓手·驿站屋顶');
add('YiGeBuLiu', '2', 'XiGu', '慧觉·驿站');
add('YiGeBuLiu', '2-1', 'LuJiaCun', '苦叶寺同门·幸存者小院');
add('YiGeBuLiu', '3', 'FuJiZhiLin', '飞贼营地');
add('YiGeBuLiu', '3-1', 'LuJiaCun', '受伤的飞贼·飞贼密道入口', { source: 'https://www.gamersky.com/handbook/202610/2236093_12.shtml' });
definitions.set('YiGeBuLiu:1', [target('XiGu', '驿站'), target('FuJiZhiLin', '飞贼营地')]);
add('GeJueXieZi', '1 1-1', 'XiGu', '友善鬼差·溪谷杀气塔顶', { bell: '溪谷杀气塔顶' });
add('GeJueXieZi', '2 2-1 S1', 'MeiGuHu', '友善鬼差·庞镇杀气塔顶', { bell: '庞镇杀气塔顶', source: accessSources.lake });
add('GeJueXieZi', '3 3-1 S2', 'FuJiZhiLin', '友善鬼差／鬼斩客·冰封杀气塔', { ice: true });
add('NanYanZhiYin', '1 2 3 4 5 S1', 'XiGu', '队长／副官·驿站及杀气塔外围');
add('RenOuMuXin', '1 2 3 S1', 'LuJiaCun', '歌女人偶／沛郎·幽蓝萤火之庙');
add('YiBiZhiDao', '1', 'FuJiZhiLin', '玉妖铁鬼·冰封杀气塔顶', { ice: true });
add('DaHuang', '1', 'HouJie', '大黄的尸体·狭窄民居二楼附近院落', { needs: ['backstreet', 'wuXuan'], bell: '狭窄民居二楼', source: 'https://www.gamersky.com/handbook/202610/2236093_17.shtml' });
add('LiuYi', '1 2 3', 'DengDingShanDao', '墨玑子遗物／柳义／染血剑');
add('ShaoZhu', '1', 'LuJiaCun', '沐小葵留下的五条红丝带');
add('QiXingJianZhen', '1', 'ZhengDaoDaYing', '七星弟子遗体·记忆之花');
add('XianYin', '1', 'FuJiZhiLin', '镜林·虚空与弦者记忆');
add('BaiYing', '1', 'MeiGuHu', '幻术师遗迹出口·白影的记忆', { needs: ['masks'] });

function acquired(slot, id, category = 'InventoryInfos', possession = false) {
  const table = slot.Inventory?.[category], cycle = slot.PBZGameSystem?.CycleCount;
  if (!table || !Number.isInteger(cycle)) return null;
  const record = Object.entries(table).find(([key]) => lower(key) === lower(id))?.[1];
  if (!record) return false;
  if (possession) return true;
  return Number.isInteger(record.AcquiredCycle) ? record.AcquiredCycle === cycle : null;
}
const questDone = q => ['EQuestCompletion::QC_Succeded', 'EQuestCompletion::QC_Succeeded'].includes(q?.QuestCompletion);
const treasureMaps = { '1': ['FuJiZhiLin', 'fjzl'], '3': ['LuJiaCun', 'ljc'], '4': ['HouJie', 'pz'], '5': ['MeiGuHu', 'mgxl'], '6': ['XiMeng', 'xsd'] };

function branchTargets(q, branch, slot, collections, catalog, treasures) {
  const tags = new Set(slot.EventPipeline?.GlobalTags || []);
  if (q.id === 'KunLunSanJie' && acquired(slot, 'K_03002') !== true && q.branches.some(b => b.active && b.id === 'S3')) {
    return branch.id === 'S3' ? definitions.get('KunLunSanJie:S3') : [];
  }
  if (q.id === 'KunLunSanJie' && branch.id === 'S3' && acquired(slot, 'K_03002') === true) return [target('ZhengDaoDaYing', '已取得外门钥匙，返回正道大营开门')];
  if (q.id === 'BuMieXiaDan') {
    if (branch.id === 'S1') {
      const met = ['zddy.击杀.剑阵2', 'zddy.剑阵.完成任务'].some(t => tags.has(t));
      return [met ? target('PangZhen', '狼头领·“组织”酒馆，领取破碎的侠胆') : target('ZhengDaoDaYing', '七星剑阵领头人·先完成剑阵再回酒馆', { next: '完成后回庞镇“组织”酒馆找狼头领。' })];
    }
    const points = collections.regions.flatMap(r => r.points);
    return chivalryEncounters.flatMap((encounter, i) => {
      const point = points.find(p => p.id === encounter.id && p.rawMap === encounter.map);
      if (!point || point.state === 'done') return [];
      const goal = tags.has(`pz.不灭侠胆.帮助正道解脱${i + 1}`) ? '已解脱，回访花瓣' : encounter.name;
      return [target(encounter.map, `${goal}·${point.name}`, { point, bell: encounter.bell, next: encounter.route, source: point.guide?.source })];
    });
  }
  if (['RongShuZhiXin', 'XueMaiJueXing', 'LongZhu', 'WuShiZunZhu', 'ZhengYiMengChen'].includes(q.id)) {
    const kind = q.id === 'RongShuZhiXin' ? 'banyan' : ['XueMaiJueXing', 'LongZhu'].includes(q.id) ? 'pillar' : 'flower';
    const pattern = q.id === 'WuShiZunZhu' ? /舞狮尊主/ : /荒行子/;
    return collections.regions.flatMap(r => r.points.filter(p => maps[p.rawMap] && p.kind === kind && p.state !== 'done' && (kind !== 'flower' || pattern.test(`${p.name} ${catalog.items?.find(i => i.category === 'goods' && lower(i.id) === lower(p.id))?.rowName || ''}`)))
      .map(p => target(p.rawMap, `${p.name}·${p.nearest[0]?.name || r.name}`, { point: p })));
  }
  if (q.id === 'HuanShuPiPa' && branch.id === '1') {
    const parts = [['I_05001', 'LuJiaCun', '幻术琵琶琴头'], ['I_04001', 'ZhengDaoDaYing', '幻术琵琶背板'], ['I_08002', 'MeiGuHu', '幻术琵琶琴弦']];
    const missing = parts.filter(([id]) => acquired(slot, id) !== true);
    return missing.length ? missing.map(([, map, name]) => target(map, name)) : [target('PangZhen', '幻鬼·三件已齐，可回酒馆修复')];
  }
  if (q.id === 'RenOuZhongShu') {
    const portals = [
      ['LuJiaCun', 'rozs.人偶中枢.从陆家村梦差密室到达人偶中枢', '陆家村梦差密室·传送门'],
      ['ZhengDaoDaYing', 'rozs.人偶中枢.从绝命坑道梦差密室到达人偶中枢', '绝命坑道／玉璧·传送门'],
      ['DengDingShanDao', 'rozs.人偶中枢.从弦者人偶囚室到达人偶中枢', '弦者人偶囚室·传送门']
    ];
    return portals.filter(([, tag]) => !tags.has(tag)).map(([map, , person]) => target(map, person, { source: 'https://www.gamersky.com/handbook/202611/2240383.shtml' }));
  }
  if (q.id === 'HuXinMiMi' && branch.id === 'S4') return collections.regions.flatMap(r => r.points.filter(p => maps[p.rawMap] && p.kind === 'scarecrow' && p.state !== 'done')
    .map(p => target(p.rawMap, `灭法之法·${p.nearest[0]?.name || r.name}`, { point: p })));
  if (q.id === 'MiaoShouKongKong') {
    const group = treasures.find(g => g.branch.split('-')[0] === branch.id.split('-')[0]);
    if (!group || group.handedIn) return [];
    const map = treasureMaps[group.branch.split('-')[0]][0], missing = group.items.filter(i => !i.owned);
    return [target(map, missing.length ? `待找珍宝：${missing.map(i => i.name).join('、')}` : '妙手小张·珍宝已收齐，待交付', {
      next: missing.length ? `本地区已收集 ${group.items.length - missing.length}/${group.items.length}。${missing.some(i => !i.known) ? '部分物品获取记录不完整，需核对；' : ''}补齐后回本区小张处交付。` : '本地区无需继续寻找珍宝；交付后此地区目标自动收起。',
      evidence: '按本周目各件珍宝获取记录及本地区收集、交付分支分别判断；交付后背包归零不重新列作缺失。'
    })];
  }
  if (q.id === 'JiaoTuSanKu') return treasures.filter(g => (branch.id === '1' ? g.branch === '1-1' : g.branch !== '1-1')
    && !g.handedIn && !tags.has(`${treasureMaps[g.branch.split('-')[0]][1]}.藏身处小张.第一次对话之后`))
    .map(g => target(treasureMaps[g.branch.split('-')[0]][0], '妙手小张分身·本地区藏身处', {
      evidence: '按本地区小张首次对话事件或珍宝交付分支确认是否已见过；已见过的分身不再列作待找目标。'
    }));
  const fixed = definitions.get(`${q.id}:${branch.id}`);
  if (fixed) return fixed;
  // Only an explicit destination in the objective can supply a fallback map.
  const explicit = [['梅谷湖', 'MeiGuHu'], ['庞镇后街', 'HouJie'], ['正道大营', 'ZhengDaoDaYing'], ['枷笼山', 'DengDingShanDao'], ['戏梦山庄', 'XiMeng'], ['血色森林', 'FuJiZhiLin'], ['悲泣溪谷', 'XiGu'], ['陆家村', 'LuJiaCun'], ['庞镇', 'PangZhen'], ['断魂', 'DuanHunYa']]
    .find(([name]) => (branch.objective || '').includes(name));
  return explicit ? [target(explicit[1], branch.objective, { inferred: true })] : [target(null, '目标人物或触发地区尚未定位')];
}

function resolveTarget(t, branch, slot, stage) {
  const definition = maps[t.map], [mapName, rank, mapId] = definition || ['目标地区待定位', Infinity, 'unknown'];
  const visited = stage.regions.some(r => lower(r).includes(lower(t.map || 'unknown')));
  const future = Boolean(definition && stage.rank < rank && !visited);
  let access = { state: 'route', label: '按当前目标推进', reason: '已到该地区阶段；具体门锁未逐一解析，请按当前目标寻找人物或触发点。' };
  if (!definition) access = { state: 'unknown', label: '地点待核实', reason: '活动目标中没有足够的目的地信息，暂不按接任务的位置猜测。' };
  else if (future) access = { state: 'locked', label: '后续地区', reason: `目标在${mapName}，当前尚未推进或到达该区域。` };
  else if (t.point) access = t.point.access;
  const checks = [];
  if (t.map === 'ZhengDaoDaYing' && !visited) checks.push([acquired(slot, 'K_03002'), '先在庞镇后街取得正道大营外门钥匙，再返回大营开门。']);
  if (t.map === 'DengDingShanDao') {
    const repaired = slot.EventPipeline?.GlobalTags?.includes('quest.幻术琵琶.组装好') || slot.Narrative?.NarrativeSavedQuests?.some(q => q.QuestClass.includes('/HuanShuPiPa.') && questDone(q));
    checks.push([repaired === true, '先集齐部件并修复幻术琵琶，才能通过雾门进入枷笼山。']);
  }
  if (t.ice) checks.push([Array.isArray(slot.EventPipeline?.GlobalTags) ? slot.EventPipeline.GlobalTags.includes('fjzl.风雪数据层.激活') : null, '需等血色森林冰封后回访，当前先不跑这个触发点。']);
  for (const id of t.goods || []) checks.push([acquired(slot, id), t.needText]);
  if (t.needs?.length && !future) {
    const gate = routeAccess({ needs: t.needs, action: '前往此人物或触发点继续当前目标。', source: t.source || accessSources.pang }, slot);
    if (gate.state !== 'ready') access = gate;
    else if (!t.point) access = { ...gate, state: 'route', label: '已知前置满足' };
  }
  const missing = checks.filter(([met]) => met === false), unknown = checks.filter(([met]) => met === null);
  if (missing.length) access = { state: 'locked', label: '暂时无法触发', reason: [...new Set(missing.map(([, text]) => text))].join(' ') };
  else if (unknown.length && access.state !== 'locked') access = { state: 'unknown', label: '前置记录待核实', reason: unknown.map(([, text]) => text).join(' ') };
  else if (t.verify && access.state !== 'locked') access = { state: 'unknown', label: '领取待核对', reason: t.evidence };
  return { mapId, mapName: definition ? maps[mapId]?.[0] || mapName : mapName, area: mapName, person: t.person, bell: t.bell || t.point?.nearest[0]?.name || '',
    branchId: branch.id, objective: branch.objective || '', access, future, source: t.source || access.source || guide,
    evidence: t.evidence || (t.inferred ? '地区由存档当前活动目标明示；具体人物位置尚未逐项核实。' : '按原生任务分支、当前物品/事件及已核对地点定位；不以最初接取地代替当前目的地。'), next: t.next || '' };
}

function findOffer(q, slot, analysis, bells) {
  if (q.recorded || q.state !== 'missing' || !Array.isArray(slot.Narrative?.NarrativeSavedQuests)) return;
  const savedTags = slot.EventPipeline?.GlobalTags;
  const tags = Array.isArray(savedTags) ? savedTags : undefined;
  return questOffers[q.id]?.find(offer => {
    const [, rank] = maps[offer.map];
    if (analysis.stage.rank < rank && !analysis.stage.regions.some(region => lower(region).includes(lower(offer.map)))) return false;
    if (!(offer.anchors || [offer.bellId]).some(id => bells.has(id))) return false;
    if (offer.tags?.some(tag => tags?.includes(tag) !== true) || offer.cutoffs?.some(tag => tags?.includes(tag) !== false)) return false;
    if (offer.before?.some(id => !analysis.gates.some(g => g.id === id && g.passed === false))) return false;
    if (offer.snowStep && analysis.baiXueStep?.id !== offer.snowStep) return false;
    if (offer.weapon && acquired(slot, offer.weapon, 'MainWeaponInfos', true) !== true) return false;
    return !offer.needs?.length || routeAccess(offer, slot).state === 'ready';
  });
}

function resolveOffer(offer, catalog, closed = false) {
  const [area, , mapId] = maps[offer.map];
  return { mapId, mapName: maps[mapId]?.[0] || area, area, person: offer.person, place: offer.place, bell: catalog.bells?.[offer.bellId] || '',
    next: closed ? '' : offer.action, warning: closed ? '' : offer.warning || '', source: offer.source,
    access: closed ? { state: 'locked', label: '接取已关闭', reason: offer.closedReason }
      : { state: 'ready', label: '可接取', reason: '已核对接取点附近的到达记录及已知前置。' } };
}

export function analyzeQuestNavigation(slot, catalog, analysis, collections) {
  const treasures = analyzeTreasures(slot, catalog);
  const activated = slot.BellManager?.ActivateBellIDs;
  const bells = new Set(Array.isArray(activated) ? activated : []);
  const tags = slot.EventPipeline?.GlobalTags;
  const quests = analysis.quests.map(q => {
    if (q.catalogNote) return { ...q, actionable: false, canAccept: false, settled: false,
      navigation: { targets: [], risks: [], riskLevel: 'none', achievements: [] } };
    const active = q.branches.filter(b => b.active);
    const settled = q.id === 'MiaoShouKongKong' && q.state === 'active' && treasures.every(group => group.handedIn);
    const branches = q.state === 'done' || settled ? [] : active;
    const failed = q.state === 'failed' || q.state === 'interrupted';
    const step = analysis.baiXueStep, snowChain = Boolean(step) && ['BaiXue', 'YongShengDaoZhu'].includes(q.id);
    const snowTarget = snowChain && step.quest === q.id && Boolean(step.map) && !failed;
    const snowStart = q.state === 'missing' && ['start', 'puppet'].includes(step?.id);
    const offer = findOffer(q, slot, analysis, bells);
    const closed = !q.recorded && q.state === 'missing' && Array.isArray(tags) && questOffers[q.id]?.find(o => o.closedReason && o.cutoffs.some(tag => tags.includes(tag)));
    const targets = offer ? [resolveOffer(offer, catalog)] : closed ? [resolveOffer(closed, catalog, true)] : snowTarget
      ? [resolveTarget({ ...step, next: step.action }, { id: step.branch, objective: step.title }, slot, analysis.stage)]
      : !snowChain || failed ? branches.flatMap(branch => branchTargets(q, branch, slot, collections, catalog, treasures).map(t => resolveTarget(t, branch, slot, analysis.stage))) : [];
    if (!targets.length && (!snowChain || failed) && (q.recorded || failed) && q.state !== 'done' && !['JiaoTuSanKu', 'MiaoShouKongKong'].includes(q.id)) targets.push(resolveTarget(target(null, '任务日志未给出可定位的步骤'), branches[0] || { id: '', objective: '' }, slot, analysis.stage));
    if (failed) for (const t of targets) t.access = { state: 'locked', label: q.state === 'interrupted' ? '任务已中断' : '任务已失败',
      reason: q.failure?.reason || '原生任务日志明确记录失败。' };
    if (q.state === 'unknown') for (const t of targets) t.access = { state: 'unknown', label: '任务状态待核实', reason: '任务状态枚举尚未识别，暂不推断当前能否继续。' };
    const linked = analysis.gates.flatMap(g => g.items.filter(i => !i.satisfied && (i.quest === q.id
      || q.id === 'MiaoShouKongKong' && g.id === 'opera' && active.some(b => ['6', '6-1'].includes(b.id))))
      .filter(() => !g.planning).map(i => ({ gateId: g.id, gateName: g.name, title: i.title, action: i.action, impact: i.impact || '',
        level: g.passed || i.available && i.alert ? 'urgent' : i.available ? 'warning' : 'future', achievements: i.achievements, verification: i.verification, source: i.source })));
    const risks = q.state === 'done' || failed ? [] : linked;
    const achievementIds = new Set([...(questAchievements[q.id] || []), ...linked.flatMap(r => r.achievements.map(a => a.id))]);
    const actionable = snowTarget && !snowStart && analysis.gates.some(g => g.id === 'mountain' && g.available);
    const stateLabel = offer ? '未接取' : closed ? '接取已关闭' : settled ? '五区已交付' : snowTarget && q.state === 'missing' && !snowStart ? '路线可继续' : q.stateLabel;
    return { ...q, actionable, canAccept: Boolean(offer), stateLabel, settled, navigation: { targets, risks, riskLevel: failed || risks.some(r => r.level === 'urgent') ? 'urgent' : offer?.warning || risks.some(r => r.level === 'warning') ? 'warning' : risks.length ? 'future' : 'none',
      achievements: [...achievementIds].map(id => ({ id, name: catalog.achievements?.find(a => a.id === id)?.name || id })) } };
  });
  const current = quests.filter(q => q.recorded && q.state !== 'done' && !q.settled && !q.catalogNote);
  return { quests, taskNavigation: { currentMap: collections.regions.find(m => m.current)?.id || null,
    active: current.length, mapped: current.filter(q => q.navigation.targets.some(t => t.mapId !== 'unknown')).length,
    blocked: current.filter(q => q.navigation.targets.length && q.navigation.targets.every(t => t.access.state === 'locked')).length,
    unknown: current.filter(q => q.navigation.targets.some(t => t.mapId === 'unknown')).length } };
}
