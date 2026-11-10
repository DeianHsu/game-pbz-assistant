// Each target needs one matching piece of evidence in the selected slot.
// Boss group events use the same keys as DT_Achievement. A rematch or an earlier encounter does not count.
import { chivalryEncounters } from './risk-data.mjs';

const tag = id => ({ kind: 'tag', id });
const killed = id => ({ kind: 'killed', id });
const branch = (id, step) => ({ kind: 'branch', id, step });
const done = id => ({ kind: 'done', id });
const item = (id, category = 'goods', possession = false) => ({ kind: 'item', id, category, possession });
const target = (name, ...evidence) => ({ name, evidence });
const collect = (id, ...evidence) => ({ item: id, evidence: [item(id), ...evidence] });
const equipment = (name, id, category) => target(name, item(id, category, true));
const collectAll = (...ids) => ids.map(id => collect(id));
const numbered = (name, prefix, count) => Array.from({ length: count }, (_, i) => target(name + (i + 1), tag(prefix + (i + 1))));
const petals = (prefix, tagPrefix, count = 6) =>
  Array.from({ length: count }, (_, i) => collect(prefix + (i + 1), tag(tagPrefix + (i + 1))));

const masks = [
  collect('K_05003', tag('mfzf.面具.炎茹')),
  collect('K_12001', tag('mfzf.面具.雷婷')),
  collect('K_08001', tag('mfzf.面具.蛊鹤')),
  collect('K_16001', tag('mfzf.面具.岁寒'))
];
const dragonTrials = ['悲泣溪谷龙柱', '镜林龙柱', '戏梦山庄龙柱', '梅谷湖湖中龙柱', '幻术师遗迹龙柱']
  .map((name, i) => target(name, tag('lz.龙柱.龙柱结算' + (i + 1))));
const banyanTrials = ['血色森林榕树', '正道大营榕树', '庞镇后街榕树', '梅谷湖榕树', '枷笼山榕树']
  .map((name, i) => target(name, tag('rszx.榕树之心.完成挑战' + (i + 1))));
const youLong = [
  target('庞镇游龙二帮主', tag('pz.击杀.游龙二帮主'), killed('BP_Monster_YouLong_SecondBrother')),
  target('梅谷湖水行帮主游龙', tag('pz.击杀.游龙帮主'))
];
const pengMeng = target('斧老大彭猛', tag('achievment.巨斧余恨.完成'), tag('xg.击杀.斧老大'));
const leiDang = target('虎炮雷当', tag('achievment.皆归尘土.完成'));
const huangXing = target('荒行子', tag('achievment.血滴歧路.完成'), tag('ddsd.击杀.荒行子2'));
const biFeng = target('横刀毕峰', tag('ddsd.击杀.横刀客'));
const yanQiansui = target('琴女烟千岁', tag('mgxl.击杀.烟千岁'));
const yuCong = target('玉琮', tag('fjzl.三头魔偶.击杀成就计数'));
const ribbons = numbered('少主丝带', 'ljc.沐小葵.获得丝带', 5);

export const questObjectives = {
  'MainCh1-ShiXinCun': [
    target('让碧海大师安息', tag('bsmw.掌门本体.已解脱1')),
    target('让毕远掌门安息', tag('bsmw.掌门本体.已解脱2')),
    target('让神机掌门安息', tag('bsmw.掌门本体.已解脱3')),
    collect('K_05002')
  ],
  'MainCh2-SiDaSheWu': [
    collect('K_14003', tag('xssl.雕像.蛇眼')),
    collect('K_14004', tag('xssl.雕像.蛇信')),
    collect('K_14005', tag('xssl.雕像.蛇牙'))
  ],
  'MainCh3-PoJu': [collect('K_07001', tag('XMSZ.演武场.获得戏票')), leiDang],
  XiGuShenChu: [collect('K_01004', tag('xg.杀气塔前.捡到钥匙'))],
  ShaoZhu: ribbons,
  RongShuZhiXin: banyanTrials,
  XueMaiJueXing: dragonTrials,
  JianXiYiShi: [
    collect('I_01007', tag('xg.营地玉儿.药材1')),
    collect('I_01008', tag('xg.营地玉儿.药材2')),
    collect('I_01009', tag('xg.营地玉儿.药材3'))
  ],
  JiuSiFuShang: numbered('救治飞贼', 'fjzl.救死扶伤.救飞贼', 4),
  XueRouHua: [target('血肉花', item('I_01003'), item('I_01001'), tag('xg.玉儿.获得血肉花'), branch('XueRouHua', '1'))],
  FengChe: [collect('I_01005', tag('xg.货郎.拾取风车'))],
  QingLiMenHu: [
    target('恶弓手营地弟子', branch('QingLiMenHu', '1')),
    collect('I_01006', branch('QingLiMenHu', '2'))
  ],
  NanYanZhiYin: [collect('R_01033')],
  DaoYiYouDao: [target('“滑溜手”的血书', item('R_02012'), done('DaoYiYouDao'))],
  XiongFu: [
    ...['R_01003', 'R_01004', 'R_01005', 'R_01006', 'R_01007', 'R_01008', 'R_01014']
      .map((id, i) => collect(id, tag('quest.凶斧收集物.' + (i + 1)))),
    pengMeng
  ],
  GeJueXieZi: [
    target('悲泣溪谷的浑源石', tag('xg.鬼差.获得浑源石'), tag('xg.鬼差.给鬼差浑源石'), branch('GeJueXieZi', '1')),
    target('庞镇的浑源石', tag('jmkd.鬼差.获得浑源石'), tag('jmkd.鬼差.给鬼差浑源石'), branch('GeJueXieZi', '2')),
    target('血色森林的浑源石', tag('xssl.鬼差.获得浑源石'), tag('xssl.鬼差.给鬼差浑源石'), branch('GeJueXieZi', '3'))
  ],
  GuiTu: [collect('K_05004'), collect('I_06010', tag('ljc.老根头.获得木梳子'), branch('GuiTu', '4'))],
  LanJiaGongZi: [collect('K_06002')],
  HuanShuPiPa: [
    collect('I_05001', tag('quest.幻术琵琶.收集琴头')),
    collect('I_08002', tag('quest.幻术琵琶.收集琴弦')),
    collect('I_04001', tag('quest.幻术琵琶.收集背板'))
  ],
  JiGuanChuan: [
    target('祝原的杀气改造核心', tag('pz.火刀队长.杀气核心')),
    target('毕峰的杀气改造核心', tag('pz.双锏毕锋.杀气核心'))
  ],
  HuXinMiMi: [
    ...masks, collect('K_04901'), collect('K_12002', tag('quest.任务物品.获得红房子眼珠')),
    ...petals('F_0501', 'ljc.萤火意识之花.')
  ],
  HongFangZi: [collect('K_04902', tag('rozs.人偶中枢.人偶舌头'), branch('HongFangZi', '1'))],
  XiLouFeiXu: [...petals('F_0801', 'mgxl.烟儿的记忆之花.'), yanQiansui],
  BaiShanMiWen: [target('毕桃桃的人偶', tag('bsmw.剑偶.死亡有任务'), killed('BP_Monster_HuaShan_JianOu'), branch('BaiShanMiWen', '3'))],
  KunLunSanJie: [collect('K_03002'), huangXing],
  JiangHuRenShi: [biFeng],
  XiaoCui: [collect('I_05003'), collect('I_10001', tag('ddsd.获得物品.无根仙露'), tag('ddsd.陆三迁2.有喝仙露'))],
  WuXiangWang: [collect('R_070017', tag('ddsd.周平子.获得遗书'), tag('ddsd.周平子.交付遗书'))],
  LiuYi: [collect('I_10006', tag('ddsd.获得物品.墨机子残剑'), branch('LiuYi', '1'))],
  YongShengDaoZhu: [target('赎罪名单', item('R_070002'), tag('ddsd.获得物品.赎罪名单'), branch('YongShengDaoZhu', '1'))],
  BaiXue: [collect('K_05007'), collect('I_10003', branch('BaiXue', '2')), collect('F_06004'), collect('F_06022')],
  BuMieXiaDan: chivalryEncounters.flatMap((encounter, i) => {
    const name = encounter.name + '·' + encounter.bell;
    return [
      target(name + '（解脱）', tag('pz.不灭侠胆.帮助正道解脱' + (i + 1)), item(encounter.id)),
      target(name + '（花瓣）', item(encounter.id))
    ];
  }),
  FangKuai: [collect('AC_ShachiWeapon_1'), collect('AC_ShachiWeapon_2')],
  TouPaiHuaDan: [collect('I_06009', tag('pz.头牌花旦.获得舞扇'), tag('pz.头牌花旦.带回舞扇'))],
  XiaoXue: [
    collect('I_03001', tag('ljc.小雪.收集物1')),
    collect('I_03002', tag('ljc.小雪.收集物2')),
    collect('I_03003', tag('ljc.小雪.收集物3'))
  ],
  DaoJianFoXin: [collect('TU_11002', tag('pz.毕狄.已拾取'), branch('DaoJianFoXin', '1'))],
  DuanZhi: [collect('I_06008', tag('dhs.双痕剑.拾取断指'), branch('DuanZhi', '2'))],
  CanCunZhiWu: [target('里武林的上官斩', branch('CanCunZhiWu', '1'))],
  YiBiZhiDao: [equipment('妖锯', 'YuuBlade', 'weapon'), equipment('铁拳套', 'TieGongZhuQuanTao', 'phantom')],
  SanMianHunDun: [
    target('溪谷圣母像裂缝·三面魔偶', tag('xg.三头娃娃.挑战成功')),
    yuCong, ...petals('F_0804', 'fjzl.三头魔偶.记忆之花', 3)
  ],
  ZhengYiMengChen: petals('F_7000', 'quest.正义蒙尘.记忆之花'),
  QiXingJianZhen: collectAll('F_03002', 'F_03003', 'F_03004', 'F_03005', 'F_03006', 'F_03007'),
  XianYin: petals('F_0205', 'quest.弦音.记忆之花'),
  WuShiZunZhu: collectAll('F_06031', 'F_06032', 'F_06036', 'F_06033', 'F_06034', 'F_06035'),
  BaiYing: petals('F_1802', 'quest.白影.记忆之花')
};

export const achievementObjectives = {
  ACH_007: questObjectives['MainCh2-SiDaSheWu'],
  ACH_010: questObjectives.HuXinMiMi,
  ACH_013: [target('湖心秘密', done('HuXinMiMi')), target('血脉觉醒', done('XueMaiJueXing'))],
  ACH_014: [pengMeng],
  ACH_015: [target('新娘阿花', tag('achievment.红妆鬼斩.完成'), tag('xg.击杀.新娘阿花'))],
  ACH_016: [target('猎杀者追命', tag('achievment.猎杀.完成'), tag('xg.击杀.追命二阶段'))],
  ACH_017: [target('剑痴花千笑', tag('achievment.千杯散尽.完成'), tag('fjzl.击杀.剑痴'))],
  ACH_018: [target('双蛇夫人白赤练', tag('achievment.镜碎蛇影无.完成'), tag('fjzl.击杀.弄蛇P2'))],
  ACH_019: [target('沐小葵', tag('achievment.来日可如约.完成'), tag('ljc.沐小葵.最终形态击杀'))],
  ACH_020: [target('舞狮尊主烈焰', tag('achievment.焰尽狮魂传.完成'), tag('pz.击杀.舞狮尊主烈焰'))],
  ACH_021: [target('七星剑阵大师兄', tag('achievment.剑横北斗.完成'), tag('zddy.击杀.剑阵2'))],
  ACH_022: [huangXing],
  ACH_023: [target('活人偶清道夫', tag('achievment.物善其用.完成'), tag('hfz.击杀.清道夫'))],
  ACH_024: [leiDang],
  ACH_025: [target('风雪刀客', tag('achievment.白影巍巍.完成'), tag('dhs.击杀.风雪刀客'))],
  ACH_026: [
    target('力者和锯者·第一阶段', tag('dhy.力者战斗.1阶段击杀')),
    target('力者·石破天惊之态', tag('dhy.力者战斗.2阶段击杀'), tag('achievment.锯理力争.完成'))
  ],
  ACH_027: [target('梦华圣母娘娘', tag('dhs.击杀.梦华'), tag('achievment.大梦终须醒.完成'))],
  ACH_028: [youLong[1], yanQiansui, target('独眼弓客', tag('smrds.击杀.独眼弓客'))],
  ACH_029: [
    target('玉瓒', tag('ljc.击杀.玉瓒')),
    target('玉璧', tag('zddy.剑偶玉璧.击杀成就计数')),
    target('玉鼎', tag('pz.击杀.戏票怪物')),
    yuCong
  ],
  ACH_030: [target('火刀祝原', tag('pz.杀气塔.击杀火刀队长')), biFeng],
  ACH_031: [
    target('斩骑', tag('pz.击杀.鬼差斩骑')),
    target('勾魂', tag('pz.击杀.鬼差勾魂')),
    target('断肠', tag('pz.击杀.鬼差断肠'))
  ],
  ACH_032: questObjectives.HuXinMiMi,
  ACH_033: dragonTrials,
  ACH_034: questObjectives.BaiShanMiWen,
  ACH_035: questObjectives.GuiTu,
  ACH_036: questObjectives.LanJiaGongZi,
  ACH_037: questObjectives.GeJueXieZi,
  ACH_038: [
    target('血肉花', done('XueRouHua')), target('见习医师', done('JianXiYiShi')), target('救死扶伤', done('JiuSiFuShang'))
  ],
  ACH_040: banyanTrials,
  ACH_054: [collect('TU_17001')],
  ACH_058: ribbons,
  ACH_062: youLong
};
