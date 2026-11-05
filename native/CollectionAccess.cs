using System;
using System.Collections.Generic;
using System.Linq;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    internal sealed class CollectionAccess
    {
        readonly Progress p;
        static readonly Row Guides = Progress.Guides;
        static readonly Row Labels = Data.Make("done", "已收集", "ready", "已知前置满足", "locked", "暂不可取", "route", "本区流程收集", "unknown", "解锁待核实");
        static readonly HashSet<string> Ice = new HashSet<string> {
            "bell:Bell_LZSJ_017", "bell:Bell_LZSJ_018", "bell:Bell_LZSJ_019", "blackstone:5", "blackstone:6", "amber:4", "amber:6",
            "accessory:AC_Chaos", "accessory:AC_ResistIce", "medicine:Medicine_AdditionalRecover"
        };
        public CollectionAccess(Progress progress) { p = progress; }
        public static Row Result(string state, string reason, string source = "")
        {
            return Data.Make("state", state, "label", Labels.S(state), "reason", reason, "source", source);
        }
        static bool? Any(params bool?[] states) { return states.Contains(true) ? true : states.Contains(null) ? (bool?)null : false; }
        static bool? All(params bool?[] states) { return states.Contains(false) ? false : states.Contains(null) ? (bool?)null : true; }
        bool? Has(string id, string kind = "goods", bool possession = false) { return p.Acquired(id, kind, possession, true); }
        bool? HasAll(params string[] ids) { return All(ids.Select(id => Has(id)).ToArray()); }
        public bool? Pipa { get { return Any(p.Tag("quest.幻术琵琶.组装好"), p.Done("HuanShuPiPa")); } }
        string Source(string id) { return Guides.Get("accessSources").S(id); }
        static Row Gate(bool? satisfied, string blocked, string ready, string source)
        {
            return Result(satisfied == true ? "ready" : satisfied == false ? "locked" : "unknown",
                satisfied == true ? ready : satisfied == false ? blocked : "存档中的前置记录无法确认。" + blocked, source);
        }

        KeyValuePair<string, bool?> Check(string id)
        {
            string title;
            bool? value;
            switch (id)
            {
                case "city": title = "进入庞镇"; value = p.Tag("pz.庞镇.到达"); break;
                case "redCaptain": title = "击败红衣鬼差，进入庞镇中心"; value = Any(p.Tag("pz.击杀.红衣鬼差P2"), Has("HuoLiuXing", "phantom")); break;
                case "cavalry": title = "击败鬼差高手斩骑"; value = Any(p.Tag("pz.击杀.鬼差斩骑"), Has("PoJun", "weapon")); break;
                case "backstreet": title = "穿过幻鬼酒馆，进入后街"; value = p.Tag("pz.后街.进入"); break;
                case "wuXuan": title = "击败后街的堕落将军武轩"; value = Any(p.Tag("pz.击杀.堕落将军"), Has("TanLang", "phantom")); break;
                case "wraith": title = "击败骨婉约，开放井底路线"; value = p.Tag("pz.击杀.骨婉约"); break;
                case "doctor": title = "击败神医谢秋冬，开放青蛇屋后段"; value = p.Killed("BP_Monster_MadDoctor"); break;
                case "youLong": title = "击败庞镇的游龙二帮主"; value = Any(p.Tag("pz.击杀.游龙二帮主"), Has("YouLongTou", "phantom")); break;
                case "changHong": title = "击败长鸿，进入玉儿父亲所在屋"; value = Any(p.Tag("ljc.击杀.长鸿P2"), Has("ThunderSpear", "phantom")); break;
                case "flame": title = "取得烈焰狮头，烧开枯枝"; value = Has("LionHead", "phantom", true); break;
                case "dormantLion": title = "取得熄火烈焰狮头"; value = Any(Has("I_06004"), p.Tag("pz.舞狮.获得破狮子头")); break;
                case "lionDead": title = "击败舞狮尊主烈焰"; value = Any(p.Tag("pz.击杀.舞狮尊主烈焰"), Has("I_06004")); break;
                case "soulclaimer": title = "击败鬼差高手勾魂，取得别离残钩"; value = Has("DualHook", "weapon"); break;
                case "lionKey": title = "取得狮门钥匙或打开舞狮馆大门"; value = Any(Has("K_05009"), p.Tag("pz.舞狮.打开大门")); break;
                case "huangKey": title = "在幻鬼酒馆向牛掌柜取得黄家大宅钥匙"; value = Has("K_05011"); break;
                case "genKey": title = "取得老根头家的黄铜钥匙"; value = Has("K_05004"); break;
                case "cellar": title = "取得后街秘密地窖开关"; value = Has("K_06006"); break;
                case "courtyard": title = "在赎罪名单后续取得庞镇后街小院钥匙"; value = Has("K_05007"); break;
                case "necklace": title = "取得沾血项链，推进白雪儿回访"; value = Has("I_10003"); break;
                case "digTree": title = "推进白雪儿至老槐树可以挖掘"; value = p.Tag("pz.老槐树.可以挖掘"); break;
                case "pipa": title = "集齐部件并修复幻术琵琶"; value = Pipa; break;
                case "zhouLetter": title = "在枷笼山取得周平子遗书"; value = Any(Has("R_070017"), p.Tag("ddsd.周平子.获得遗书"), p.Tag("ddsd.周平子.交付遗书")); break;
                case "lanPassage": title = "完成兰家大少的密道告知，再回庞镇"; value = Any(p.Branch("LanJiaGongZi", "2"), Has("K_06002"), p.Done("LanJiaGongZi")); break;
                case "cube": title = "在梅谷湖集齐暗源方块的榫、卯"; value = Any(HasAll("AC_ShachiWeapon_1", "AC_ShachiWeapon_2"), p.Tag("pz.渔夫.带回方块"), p.Tag("pz.渔夫.带方块见幻鬼")); break;
                case "danceFan": title = "完成天香阁步骤，带回残破舞扇"; value = Any(Has("I_06009"), p.Tag("pz.头牌花旦.获得舞扇"), p.Tag("pz.头牌花旦.带回舞扇")); break;
                case "xueTokens": title = "在正道大营收齐小雪的三件大侠信物"; value = Any(HasAll("I_03001", "I_03002", "I_03003"), p.Done("XiaoXue"), p.Tag("ljc.小雪.完成")); break;
                case "towerKey": title = "取得八卦阁楼顶钥匙"; value = Has("K_05008"); break;
                case "heroic": title = "见过剑阵领头人后向狼头领取得破碎的侠胆"; value = Has("I_06006"); break;
                case "fleshLily": title = "完成早期向玉儿交付血肉花"; value = Any(p.Branch("XueRouHua", "S2"), p.Tag("xg.玉儿.给玉儿血肉花"), p.Done("XueRouHua")); break;
                case "pangTreasures": title = "集齐或已交付庞镇四件珍宝"; value = Any(HasAll("T_06001", "T_06002", "T_06004", "T_06005"), p.Branch("MiaoShouKongKong", "4-1")); break;
                case "masks": title = "收齐炎茹、雷婷、蛊鹤、寒岁四张灭法面具"; value = HasAll("K_05003", "K_12001", "K_08001", "K_16001"); break;
                case "loongToken": title = "取得龙形令牌或阴阳两半令牌"; value = Any(Has("K_06005"), HasAll("K_06003", "K_06004")); break;
                case "genHome": title = "完成归途，交回老根头的木梳"; value = p.Done("GuiTu"); break;
                case "brotherFlower": title = "先在黄家大宅取得再会兄长的第一朵花瓣"; value = Has("F_06003"); break;
                case "kinFlower": title = "先在庞镇取得相煎何急的第一朵花瓣"; value = Has("F_06002"); break;
                case "lakeTreasures": title = "集齐或已交付梅谷湖三件珍宝"; value = Any(HasAll("T_08001", "T_06003", "T_08003"), p.Branch("MiaoShouKongKong", "5-1")); break;
                case "leaveNone":
                    title = "在陆家村推进一个不留后回访溪谷";
                    var layers = p.Slot.Get("EventPipeline").Get("LoadedDataLayer") as Row;
                    bool? ready = layers == null ? (bool?)null : layers.Values.SelectMany(v => v is object[] ? v.List() : new[] { v })
                        .Any(v => v.Str().Contains("Monster_YiGeBuLiu_XiGu"));
                    value = Any(p.KnownQuests ? (bool?)p.Started("YiGeBuLiu") : null, ready);
                    break;
                default: title = id; value = null; break;
            }
            return new KeyValuePair<string, bool?>(title, value);
        }
        public Row Route(Row route)
        {
            string quest = route.S("quest"), source = route.S("source");
            if (quest != "" && (p.State(quest) == "failed" || quest == "BuMieXiaDan" && p.Tag("pz.不灭侠胆.任务失败") == true))
                return Result("locked", "存档明确记录相关任务已失败，请核对旧存档或下一周目。", source).With("label", "任务已失效");
            var checks = route.Strings("needs").Select(Check).ToArray();
            string[] blocked = checks.Where(c => c.Value == false).Select(c => c.Key).ToArray();
            string[] unknown = checks.Where(c => !c.Value.HasValue).Select(c => c.Key).ToArray();
            if (blocked.Length != 0) return Result("locked", "尚需：" + string.Join("；", blocked) + "。", source);
            if (unknown.Length != 0) return Result("unknown", "缺少可识别的前置记录：" + string.Join("；", unknown) + "。", source);
            return Result("ready", "已核对的路线门槛均已满足。" + route.S("action"), source);
        }
        public static string Key(Row point) { return point.S("rawMap") + ":" + point.S("kind") + ":" + point.S("id").Or(point.N("order").ToString()); }
        public static Row PointRoute(Row point)
        {
            Row route = Guides.Get("pointRoutes").Get(Key(point)) as Row;
            if (route != null && point.S("rawMap") == "HouJie" && point.S("id") != "Bell_SZ_005" && point.S("id") != "TanLang")
                return route.With("needs", new[] { "backstreet", "wuXuan" }.Concat(route.Strings("needs")).Distinct().ToArray());
            return route;
        }
        public Row ForPoint(Row point, bool regionOpen)
        {
            if (point.S("state") == "done") return Result("done", "该点已计入已收集。");
            if (!regionOpen) return Result("locked", "此子区尚未开放，推进主线后再处理。");
            string map = point.S("rawMap").ToLowerInvariant(), id = point.S("id"), kind = point.S("kind");
            string key = kind + ":" + id.Or(point.N("order").ToString());
            bool nearby = point.Rows("nearest").FirstOrDefault().Flag("activated");
            Row route = PointRoute(point);
            if (route != null) return Route(route);
            if (map == "meigu_yiji") return Route(Data.Make("needs", new[] { "masks" }, "action", "可进入幻术师遗迹。", "source", Source("lake")));
            if (map == "dengdingshandao" && Pipa != true)
                return Gate(Pipa, "先修复幻术琵琶，才能穿过梅谷湖雾门进入枷笼山。", "", Source("mountain"));
            if (map == "fujizhilin" && Ice.Contains(key))
                return Gate(p.Tag("fjzl.风雪数据层.激活"), "需等血色森林冰封后回访杀气塔。", "冰封门槛已满足，可以回访杀气塔。", Source("forest"));
            if (map == "xigu" && (id == "Bell_QingDaoFu" || id == "F_12001"))
                return Gate(Has("K_04902"), "需完成梦差幻境三处传送门，取得人偶舌头。", "可回红房子开门。", Source("valley"));
            if (map == "zhengdaodaying" && Has("K_03002") != true)
                return Gate(Has("K_03002"), "需正道大营外门钥匙打开入口。", "", Source("lu"));
            string condition = point.S("condition");
            if (condition.StartsWith("BPF_BuMieXiaDan_Memory_", StringComparison.Ordinal))
                return Route(Data.Make("needs", new[] { "heroic" }, "action", "持破碎的侠胆，在异变前帮助正道高手解脱并调查花瓣。", "quest", "BuMieXiaDan", "source", Source("camp")));
            if (map == "fujizhilin")
            {
                if (id == "CiGuHunDun")
                {
                    bool? frozen = p.Tag("fjzl.风雪数据层.激活");
                    if (frozen != true) return Gate(frozen, "需后期冰封和三面混沌的镜林战斗。", "", Source("forest"));
                    return p.Tag("fjzl.三头魔偶.激活") == true ? Result("ready", "镜林三面魔偶已激活，继续三面混沌的当前目标。", Source("forest"))
                        : Result("unknown", "冰封已开启，镜林最终战的开启记录尚未确认。", Source("forest"));
                }
                if (id == "F_02021") return Gate(p.Killed("BP_Monster_JingYe"), "先击败荆野，再查战场后方山崖下的尸体附近。", "花瓣在战场后方山崖下。", "https://www.18183.com/gonglue/202610/nlo97vjh.html");
                if (kind == "banyan" && p.Quest("RongShuZhiXin") == null && p.KnownQuests)
                    return Result("locked", "先在血色森林找虚空大人接取榕树之心。", Source("forest"));
                if (kind == "banyan" && p.Started("RongShuZhiXin") && nearby)
                    return Result("ready", "榕树之心已接取，迷雾消散处已到达。", Source("forest"));
                if (kind == "pillar" && nearby && (Progress.BranchActive(p.Quest("XueMaiJueXing"), "1") || p.Tag("lz.龙柱.回忆起特殊杀气") == true))
                    return Result("ready", "血脉觉醒已开启试炼，附近铃铛已激活。", Source("forest"));
            }
            if (map == "lujiacun" && nearby && new[] { "medicine:GuiShen", "accessory:AC_SummonDuration", "amber:4" }.Contains(key))
                return Result("ready", "附近区域已到达，攻略列为首次通行可取。", Source("lu"));
            string actor = point.S("actor"), domain = point.S("domain");
            bool physical = kind == "bell" || (condition == "" || condition == "None") && (actor.Has("Chest") || actor.Has("Rubbish") || domain != "" && domain != "None");
            string source = Guides.Get("physicalRouteSources").S(map);
            return physical && source != "" ? Result("route", "可随本区路线探索，具体通路未逐门确认。", source)
                : Result("unknown", "只确认尚未收集，此点的通路或剧情条件还未核实。");
        }
    }
}
