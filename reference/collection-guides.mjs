// Original short notes; native IDs bind each note to a specific pickup.
import { chivalryEncounters, sources } from './risk-data.mjs';

const luSource = 'https://www.powerpyx.com/phantom-blade-zero-village-of-lu-collectible-locations/';
export const collectionGuides = {
  ...Object.fromEntries(chivalryEncounters.map(({ map, id, bell, route }) => [`${map}:flower:${id}`, {
    bell, steps: [route, '持破碎的侠胆帮助弟子解脱，再调查原地的花瓣。已经解脱时可直接回该位置核对花瓣。'], source: sources.chivalry.url
  }])),
  'LuJiaCun:medicine:GuiShen': { steps: ['从“三人偶水井”往左上台阶，拐进左侧小院。', '进入院内左侧房屋，下到地窖拾取归神汤。'], source: luSource },
  'LuJiaCun:accessory:AC_SummonDuration': { steps: ['在“幽蓝萤火之庙”找歌女人偶，接取人偶木心并拿到书信。', '到“幸存者小院”将信交给沛郎，再调查“机擎巨人遗骸”附近田野营火旁的肉身。', '返回歌女人偶处完成交付，领取人偶木心。'], source: luSource, quest: 'RenOuMuXin' },
  'LuJiaCun:amber:4': { steps: ['从“幸存者小院”出门，往右侧房屋上方的平台走。', '进屋之前检查平台左侧的宝箱，打开后取得琥珀碎片。'], source: luSource },
  'LuJiaCun:accessory:AC_BreakRecover': { steps: ['在“幸存者小院”与僧人对话时选择“不信奉”。', '把悲泣溪谷取得的念珠交给他，再领取沉香念珠；已经选错时需核对旧存档。'], source: luSource },
  'LuJiaCun:weapon:YuuBlade': { steps: ['挑战沐小葵前收齐五条少主红丝带。', '完成首领战末尾的玉妖、铁鬼追加战后，领取妖锯。'], source: luSource },
  'LuJiaCun:weapon:LuanYing': { steps: ['打完沐小葵后，在离场码头拾取乱莺剑。', '离开前检查；此处与战后的临时场景有关。'], source: luSource },
  'LuJiaCun:amber:3': { steps: ['打完沐小葵后检查码头左侧树旁的宝箱。', '先开箱再离场；攻略报告后续回访时宝箱会消失。'], source: luSource }
};
