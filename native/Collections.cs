using System;
using System.Linq;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    internal sealed class Collections
    {
        readonly Progress p;
        readonly CollectionAccess access;
        static readonly Row Guides = Progress.Guides;
        static readonly Row Ranks = Data.Make("xigu", 1, "fujizhilin", 2, "lujiacun", 3, "zhengdaodaying", 3, "pangzhen", 4,
            "houjie", 4, "meiguhu", 5, "meigu_yiji", 5, "dengdingshandao", 6, "ximeng", 7, "duanhunshan", 8, "duanhunya", 8);
        static readonly Row PointNames = Data.Make("amber", "杀气琥珀碎片", "blackstone", "黑石碎片", "banyan", "榕树挑战", "pillar", "龙柱挑战", "scarecrow", "稻草人挑战");
        static readonly Row Aliases = Data.Make("WoodenSword", new[] { "WoodenSwordHun" }, "Tang", new[] { "Tang_HorseCartCombat", "TangPrologue", "HeiMoShangPrologue" });
        static readonly HashSet<string> Ignored = new HashSet<string>(Aliases.Values.SelectMany(v => v.List().OfType<string>())
            .Concat(new[] { "I_060001", "I_000006", "Bell_Item_PlaceHolder", "BaWangLianQiu", "MoShou" }));
        static readonly string[] Deduplicate = { "bell", "weapon", "phantom", "accessory", "medicine" };
        static readonly string[] LocationKinds = { "bell", "banyan", "pillar", "scarecrow", "amber", "blackstone" };
        static readonly Row AccessOrder = Data.Make("ready", 0, "route", 1, "unknown", 2, "locked", 3, "done", 4);
        static readonly Row[] PickupCategories = {
            Data.Make("id", SceneLoot.MoneyCategory, "name", "捡钱点"),
            Data.Make("id", SceneLoot.MaterialCategory, "name", "武器材料点")
        };
        public readonly Row[] Regions, Items, Categories;
        public readonly string CurrentMap, SelectedMap;

        public Collections(Progress progress)
        {
            p = progress;
            access = new CollectionAccess(p);
            Regions = p.Catalog.Maps.Select(Region).ToArray();
            CurrentMap = Regions.FirstOrDefault(m => m.Flag("current")).S("id");
            SelectedMap = CurrentMap.Or(Regions.FirstOrDefault(m => m.Flag("visited")).S("id")).Or(Regions.FirstOrDefault().S("id"));
            Items = BuildItems().Concat(BuildPickupItems()).ToArray();
            Categories = Counts(Guides.Rows("collectibleCategories").Concat(PickupCategories).ToArray(), Items).Where(c => c.N("total") > 0).ToArray();
        }
        public static bool MatchesCategory(Row item, string category)
        {
            return item.S("category") == category || item.Strings("pickupCategories").Contains(category);
        }
        public static double DistanceSquared(int[] a, int[] b)
        {
            double x = (double)a[0] - b[0], y = (double)a[1] - b[1], z = (double)a[2] - b[2];
            return x * x + y * y + z * z;
        }
        bool Open(string map) { return p.Reached(map) || p.Rank >= Ranks.N(map.ToLowerInvariant(), int.MaxValue); }
        static Row[] Counts(Row[] categories, Row[] items)
        {
            return categories.Select(c =>
            {
                Row[] list = items.Where(i => MatchesCategory(i, c.S("id"))).ToArray();
                return c.With("total", list.Length, "done", list.Count(i => i.S("state") == "done"), "unknown", list.Count(i => i.S("state") == "unknown"),
                    "missing", list.Count(i => i.S("state") == "missing"));
            }).ToArray();
        }
        Row Acquisition(Row point)
        {
            Row guide = Guides.Get("collectionGuides").Get(CollectionAccess.Key(point)) as Row;
            if (guide != null) return guide.With("detail", "specific");
            Row route = CollectionAccess.PointRoute(point);
            if (route != null) return Data.Make("steps", new[] { route.S("action") }, "source", route.S("source"), "detail", "specific");
            string id = point.S("id"), kind = point.S("kind");
            var risk = p.Gates.SelectMany(g => g.Rows("items")).FirstOrDefault(r => r.S("item") != "" &&
                r.S("item").Equals(id, StringComparison.OrdinalIgnoreCase) && r.S("category") == kind);
            if (risk != null) return Data.Make("steps", new[] { risk.S("action") }, "source", risk.S("source"), "detail", "specific");
            string actor = point.S("actor"), domain = point.S("domain");
            string step;
            if (kind == "bell") step = "到达后互动激活铃铛。";
            else if (actor.Has("Chest")) step = "检查此点对应的宝箱。";
            else if (actor.Has("Rubbish") || actor.Has("MemoryFlower")) step = "调查此点的场景拾取物。";
            else if (point.S("category") == "challenge") step = "互动并完成" + PointNames.S(kind) + "。";
            else if (domain != "" && domain != "None") step = "完成此点的敌群战斗并领取结算奖励。";
            else if (point.Strings("nodes").Length > 0) step = "此点与剧情、对话或挑战奖励关联，按对应区域任务推进后核对领取。";
            else step = "到点后检查附近拾取物或宝箱，具体触发条件尚待核实。";
            return Data.Make("steps", new[] { step }, "detail", "nearby-bell");
        }
        Row Region(Row region)
        {
            var bells = region.Rows("points").Where(b => b.S("kind") == "bell" && b.Get("position") is int[]).ToArray();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var points = region.Rows("points").Where(pt => !Deduplicate.Contains(pt.S("kind")) || seen.Add(pt.S("kind") + ":" + pt.S("id")))
                .Select(point =>
                {
                    string state = CollectionState.Detect(point, p.Slot), kind = point.S("kind"), name = point.S("name");
                    if (point.S("condition").StartsWith("BPF_BuMieXiaDan_Memory_", StringComparison.Ordinal))
                        name = p.Catalog.Item("goods", point.S("id")).S("name").Or(name);
                    int[] position = point.Get("position") as int[];
                    var nearest = position == null ? new Row[0] : bells.Where(b => b.S("key") != point.S("key") && b.S("rawMap").Equals(point.S("rawMap"), StringComparison.OrdinalIgnoreCase))
                        .Select(b =>
                        {
                            int[] target = (int[])b["position"];
                            double meters = Math.Sqrt(DistanceSquared(target, position)) / 100;
                            return Data.Make("id", b.S("id"), "name", b.S("name"), "distance", (int)Math.Floor(meters + 0.5),
                                "activated", CollectionState.Detect(b, p.Slot) == "done");
                        }).OrderBy(b => b.N("distance")).Take(3).ToArray();
                    var pt = point.With("state", state, "name", name.Or(PointNames.S(kind)).Or("未识别收集点"), "nearest", nearest,
                        "guide", Acquisition(point), "regionId", region.S("id"), "regionName", region.S("name"));
                    pt["access"] = access.ForPoint(pt, Open(point.S("rawMap")));
                    return pt;
                }).ToArray();
            var counts = Counts(Guides.Rows("collectionCategories"), points);
            int total = counts.Sum(c => c.N("total")), done = counts.Sum(c => c.N("done")), unknown = counts.Sum(c => c.N("unknown"));
            bool visited = region.Strings("members").Any(p.Reached);
            return region.With("points", points, "categories", counts, "total", total, "done", done, "unknown", unknown,
                "percentage", unknown > 0 || total == 0 ? (int?)null : done * 100 / total,
                "available", visited || Open(region.S("id")), "visited", visited,
                "current", region.Strings("members").Any(id => p.Location.Has(id)));
        }
        static string Key(string category, string id) { return category + ":" + id.ToLowerInvariant(); }
        static string GoodsCategory(string id)
        {
            if (Regex.IsMatch(id, "^R_|^Page_")) return "book";
            if (Regex.IsMatch(id, "^FS?_")) return "petal";
            if (id.StartsWith("FA_")) return "flower";
            if (id.StartsWith("T_")) return "treasure";
            if (id.StartsWith("TU_")) return "soul";
            if (id.StartsWith("K_")) return "key";
            if (id.StartsWith("I_")) return "quest";
            if (id.StartsWith("AC_")) return "part";
            return Regex.IsMatch(id, "^(Weapon_Material|Ac_Material|Medi_Material)_") ? "material" : "";
        }
        Row[] BuildItems()
        {
            var rows = new Dictionary<string, Row>();
            var mapped = Regions.SelectMany(r => r.Rows("points")).GroupBy(point =>
            {
                string kind = point.S("kind"), id = point.S("id");
                return id == "" ? "point:" + point.S("key") : Key(kind == "flower" ? "goods" : kind, id);
            }).ToDictionary(g => g.Key, g => g.ToArray());
            foreach (Row item in p.Catalog.Items)
            {
                string category = item.S("category"), id = item.S("id"), key = Key(category, id);
                if (Ignored.Contains(id)) continue;
                Row[] origins;
                if (!mapped.TryGetValue(key, out origins)) origins = new Row[0];
                string group = category == "goods" ? GoodsCategory(id) : category;
                if (group == "" || origins.Length == 0 && !Regex.IsMatch(item.S("name"), @"[\u4e00-\u9fff]")) continue;
                string[] states = new[] { id }.Concat(Aliases.Strings(id)).Select(value =>
                    CollectionState.Detect(Data.Make("kind", category == "goods" ? "flower" : category, "id", value), p.Slot)).ToArray();
                string state = states.Contains("done") ? "done" : states.Contains("unknown") ? "unknown" : states[0];
                string subtitle = origins.Any(pt => pt.S("condition").StartsWith("BPF_BuMieXiaDan_Memory_", StringComparison.Ordinal))
                    ? p.Catalog.Item("goods", "FA_0604").S("name") : item.S("rowName") == item.S("name") ? "" : item.S("rowName");
                rows[key] = item.With("key", key, "category", group, "inventoryCategory", category, "state", state, "origins", origins, "subtitle", subtitle);
            }
            foreach (var pair in mapped)
            {
                if (rows.ContainsKey(pair.Key)) continue;
                Row point = pair.Value[0];
                string kind = point.S("kind");
                if (!LocationKinds.Contains(kind)) continue;
                string[] states = pair.Value.Select(pt => pt.S("state")).ToArray();
                rows[pair.Key] = Data.Make("key", pair.Key, "id", point.S("id"), "name", point.S("name"), "origins", pair.Value, "category",
                    point.S("category"), "state", states.Contains("done") ? "done" : states.Contains("unknown") ? "unknown" : states[0]);
            }
            Row[] rules = p.Gates.SelectMany(g => g.Rows("items").Where(i => i.S("check") == "item").Select(i => i.With("gateName", g.S("name")))).ToArray();
            return rows.Values.Select(row =>
            {
                string id = row.S("id"), category = row.S("category");
                Row treasure = category == "treasure" ? p.Treasures.FirstOrDefault(t => t.Strings("ids").Contains(id)) : null;
                Row book = category == "book" ? Guides.Get("books").Get(id) as Row : null;
                Row[] origins = row.Rows("origins");
                Row origin = origins.OrderBy(pt => AccessOrder.N(pt.Get("access").S("state"))).FirstOrDefault();
                Row rule = rules.Where(r => r.S("item").Equals(id, StringComparison.OrdinalIgnoreCase) && r.S("category") == row.S("inventoryCategory"))
                    .OrderByDescending(r => r.Flag("available")).FirstOrDefault();
                Row guide = origin.Get("guide").Dict();
                Row route = origin.Get("access") as Row ?? CollectionAccess.Result("unknown", "现有资料未能确认具体获取地点或解锁条件。");
                int bookRank = book.N("minRank", book.N("rank", int.MaxValue));
                if (origin == null && book != null)
                {
                    guide = book;
                    route = p.Rank < bookRank && bookRank != int.MaxValue
                        ? CollectionAccess.Result("locked", book.S("reason").Or("所属地区为" + book.S("regionName") + "，当前阶段尚未开放。"))
                        : book.Strings("steps").Length > 0 ? CollectionAccess.Result("route", "下方列出可核实的路线。")
                        : CollectionAccess.Result("unknown", "书籍索引确认所属地区为" + book.S("regionName") + "，具体拾取路线待核实。");
                }
                else if (origin == null && rule != null)
                {
                    route = CollectionAccess.Result(rule.Flag("available") ? "route" : "locked", "对应节点：" + rule.S("gateName"));
                    guide = Data.Make("steps", new[] { rule.S("action") }, "source", rule.S("source"));
                }
                else if (origin == null && treasure != null)
                {
                    route = CollectionAccess.Result(p.Rank >= p.TreasureRank(treasure.S("branch")) ? "route" : "locked", "属于" + treasure.S("name") + "的小张珍宝清单。");
                    guide = Data.Make("steps", new[] { "在" + treasure.S("name") + "寻找" + row.S("name") + "，集齐后交给小张。" },
                        "source", Guides.Get("sources").Get("trophies").S("url"));
                }
                if (treasure.Flag("handedIn")) row["state"] = "done";
                if (row.S("state") == "done") route = CollectionAccess.Result("done", treasure.Flag("handedIn") ? "本周目对应地区的珍宝已交付。" : "已记录本周目收集。");
                string[] regionIds = origins.Select(pt => pt.S("regionId")).Concat(new[] { book.S("regionId") }).Where(s => s != "").Distinct().ToArray();
                string[] regionNames = origins.Select(pt => pt.S("regionName")).Concat(new[] { book.S("regionName") }).Where(s => s != "").Distinct().ToArray();
                string routeState = route.S("state");
                bool available = routeState == "ready" || routeState == "route" || routeState == "unknown" &&
                    (Regions.Any(r => regionIds.Contains(r.S("id")) && r.Flag("available")) || book != null && p.Rank >= bookRank);
                string[] steps = guide.Strings("steps");
                if (category == "flower" && steps.Length == 0) steps = new[] { "收齐对应记忆花瓣，再合成完整记忆之花。" };
                return row.With("access", route, "guide", guide, "steps", steps, "regionIds", regionIds, "regionNames", regionNames,
                    "bell", guide.S("bell").Or(origin.Rows("nearest").FirstOrDefault().S("name")), "available", available);
            }).ToArray();
        }

        IEnumerable<Row> BuildPickupItems()
        {
            var records = p.Slot.Get("LevelActorManager") as Row;
            var actors = records == null ? null : new Row(records, StringComparer.OrdinalIgnoreCase);
            var mapByMember = Regions.SelectMany(region => region.Strings("members").Select(member => new { member, region }))
                .ToDictionary(pair => pair.member, pair => pair.region, StringComparer.OrdinalIgnoreCase);
            var points = Regions.SelectMany(region => region.Rows("points")).ToArray();
            var bells = points.Where(point => point.S("kind") == "bell" && point.Get("position") is int[])
                .ToLookup(point => point.S("rawMap"), StringComparer.OrdinalIgnoreCase);
            var mappedActors = points.Where(point => point.S("actor") != "")
                .ToLookup(point => point.S("actor"), StringComparer.OrdinalIgnoreCase);
            foreach (Row point in p.Catalog.ScenePickups)
            {
                string map = point.S("rawMap"), type = point.S("pickupType");
                Row region;
                if (!mapByMember.TryGetValue(map, out region)) continue;
                string state = SceneLoot.State(point, actors);
                bool open = Open(map);
                int[] position = (int[])point["position"];
                Row[] nearest = bells[map].Select(bell =>
                    Data.Make("name", bell.S("name"), "activated", bell.S("state") == "done",
                        "distance", (int)Math.Floor(Math.Sqrt(DistanceSquared(position, (int[])bell["position"])) / 100 + 0.5)))
                    .OrderBy(bell => bell.N("distance")).Take(3).ToArray();
                string entryBell = nearest.Length == 0 && map.Equals("MeiGu_YiJi", StringComparison.OrdinalIgnoreCase)
                    ? p.Catalog.Local("Bell_LYZ_011").Or("护法四像镜") : "";
                Row existing = mappedActors[point.S("actor")].FirstOrDefault();
                Row route = access.ForPickup(point, state, open, existing);
                long? moneySort;
                string money = SceneLoot.Money(point, p.Cycle, out moneySort);
                string materials = SceneLoot.Materials(point);
                string description = "";
                if (type == "吊挂物" && state == "unknown")
                    description = "存档无法仅凭击落状态确认落地物品是否已拾取。";
                string step = type == "宝箱" ? "找到并打开此宝箱。" : type == "吊挂物" ? "击落吊挂物后检查落地的物品。" : "检查并拾取该处的场景物品。";
                if (entryBell != "") step = "从护法四像镜进入幻术师遗迹后，" + step;
                string regionName = region.S("name");
                if (!map.Equals(region.S("id"), StringComparison.OrdinalIgnoreCase))
                    regionName = Guides.Get("navigationMaps").Get(map).List().FirstOrDefault().Str().Or(regionName);
                yield return point.With("id", point.S("actor"), "category", point.Strings("pickupCategories")[0], "state", state,
                    "name", type, "moneyText", money, "moneySort", moneySort, "materialsText", materials, "description", description,
                    "access", route, "available", open && route.S("state") != "locked",
                    "nearest", nearest, "bell", entryBell == "" ? nearest.FirstOrDefault().S("name") : entryBell + "（入口）", "steps", new[] { step },
                    "regionIds", new[] { region.S("id") }, "regionNames", new[] { regionName });
            }
        }
    }
}
