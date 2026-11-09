using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    internal sealed class QuestNavigation
    {
        static readonly Row Guides = Progress.Guides;
        static readonly Row Maps = Guides.Get("navigationMaps").Dict();
        static readonly Row Definitions = Guides.Get("navigationDefinitions").Dict();
        static readonly Row Offers = Guides.Get("questOffers").Dict();
        static readonly Row TreasureMaps = Data.Make("1", new[] { "FuJiZhiLin", "fjzl" }, "3", new[] { "LuJiaCun", "ljc" },
            "4", new[] { "HouJie", "pz" }, "5", new[] { "MeiGuHu", "mgxl" }, "6", new[] { "XiMeng", "xsd" });
        static readonly string[][] Explicit = {
            new[] { "梅谷湖", "MeiGuHu" }, new[] { "庞镇后街", "HouJie" }, new[] { "正道大营", "ZhengDaoDaYing" },
            new[] { "枷笼山", "DengDingShanDao" }, new[] { "戏梦山庄", "XiMeng" }, new[] { "血色森林", "FuJiZhiLin" },
            new[] { "悲泣溪谷", "XiGu" }, new[] { "陆家村", "LuJiaCun" }, new[] { "庞镇", "PangZhen" }, new[] { "断魂", "DuanHunYa" }
        };
        readonly Progress p;
        readonly CollectionAccess access;
        readonly Row[] points;
        readonly HashSet<string> bells;
        public readonly Row[] Quests;
        public QuestNavigation(Progress progress, Collections collections)
        {
            p = progress;
            access = new CollectionAccess(p);
            points = collections.Regions.SelectMany(r => r.Rows("points")).ToArray();
            bells = new HashSet<string>(p.Slot.Get("BellManager").Strings("ActivateBellIDs"));
            Quests = p.Quests.Select(Build).ToArray();
        }
        static Row Target(string map, string person) { return Data.Make("map", map, "person", person); }
        static string Bell(Row point) { return point.Rows("nearest").FirstOrDefault().S("name").Or(point.S("regionName")); }
        IEnumerable<Row> ForBranch(Row quest, Row branch)
        {
            string q = quest.S("id"), id = branch.S("id");
            string key = q + ":" + id;
            if (q == "KunLunSanJie" && p.Acquired("K_03002") != true && quest.Rows("branches").Any(b => b.Flag("active") && b.S("id") == "S3"))
                return id == "S3" ? Definitions.Rows(key) : new Row[0];
            if (q == "KunLunSanJie" && id == "S3" && p.Acquired("K_03002") == true)
                return new[] { Target("ZhengDaoDaYing", "已取得外门钥匙，返回正道大营开门") };
            if (q == "BuMieXiaDan")
            {
                if (id == "S1")
                {
                    bool met = p.Tags.Contains("zddy.击杀.剑阵2") || p.Tags.Contains("zddy.剑阵.完成任务");
                    return new[] { met ? Target("PangZhen", "狼头领·“组织”酒馆，领取破碎的侠胆")
                        : Target("ZhengDaoDaYing", "七星剑阵领头人·先完成剑阵再回酒馆").With("next", "完成后回庞镇“组织”酒馆找狼头领。") };
                }
                return Guides.Rows("chivalryEncounters").Select((e, i) =>
                {
                    var point = points.FirstOrDefault(pt => pt.S("id") == e.S("id") && pt.S("rawMap") == e.S("map"));
                    if (point == null || point.S("state") == "done") return null;
                    string goal = p.Tags.Contains("pz.不灭侠胆.帮助正道解脱" + (i + 1)) ? "已解脱，回访花瓣" : e.S("name");
                    return Target(e.S("map"), goal + "·" + point.S("name")).With("point", point, "bell", e.S("bell"), "next", e.S("route"), "source", point.Get("guide").S("source"));
                }).Where(t => t != null);
            }
            if (new[] { "RongShuZhiXin", "XueMaiJueXing", "LongZhu", "WuShiZunZhu", "ZhengYiMengChen" }.Contains(q) || q == "HuXinMiMi" && id == "S4")
            {
                string kind = q == "RongShuZhiXin" ? "banyan" : q == "XueMaiJueXing" || q == "LongZhu" ? "pillar" : q == "HuXinMiMi" ? "scarecrow" : "flower";
                string pattern = q == "WuShiZunZhu" ? "舞狮尊主" : "荒行子";
                return points.Where(pt => Maps.ContainsKey(pt.S("rawMap")) && pt.S("kind") == kind && pt.S("state") != "done" &&
                    (kind != "flower" || (pt.S("name") + " " + p.Catalog.Item("goods", pt.S("id")).S("rowName")).Contains(pattern)))
                    .Select(pt => Target(pt.S("rawMap"), (kind == "scarecrow" ? "灭法之法" : pt.S("name")) + "·" + Bell(pt)).With("point", pt));
            }
            if (q == "HuanShuPiPa" && id == "1")
            {
                string[][] parts = { new[] { "I_05001", "LuJiaCun", "幻术琵琶琴头" }, new[] { "I_04001", "ZhengDaoDaYing", "幻术琵琶背板" },
                    new[] { "I_08002", "MeiGuHu", "幻术琵琶琴弦" } };
                var missing = parts.Where(part => p.Acquired(part[0]) != true).Select(part => Target(part[1], part[2])).ToArray();
                return missing.Length > 0 ? missing : new[] { Target("PangZhen", "幻鬼·三件已齐，可回酒馆修复") };
            }
            if (q == "RenOuZhongShu")
            {
                string[][] portals = { new[] { "LuJiaCun", "rozs.人偶中枢.从陆家村梦差密室到达人偶中枢", "陆家村梦差密室·传送门" },
                    new[] { "ZhengDaoDaYing", "rozs.人偶中枢.从绝命坑道梦差密室到达人偶中枢", "绝命坑道／玉璧·传送门" },
                    new[] { "DengDingShanDao", "rozs.人偶中枢.从弦者人偶囚室到达人偶中枢", "弦者人偶囚室·传送门" } };
                return portals.Where(t => !p.Tags.Contains(t[1])).Select(t => Target(t[0], t[2]).With("source", "https://www.gamersky.com/handbook/202611/2240383.shtml"));
            }
            if (q == "MiaoShouKongKong")
            {
                var group = p.Treasures.FirstOrDefault(g => g.S("branch").Split('-')[0] == id.Split('-')[0]);
                if (group == null || group.Flag("handedIn")) return new Row[0];
                var missing = group.Rows("items").Where(i => !i.Flag("owned")).ToArray();
                string map = TreasureMaps.Strings(group.S("branch").Split('-')[0])[0];
                return new[] { Target(map, missing.Length == 0 ? "妙手小张·珍宝已收齐，待交付" : "待找珍宝：" + string.Join("、", missing.Select(i => i.S("name"))))
                    .With("next", "本地区已收集 " + (group.Rows("items").Length - missing.Length) + "/" + group.Rows("items").Length + "，集齐后回本区小张处交付。") };
            }
            if (q == "JiaoTuSanKu")
            {
                return p.Treasures.Where(g => (id == "1") == (g.S("branch") == "1-1") && !g.Flag("handedIn"))
                    .Select(g => TreasureMaps.Strings(g.S("branch").Split('-')[0])).Where(m => !p.Tags.Contains(m[1] + ".藏身处小张.第一次对话之后"))
                    .Select(m => Target(m[0], "妙手小张分身·本地区藏身处"));
            }
            if (Definitions.ContainsKey(key)) return Definitions.Rows(key);
            string objective = branch.S("objective");
            var explicitMap = Explicit.FirstOrDefault(t => objective.Contains(t[0]));
            return new[] { explicitMap == null ? Target("", "目标人物或触发地区尚未定位") : Target(explicitMap[1], objective).With("inferred", true) };
        }
        Row Resolve(Row target, Row branch)
        {
            string map = target.S("map");
            object[] info = Maps.Get(map).List();
            string area = info.Length == 0 ? "目标地区待定位" : info[0].Str();
            string group = info.Length == 0 ? "unknown" : info[2].Str();
            bool visited = map != "" && p.StageInfo.Strings("regions").Any(r => r.Has(map));
            bool future = info.Length != 0 && p.Rank < info[1].Int() && !visited;
            Row route;
            if (info.Length == 0) route = CollectionAccess.Result("unknown", "活动目标中没有足够的目的地信息。").With("label", "地点待核实");
            else if (future) route = CollectionAccess.Result("locked", "目标在" + area + "，当前尚未推进或到达该区域。").With("label", "后续地区");
            else route = target.Get("point").Get("access") as Row ?? CollectionAccess.Result("route", "按当前活动目标寻找人物或触发点。");
            var checks = new List<KeyValuePair<bool?, string>>();
            if (map == "ZhengDaoDaYing" && !visited) checks.Add(new KeyValuePair<bool?, string>(p.Acquired("K_03002"), "先取得正道大营外门钥匙。"));
            if (map == "DengDingShanDao") checks.Add(new KeyValuePair<bool?, string>(access.Pipa == true, "先修复幻术琵琶才能通过雾门。"));
            if (target.Flag("ice")) checks.Add(new KeyValuePair<bool?, string>(p.Tag("fjzl.风雪数据层.激活"), "需等血色森林冰封后回访。"));
            foreach (string id in target.Strings("goods")) checks.Add(new KeyValuePair<bool?, string>(p.Acquired(id), target.S("needText")));
            if (target.Strings("needs").Length > 0 && !future)
            {
                var gate = access.Route(target.With("action", "前往此人物或触发点继续当前目标。"));
                if (gate.S("state") != "ready") route = gate;
                else if (target.Get("point") == null) route = gate.With("state", "route", "label", "已知前置满足");
            }
            string[] blocked = checks.Where(c => c.Key == false).Select(c => c.Value).Distinct().ToArray();
            string[] unknown = checks.Where(c => !c.Key.HasValue).Select(c => c.Value).ToArray();
            if (blocked.Length > 0) route = CollectionAccess.Result("locked", string.Join(" ", blocked)).With("label", "暂时无法触发");
            else if (unknown.Length > 0 && route.S("state") != "locked") route = CollectionAccess.Result("unknown", string.Join(" ", unknown)).With("label", "前置记录待核实");
            else if (target.Flag("verify") && route.S("state") != "locked") route = CollectionAccess.Result("unknown", target.S("evidence")).With("label", "领取待核对");
            string mapName = Maps.Get(group).List().FirstOrDefault().Str().Or(area);
            return Data.Make("mapId", group, "mapName", mapName, "area", area, "person", target.S("person"), "branchId", branch.S("id"),
                "objective", branch.S("objective"), "details", branch.S("details"), "access", route, "future", future, "next", target.S("next"),
                "pointKey", target.Get("point").S("key"),
                "bell", target.S("bell").Or(target.Get("point").Rows("nearest").FirstOrDefault().S("name")),
                "source", target.S("source").Or(route.S("source")).Or("https://www.gamersky.com/handbook/202610/2236093.shtml"));
        }
        Row FindOffer(Row quest)
        {
            if (!p.KnownQuests || quest.Flag("recorded") || quest.S("state") != "missing") return null;
            return Offers.Rows(quest.S("id")).FirstOrDefault(offer =>
            {
                string map = offer.S("map");
                if (p.Rank < Maps.Get(map).List()[1].Int() && !p.Reached(map)) return false;
                var anchors = offer.Strings("anchors");
                if (!(anchors.Length == 0 ? bells.Contains(offer.S("bellId")) : anchors.Any(bells.Contains))) return false;
                if (offer.Strings("tags").Any(tag => p.Tag(tag) != true) || offer.Strings("cutoffs").Any(tag => p.Tag(tag) != false)) return false;
                if (offer.Strings("before").Any(id => !p.Gates.Any(g => g.S("id") == id && Equals(g.Get("passed"), false)))) return false;
                if (offer.S("snowStep") != "" && p.BaiXueStep.S("id") != offer.S("snowStep")) return false;
                if (offer.S("weapon") != "" && p.Acquired(offer.S("weapon"), "weapon", true) != true) return false;
                return offer.Strings("needs").Length == 0 || access.Route(offer).S("state") == "ready";
            });
        }
        Row ResolveOffer(Row offer)
        {
            var map = Maps.Get(offer.S("map")).List();
            string area = map[0].Str(), group = map[2].Str();
            return Data.Make("mapId", group, "mapName", Maps.Get(group).List().FirstOrDefault().Str().Or(area), "area", area,
                "person", offer.S("person"), "place", offer.S("place"), "bell", p.Catalog.Local(offer.S("bellId")), "next", offer.S("action"),
                "warning", offer.S("warning"), "source", offer.S("source"),
                "access", CollectionAccess.Result("ready", "已核对接取点附近的到达记录及已知前置。").With("label", "可接取"));
        }
        Row Build(Row quest)
        {
            string state = quest.S("state"), id = quest.S("id");
            var failure = quest.Get("failure");
            Row[] active = quest.Rows("branches").Where(b => b.Flag("active")).ToArray();
            Row defs = quest.Get("definitions").Dict();
            // JavaScript's Object.keys puts array-index keys before other keys.
            string first = id == "MoJiaoZhiNv" ? "S1" : defs.Keys.OrderBy(key =>
            {
                uint number;
                return uint.TryParse(key, out number) && number.ToString() == key ? number : uint.MaxValue;
            }).FirstOrDefault() ?? "";
            Row[] branches = state == "done" ? new Row[0] : active.Length > 0 ? active : first != "" ? new[] { defs.Get(first).Dict().With("id", first) } : new Row[0];
            bool snowChain = id == "BaiXue" || id == "YongShengDaoZhu";
            var step = p.BaiXueStep;
            bool snowTarget = snowChain && step.S("quest") == id && step.S("map") != "" && failure == null;
            bool snowStart = state == "missing" && (step.S("id") == "start" || step.S("id") == "puppet");
            Row offer = FindOffer(quest);
            var targets = new List<Row>();
            if (offer != null)
                targets.Add(ResolveOffer(offer));
            else if (snowTarget)
                targets.Add(Resolve(step.With("next", step.S("action")), Data.Make("id", step.S("branch"), "objective", step.S("title"))));
            else if (!snowChain || failure != null)
                targets.AddRange(branches.SelectMany(branch => ForBranch(quest, branch).Select(t => Resolve(t, branch))));
            if (targets.Count == 0 && (!snowChain || failure != null) && state != "done" && id != "JiaoTuSanKu" && id != "MiaoShouKongKong")
                targets.Add(Resolve(Target("", "尚无可定位的活动步骤"), branches.FirstOrDefault()));
            foreach (Row target in targets)
            {
                if (failure != null) target["access"] = CollectionAccess.Result("locked", failure.S("reason")).With("label", "任务" + quest.S("stateLabel"));
                else if (state == "unknown") target["access"] = CollectionAccess.Result("unknown", "任务状态枚举尚未识别。").With("label", "任务状态待核实");
            }
            Row[] risks = state == "done" || failure != null ? new Row[0] : p.Gates.Where(g => !g.Flag("planning"))
                .SelectMany(g => g.Rows("items").Where(i => !i.Flag("satisfied") && (i.S("quest") == id ||
                    id == "MiaoShouKongKong" && g.S("id") == "opera" && active.Any(b => b.S("id") == "6" || b.S("id") == "6-1")))
                    .Select(i => i.With("gateName", g.S("name"), "gateId", g.S("id"),
                        "level", g.Flag("passed") ? "urgent" : i.Flag("available") ? "warning" : "future"))).ToArray();
            string label = quest.S("stateLabel");
            if (offer != null) label = "未接取";
            else if (snowTarget && state == "missing" && !snowStart) label = "路线可继续";
            return quest.With("targets", targets.ToArray(), "risks", risks, "canAccept", offer != null,
                "predicted", offer == null && active.Length == 0 && state != "done",
                "actionable", snowTarget && !snowStart && p.Gates.Any(g => g.S("id") == "mountain" && g.Flag("available")), "stateLabel", label,
                "riskLevel", failure != null || risks.Any(r => r.S("level") == "urgent") ? "urgent"
                    : offer.S("warning") != "" || risks.Any(r => r.S("level") == "warning") ? "warning" : risks.Length > 0 ? "future" : "none");
        }
    }
}
