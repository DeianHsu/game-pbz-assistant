// Original short notes; native IDs bind each note to a specific pickup.
import { baiXuePickupSteps, chivalryEncounters, sources } from './risk-data.mjs';

const luSource = 'https://www.powerpyx.com/phantom-blade-zero-village-of-lu-collectible-locations/';
const forestSource = 'https://www.powerpyx.com/phantom-blade-zero-crimson-forest-collectible-locations/';
const maskSource = 'https://wiki.biligame.com/yingzhiren/%E7%99%BE%E7%9B%B8%E5%82%A9%E9%9D%A2';
const estateSource = 'https://www.powerpyx.com/phantom-blade-zero-mirage-estate-pangzhen-collectible-locations/';
export const collectionGuides = {
  ...Object.fromEntries(Object.entries(baiXuePickupSteps)
    .map(([id, step]) => [`${step.map}:${id}`, { bell: step.bell, steps: [step.action], source: step.source }])),
  ...Object.fromEntries(chivalryEncounters.map(({ map, id, bell, route }) => [`${map}:flower:${id}`, {
    bell, steps: [route, '持破碎的侠胆帮助弟子解脱，再调查原地的花瓣。已经解脱时可直接回该位置核对花瓣。'], source: sources.chivalry.url
  }])),
  'LuJiaCun:medicine:GuiShen': { steps: ['从“三人偶水井”往左上台阶，拐进左侧小院。', '进入院内左侧房屋，下到地窖拾取归神汤。'], source: luSource },
  'LuJiaCun:accessory:AC_SummonDuration': { steps: ['在“幽蓝萤火之庙”找歌女人偶，接取人偶木心并拿到书信。', '到“幸存者小院”将信交给沛郎，再调查“机擎巨人遗骸”附近田野营火旁的肉身。', '返回歌女人偶处完成交付，领取人偶木心。'], source: luSource, quest: 'RenOuMuXin' },
  'LuJiaCun:amber:4': { steps: ['从“幸存者小院”出门，往右侧房屋上方的平台走。', '进屋之前检查平台左侧的宝箱，打开后取得琥珀碎片。'], source: luSource },
  'LuJiaCun:accessory:AC_BreakRecover': { steps: ['在“幸存者小院”与僧人对话时选择“不信奉”。', '把悲泣溪谷取得的念珠交给他，再领取沉香念珠；已经选错时需核对旧存档。'], source: luSource },
  'LuJiaCun:weapon:YuuBlade': { steps: ['挑战沐小葵前收齐五条少主红丝带。', '完成首领战末尾的玉妖、铁鬼追加战后，领取妖锯。'], source: luSource },
  'LuJiaCun:weapon:LuanYing': { steps: ['打完沐小葵后，在离场码头拾取乱莺剑。', '离开前检查；此处与战后的临时场景有关。'], source: luSource },
  'LuJiaCun:amber:3': { steps: ['打完沐小葵后检查码头左侧树旁的宝箱。', '先开箱再离场；攻略报告后续回访时宝箱会消失。'], source: luSource },
  'FuJiZhiLin:banyan:1': { bell: '迷雾消散处', steps: ['在迷雾森林出口和虚空对话，沿崖下到水边，去右侧的人面榕树互动。'], source: forestSource },
  'FuJiZhiLin:pillar:1': { bell: '镜林龙柱', steps: ['从镜林入口过拳痴战场进洞，走右侧通往红光区域的岔路。', '激活镜林龙柱铃铛，在附近调查龙柱进入试炼。'], source: forestSource },
  'XiMeng:accessory:AC_MagicWeapon': { bell: '傩面祭台', source: maskSource, steps: [
    '喜：从柳风亭进西侧门，下楼沿路进纸人阁楼，取一层祭台上的碎片。',
    '怒：从戏园沿河灯进院，贴左走。看到右手水井就走左侧两段楼梯，绕到影壁后跳下一层，到崖边红布祭桌拾取。',
    '哀：从竹影道上楼，进小房间右转走到尽头，在祭台上拾取。',
    '三块都拿到后回傩面祭台找老乞丐交付。'
  ] },
  'XiMeng:accessory:AC_Electrified': { bell: '戏梦山庄小张藏身处', source: estateSource, steps: [
    '将军铜镜：从演武场的玉鼎战区进旁边大屋，检查一层右手房间的宝箱。',
    '金银香囊：用戏票进戏楼后，先打开入口左侧房间的宝箱，再继续演出。',
    '云月金簪：通过冷荼书房的密道进圣躯府邸，打开大厅中央雕像背后的宝箱。',
    '回戏梦山庄的小张藏身处交付，核对月雷华灯入包。'
  ] },
  'XiMeng:accessory:AC_ExecutionSwitchCool': { bell: '戏园', steps: ['从戏园外场过倒木，落到水道里，进入河边小洞。洞中可拾取法事药酒，爬梯后开箱取得刽子手头巾。'], source: estateSource },
  'XiMeng:medicine:Medicine_Element': { bell: '戏园', steps: ['从戏园外场过倒木，下到水道，进入河边小洞拾取法事药酒。'], source: estateSource },
  'MeiGuHu:scarecrow:1': { bell: '梅谷村东岛船坞', steps: ['从船坞沿岛上主道去东面，找树旁稻草人，互动挑战灭法之法蛊鹤。'], source: 'https://www.gamersky.com/handbook/202611/2240087.shtml' }
};
