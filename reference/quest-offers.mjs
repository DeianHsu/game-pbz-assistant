import { baiXueSteps, sources } from './risk-data.mjs';

const roadbook = sources.ledger.url;
const sideQuests = 'https://www.powerpyx.com/phantom-blade-zero-all-side-quests-guide/';
const campChanged = 'quest.一个不留.营地变怪';
const beforeBai = { before: ['baichilian'], cutoffs: [campChanged], warning: '在击败白赤练、营地发生变异前处理。' };
const offer = (map, person, place, bellId, action, extra = {}) => ({ map, person, place, bellId, action, source: roadbook, ...extra });
const valley = (...args) => offer('XiGu', ...args);
const forest = (...args) => offer('FuJiZhiLin', ...args);
const village = (...args) => offer('LuJiaCun', ...args);
const town = (...args) => offer('PangZhen', ...args);
const tavern = (person, action) => town(person, '“组织”地下酒馆', 'Bell_SZ_004', action);
const mountain = (...args) => offer('DengDingShanDao', ...args);

// Acceptance locations are separate from the first objectives. Anchors are reachable
// bells near the giver, and cutoffs apply only to finding an unaccepted quest.
export const questOffers = {
  QiShengHeLai: [valley('沿溪水传来的女子哭声', '开端之地前的溪边', 'Bell_NLES_001', '沿溪水走近哭声，触发任务。',
    { cutoffs: ['quest.任务中断.进入青蛇屋外围'], warning: '进入青蛇屋外围前需要完成宗祠及地下的目标。' })],
  XueRouHua: [
    forest('玉儿', '飞贼营地', 'Bell_LZSJ_005', '找玉儿询问救治她父亲的方法。',
      { ...beforeBai, tags: ['fjzl.营地玉儿.到达营地'] }),
    valley('玉儿', '驿站铁匠铺旁', 'Bell_NLES_003', '找玉儿询问救治她父亲的方法。',
      { ...beforeBai, tags: ['xg.营地玉儿.到达营地'], cutoffs: [campChanged, 'fjzl.营地玉儿.到达营地'] }),
    valley('玉儿', '初见玉儿处下方的溪边', 'Bell_NLES_022', '沿绳下到溪边，问玉儿如何救她的父亲。',
      { ...beforeBai, anchors: ['Bell_NLES_014', 'Bell_NLES_022'], cutoffs: [campChanged, 'xg.玉儿.第一次离开', 'xg.营地玉儿.到达营地'] })
  ],
  XiongFu: [valley('《四凶斧案卷（祸乱）》', '残偶谷底铃铛旁', 'Bell_NLES_015', '拾取铃铛旁的案卷即可开启任务。',
    { warning: '其中一卷要经难言之隐取得，先处理驿站的手令路线。' })],
  SanMianHunDun: [valley('三面魔偶的试炼', '圣母像裂缝', 'Bell_NLES_014', '从裂缝进入试炼触发任务。', { source: sideQuests })],
  QingLiMenHu: [valley('老弓手', '驿站里坐在屋顶上的老人', 'Bell_NLES_003', '上屋顶，和老弓手对话接任务。', beforeBai)],
  NanYanZhiYin: [valley('封锁院落的正道弟子', '驿站铁匠铺对面的铁链院门', 'Bell_NLES_003', '靠近院门听守卫对话，调查被铁链封住的院落。', beforeBai)],
  JianXiYiShi: [valley('玉儿', '驿站铁匠铺旁', 'Bell_NLES_003', '找玉儿选择「采药」，领取药方。',
    { tags: ['xg.营地玉儿.到达营地'], before: ['jingye', 'baichilian'], cutoffs: [campChanged, 'fjzl.营地玉儿.到达营地'], warning: '击败荆野前交齐三味药材。' })],
  XiGuShenChu: [valley('门旁的正道弟子', '溪谷平原入口的锁门旁', 'Bell_NLES_004', '在平原入口找门边的正道弟子交谈。')],
  GeJueXieZi: [valley('友善鬼差', '溪谷杀气塔顶', 'Bell_NLES_012', '和塔顶的友善鬼差对话，接下寻找浑源石的请求。',
    { warning: '离开悲泣溪谷前交回第一块浑源石。' })],
  KunLunSanJie: [valley('正道弟子', '溪谷杀气塔顶通往瀑布吊桥的山道', 'Bell_NLES_012', '从塔顶往瀑布吊桥方向走，下梯子后与案卷旁的正道弟子对话。')],
  HongFangZi: [valley('红房子的内门', '悲泣溪谷杀气塔下方的红房子', 'Bell_NLES_021', '走近红房子并调查内门。接任务时可以先记下门的位置，之后再找人偶舌头。')],
  XueMaiJueXing: [valley('溪谷龙柱', '溪谷龙柱的试炼入口', 'Bell_DP_001', '在龙柱旁互动并回忆特殊杀气，开启龙柱路线。',
    { anchors: ['Bell_NLES_006', 'Bell_DP_001'] })],
  XuKongHuanXiang: [forest('虚空幻象', '血色森林入口', 'Bell_LZSJ_001', '从大瀑布后的通道进入血色森林，与入口的虚空幻象互动。',
    { anchors: ['Bell_LZSJ_001', 'Bell_LZSJ_002'] })],
  DaoYiYouDao: [forest('飞贼滑溜手', '亡命徒陷阱旁的岔路', 'Bell_LZSJ_004', '击败滑溜手，拾取飞贼血书开启任务。', beforeBai)],
  JiuSiFuShang: [forest('玉儿', '飞贼营地', 'Bell_LZSJ_005', '与玉儿谈「林中的伤患」，接取救治飞贼的任务。',
    { ...beforeBai, tags: ['fjzl.营地玉儿.到达营地'] })],
  BaiShanMiWen: [forest('白山派女弟子兰兰', '飞贼营地外的大桥', 'Bell_LZSJ_005', '到营地外的大桥与兰兰对话接任务。',
    { ...beforeBai, warning: '在打白赤练前先接取，之后还要调查山舍并追查毕桃桃。' })],
  JiaoTuSanKu: [
    forest('妙手小张', '血色森林小张藏身处', 'Bell_FJZL_XiaoZhang_001', '获救后到藏身处找小张对话。', { tags: ['fjzl.小张.打开笼子对话后'] }),
    forest('妙手小张', '挂笼小道的吊笼', 'Bell_LZSJ_013', '降下小张的吊笼，开笼后与他对话。',
      { cutoffs: ['fjzl.小张.消失', 'fjzl.小张.打开笼子对话后', campChanged], warning: '优先救人，之后到他的藏身处继续对话。' })
  ],
  MiaoShouKongKong: [forest('妙手小张', '血色森林小张藏身处', 'Bell_FJZL_XiaoZhang_001', '向获救的小张询问各地珍宝，接取收集。',
    { tags: ['fjzl.小张.打开笼子对话后'] })],
  XianYin: [forest('记忆之花「虚空（其一）」', '镜林入口东侧山洞的岔路口', 'Bell_LZSJ_007', '从镜林入口往东进洞，拾取岔路口的记忆之花。',
    { warning: '在打白赤练前集齐虚空的花瓣，以开启对应的首领战流程。' })],
  RongShuZhiXin: [forest('虚空幻象', '迷雾森林出口附近', 'Bell_LZSJ_008', '从遗冢地进入迷雾森林，沿亮光穿过去，与出口附近的虚空交谈。',
    { anchors: ['Bell_LZSJ_021', 'Bell_LZSJ_008'] })],
  HuanShuPiPa: [village('《白赤练的手记》', '梦醒之地铃铛前的桥头', 'Bell_LZSJ_012', '拾取桥头的手记，接到寻找幻鬼和琵琶部件的线索。')],
  GuiTu: [village('老根头', '老根头藏身处的坡边', 'Bell_SXC_01_08', '和老根头对话，答应替他打通密道。',
    { cutoffs: ['ljc.老根头.消失', 'pz.后街.进入'], warning: '离开陆家村前回报密道已通，并接受他接下来的请求。' })],
  YiGeBuLiu: [village('老根头', '老根头藏身处的坡边', 'Bell_SXC_01_08', '听老根头说起玉儿的遭遇，接到回访驿站和营地的任务。',
    { cutoffs: ['ljc.老根头.消失', 'pz.后街.进入'] })],
  HuXinMiMi: [village('记忆之花「萤火（其一）」', '老根头藏身处前方的桥边岔路', 'Bell_SXC_01_08', '过桥后在先前的持盾敌人附近往左找，调查萤火的第一朵记忆之花。')],
  LanJiaGongZi: [village('兰少狄', '兰公子藏身处', 'Bell_SXC_01_07', '与兰公子对话，接下打通密道的委托。',
    { cutoffs: ['ljgz.兰少狄1.消失', 'pz.后街.进入'], warning: '打通密道后先回来告知兰公子，再去庞镇。' })],
  ShaoZhu: [village('沐小葵的红丝带', '三人偶水井外、过桥前的树枝', 'Bell_SXC_01_01', '调查桥头的红丝带，开启少主的收集路线。',
    { before: ['luxiaokui'], warning: '乘升降机挑战沐小葵前先集齐五条丝带。' })],
  RuMengQiZi: [village('昏睡的女织', '三人偶水井东侧河道旁的院子', 'Bell_SXC_01_14', '沿井旁东侧小巷下到河道，进东面的院子找床上的女织。',
    { anchors: ['Bell_SXC_01_01', 'Bell_SXC_01_14'], cutoffs: ['ljc.女织.死亡', 'ljc.击杀.大娘亲'],
      closedReason: '本周目已触发女织路线的截止事件。要取得任务日志，需在击败女织人偶前与院内的女织对话。',
      warning: '先接任务，再去击败装有女织意识的人偶。', source: 'https://www.gamersky.com/handbook/202610/2238190.shtml' })],
  RenOuMuXin: [village('歌女人偶', '幽蓝萤火之庙门前', 'Bell_SXC_01_14', '与庙前的歌女人偶对话，接下给沛郎送信的请求。')],
  DaHuang: [village('猎户', '幸存者小院以北的屋内', 'Bell_SXC_01_13', '去小院北面的房子找猎户，领取猎户的犬铃。')],
  XiaoCui: [village('小翠', '人偶试验场入口右侧的人偶旁', 'Bell_SXC_02_03', '与小翠对话并领取红头绳。',
    { before: ['crusher'], cutoffs: ['fzmd.小翠.死亡', 'ddsd.陆三迁2.死亡'], warning: '先在枷笼山救陆三迁。到断魂山后，先在最后的正道营地交付信物，再打力者和锯者。' })],
  RenOuZhongShu: [village('陆家村梦差密室的传送门', '人偶试验场东侧岔路', 'Bell_SXC_02_03', '从试验场往东进岔路，穿过密室的传送门。')],
  JiGuanChuan: [tavern('幻鬼', '进酒馆内室找幻鬼，听取前往梅谷湖的线索，接下机关船任务。')],
  WuShiZunZhu: [town('记忆之花「舞狮尊主（其一）」', '市集铃铛旁酒馆的座椅上', 'Bell_SZ_003', '走进市集酒馆，调查座椅上的记忆之花。')],
  DaoJianFoXin: [tavern('毕狄道长', '在幻鬼身旁找毕狄，和他谈天玄青铜剑。')],
  BuMieXiaDan: [tavern('紫衣狼头领', '与酒馆里的狼头领交谈，接取不灭侠胆。处理正道高手前先了解解脱时机。')],
  TouPaiHuaDan: [tavern('头牌花旦人偶', '与酒馆内的头牌花旦交谈，领取脂粉。')],
  FangKuai: [tavern('渔夫', '到酒馆角落找渔夫，询问方块和他的同伴。')],
  ZaiHuiXiongZhang: [town('记忆之花「再会兄长（其一）」', '黄家大宅二楼卧室', 'Bell_SZ_016', '用牛掌柜给的钥匙进入黄家大宅，到二楼卧室拾取花瓣。',
    { needs: ['huangKey'] })],
  XiangJianHeJi: [offer('HouJie', '记忆之花「相煎何急（其一）」', '青蛇屋北侧石桥后的台阶', 'Bell_SZ_023', '从青蛇屋往北过桥，拾取台阶旁的花瓣。',
    { anchors: ['Bell_SZ_010', 'Bell_SZ_023'], needs: ['youLong'] })],
  CiMuXin: [offer('HouJie', '记忆之花「慈母心（其一）」', '后山凉亭通往贫民窟的梯子下', 'Bell_SZ_014', '从凉亭往老根头家方向，经屋顶下梯，在契据旁拾取花瓣。',
    { needs: ['flame'] })],
  WuXiangWang: [town('雨玲', '市集铃铛旁被雾挡住的酒楼楼上', 'Bell_SZ_003', '用幻术琵琶驱散楼下的雾，上楼找雨玲对话。',
    { needs: ['pipa'], cutoffs: ['ddsd.周平子.死亡'], source: sideQuests })],
  QiXingJianZhen: [offer('ZhengDaoDaYing', '记忆之花「七星弟子（其一）」', '栈道入口上方，返回铃铛的梯子旁', 'Bell_YXZR_002', '沿栈道上去后往南，找能放下梯子返回栈道入口的地方，调查梯子旁的花。')],
  XiaoXue: [offer('ZhengDaoDaYing', '吞噬尸体的小雪', '乱葬岗的墓地', 'Bell_YXZR_003', '进墓地击败小雪，拾取她的物品清单触发。')],
  MoJiaoZhiNv: [offer('ZhengDaoDaYing', '鸽舍门口的女弟子', '鸽舍铃铛旁', 'Bell_YXZR_011', '和鸽舍门口的女弟子交谈，再上屋顶找红衣女剑客。',
    { before: ['qixing'], cutoffs: ['zddy.击杀.红衣女剑客'], warning: '屋顶遇到红衣女剑客后沿锁链离开，避免提前击杀。', source: sources.qixing.url })],
  XiLouFeiXu: [offer('MeiGuHu', '「烟儿」的记忆之花', '梅谷乐坊岛周边水面', 'Bell_MGH_004', '乘船靠近乐坊岛周围水面的记忆之花，拾取任一朵开启浮华引。',
    { anchors: ['Bell_SZ_013', 'Bell_MGH_004'] })],
  BaiYing: [offer('MeiGu_YiJi', '记忆之花「囚命外围队长：白影」', '幻术师遗迹内', 'Bell_LYZ_011', '在护法四像镜处用四张面具进入遗迹，调查遗迹里的第一朵白影记忆。',
    { needs: ['masks'], source: 'https://kungfupunk.com/zh-hant/quests/whiteshadow' })],
  ZhengYiMengChen: [mountain('记忆之花「荒行子（其一）」', '铁杀营地东侧、滑墙途中的平台', 'Bell_DDSD_002', '在营地东侧沿墙下滑时跳上中间平台，调查荒行子的记忆之花。',
    { anchors: ['Bell_DDSD_001', 'Bell_DDSD_002'] })],
  JiangHuRenShi: [mountain('清醒的江湖人士', '囚笼洞口附近的吊笼', 'Bell_DDSD_003', '处理笼外的敌人，再开笼和江湖人士对话。',
    { cutoffs: ['ddsd.江湖人士.死亡'], warning: '先查看笼中人，再推进山道的开门和首领事件。', source: sideQuests })],
  LiuYi: [mountain('柳义', '囚笼道的升降吊笼', 'Bell_DDSD_004', '拉下笼旁机关，开笼后和柳义谈墨玑子的遗物。',
    { cutoffs: ['ddsd.柳义.未开笼子死亡', 'ddsd.柳义.任务死亡'], warning: '先打开笼门并对话，避免柳义死在笼里。', source: 'https://www.gamersky.com/handbook/202611/2240851_7.shtml' })],
  YongShengDaoZhu: [mountain(baiXueSteps.start.person, '宗祠外山门东侧，过桥后的路边', 'Bell_DDSD_006', baiXueSteps.start.action,
    { snowStep: 'start', warning: '交还名单时的选择影响白雪儿后续。' })],
  BaiXue: [mountain(baiXueSteps.puppet.person, '宗祠外山门东侧，陈柱原先坐着的位置', 'Bell_DDSD_006', baiXueSteps.puppet.action,
    { snowStep: 'puppet', tags: ['ddsd.杀气怪面.死亡'], source: sources.baiXue.url })],
  QuanXin: [forest('铁鬼', '冰封后的血色森林杀气塔塔顶', 'Bell_LZSJ_019', '从六层继续上塔顶，找铁鬼谈铁拳门主。',
    { tags: ['fjzl.风雪数据层.激活'], source: sideQuests })],
  YiBiZhiDao: [forest('玉妖', '冰封后的血色森林杀气塔塔顶', 'Bell_LZSJ_019', '从六层上塔顶与玉妖对话。切磋时按约定只装备妖锯和铁拳套。',
    { tags: ['fjzl.风雪数据层.激活'], weapon: 'YuuBlade', source: 'https://www.18183.com/gonglue/202611/h7g6e6qe.html' })]
};
