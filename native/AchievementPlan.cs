using System;
using System.Collections.Generic;
using System.Linq;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    internal sealed class AchievementPlan
    {
        readonly Progress p;
        readonly Collections collections;
        readonly QuestNavigation navigation;
        readonly CollectionAccess access;
        static readonly Row Plans = Progress.Guides.Get("achievementPlans").Dict();
        static readonly Row Maps = Progress.Guides.Get("navigationMaps").Dict();
        public readonly Row[] Rows;

        public AchievementPlan(Progress progress, Collections c, QuestNavigation n)
        {
            p = progress;
            collections = c;
            navigation = n;
            access = new CollectionAccess(p);
            Rows = p.Achievements.Select(Build).ToArray();
        }

        bool MapOpen(string map)
        {
            if (map == "" || p.Reached(map)) return true;
            if (map == "ZhengDaoDaYing") return p.Acquired("K_03002") == true;
            if (map == "XiMeng") return p.Rank >= 7 || p.StageInfo.Flag("readyForEstate");
            object[] info = Maps.Get(map).List();
            return info.Length > 1 && p.Rank >= info[1].Int();
        }
        static string MapName(string map) { return Maps.Get(map).List().FirstOrDefault().Str().Or(map); }
        static Row Check(bool? met, string text) { return Data.Make("met", met, "text", text); }
        Row Collectible(string category, string id)
        {
            return collections.Items.FirstOrDefault(i => i.S("inventoryCategory") == category && i.S("id").Equals(id, StringComparison.OrdinalIgnoreCase));
        }
        Row[] LinkedRisks(string id)
        {
            return p.Gates.SelectMany(g => g.Rows("items")
                .Where(i => !i.Flag("satisfied") && (i.Strings("achievements").Contains(id) || i.S("achievement") == id))
                .Select(i => i.With("gateName", g.S("name"), "gateId", g.S("id"), "passed", g.Flag("passed"))))
                .ToArray();
        }
        Row Build(Row achievement)
        {
            string id = achievement.S("id");
            Row plan = Plans.Get(id) as Row;
            var checks = new List<Row>();
            var notes = new List<string>();
            string[] quests = plan.Strings("quests");
            Row equipment = achievement.Get("equipment") as Row;
            bool owned = equipment.Flag("owned");
            bool tasksDone = quests.Length > 0 && quests.All(q => p.State(q) == "done");
            string map = plan.S("map"), requirement = "";
            var objectives = p.ReadObjectives(Progress.Guides.Get("achievementObjectives").Rows(id)).ToList();
            if (equipment != null)
                objectives.Insert(0, Progress.Objective(equipment.S("name"), equipment.Flag("known") ? (bool?)owned : null));
            if (id == "ACH_039")
                objectives.AddRange(navigation.Quests.FirstOrDefault(q => q.S("id") == "MiaoShouKongKong").Rows("objectives"));

            if (plan == null) checks.Add(Check(null, "当前版本还没有此项的前置规则。"));
            // Inherited equipment is usable now; acquisition-area gates no longer apply.
            if (!owned && !tasksDone)
            {
                if (map != "")
                {
                    bool open = MapOpen(map);
                    checks.Add(Check(open, open ? "已到达或主线已开放：" + MapName(map) + "。"
                        : map == "ZhengDaoDaYing" ? "尚未到达正道大营，也没有外门钥匙；先在陆家村推进昆仑三杰。"
                        : "尚未到达或推进至" + MapName(map) + "；当前为" + p.StageInfo.S("name") + "。"));
                    if (open && map == "DengDingShanDao" && !p.Reached(map))
                        checks.Add(Check(access.Pipa, "需先修复幻术琵琶，才能穿过梅谷湖雾门前往枷笼山。"));
                }
                if (plan.Strings("needs").Length > 0)
                {
                    Row route = access.Route(plan);
                    checks.Add(Check(route.S("state") == "unknown" ? (bool?)null : route.S("state") != "locked", route.S("reason")));
                }
                foreach (string goods in plan.Strings("goods"))
                {
                    bool? got = p.Acquired(goods);
                    string name = p.Catalog.Item("goods", goods).S("name").Or(goods);
                    checks.Add(Check(got, (got == true ? "已取得" : "尚需取得") + name + "。"));
                }
                if (plan.Flag("ice"))
                    checks.Add(Check(p.Tag("fjzl.风雪数据层.激活"), "需在血色森林冰封后回访；以所选槽位的冰封事件记录判断。"));
                if (plan.Flag("bloodline"))
                {
                    bool done = p.Done("XueMaiJueXing") == true || Enumerable.Range(1, 5).All(i => p.Tag("lz.龙柱.龙柱结算" + i) == true);
                    checks.Add(Check(done, "需完成五次龙柱试炼，取得暗魔天堡面具，再为黑伤铸魂得到黑魔伤。"));
                }
                if (equipment != null)
                {
                    if (!equipment.Flag("known")) checks.Add(Check(null, "存档缺少可识别的对应装备表，尚不能确认是否持有" + equipment.S("name") + "。"));
                    Row item = Collectible(equipment.S("category"), equipment.S("id"));
                    if (MapOpen(map) && item.Get("access").S("state") == "locked") checks.Add(Check(false, item.Get("access").S("reason")));
                    string acquisition = plan.S("acquire");
                    string bell = item.S("bell");
                    if (bell != "") acquisition += " 附近铃铛：" + bell + "。";
                    requirement = "先取得" + equipment.S("name");
                    notes.Add("所选槽位尚未持有" + equipment.S("name") + "。" + acquisition);
                }
            }
            if (equipment != null && owned)
            {
                string kind = equipment.S("category");
                Row record = p.ItemRecord(kind, equipment.S("id"));
                int level = record.N(kind == "phantom" ? "ShaChiWeaponLevel" : "WeaponLevel", 1);
                notes.Add("已持有" + equipment.S("name") + "，当前 " + level + " 级。");
                requirement = plan.S("skill").Or(achievement.S("description"));
            }

            foreach (string questId in quests)
            {
                string state = p.State(questId), name = p.Catalog.Quests.FirstOrDefault(q => q.S("id") == questId).S("name").Or(questId);
                Row quest = navigation.Quests.FirstOrDefault(q => q.S("id") == questId);
                notes.Add(name + "：" + (state == "done" ? "已完成" : state == "failed" ? "已失败" : state == "active" ? "进行中" : state == "missing" ? "尚未接取" : "状态待核实") + "。");
                if (state == "failed" && !owned) checks.Add(Check(false, "任务「" + name + "」已失败，本周目无法按这条路线完成；需旧存档或下一周目。"));
                else if (plan.Flag("finishQuests")) checks.Add(Check(state == "done", "终局前需完成「" + name + "」。"));
                Row[] targets = quest.Rows("targets");
                if (!owned && state == "active" && targets.Length > 0 && targets.All(t => t.Get("access").S("state") == "locked"))
                    foreach (string blocker in targets.Select(t => t.Get("access").S("reason")).Distinct()) checks.Add(Check(false, blocker));
                foreach (Row target in targets)
                    notes.Add("当前任务目标：" + target.S("area") + " · " + target.S("person") + "。" + target.Get("access").S("reason"));
            }
            if (tasksDone && !owned) notes.Add("所选槽位的关联任务已完成；尚未记录成就解锁时，请回游戏检查结算并保存。");

            if (plan.Flag("forge") && !owned)
            {
                bool forge = p.Tag("func.新手引导.铸魂") == true || p.Tag("pz.毕狄.已铸魂") == true ||
                    new[] { "weapon", "phantom" }.Any(kind => p.Inventory(kind).Dict().Values.Any(r => r.Flag("AlreadySnapSoul") || r.N("AlreadySnapSoul") > 0));
                if (!forge && !MapOpen("PangZhen")) checks.Add(Check(false, "铸魂功能尚未开启；需到庞镇找毕狄推进相关教学。"));
                notes.Add(forge ? "存档已记录铸魂教学或装备铸魂。" : "尚无铸魂开启记录，先到庞镇找毕狄；专属铸魂材料见全收集品。");
            }
            if (plan.Flag("ribbons") && !owned)
            {
                if (p.KnownTags) notes.Add("本周目少主丝带 " + Enumerable.Range(1, 5).Count(i => p.Tag("ljc.沐小葵.获得丝带" + i) == true) + "/5。");
                if (p.StageInfo.Flag("afterMu")) checks.Add(Check(false, "已越过沐小葵战，所选槽位没有妖锯；隐藏奖励可能已错过，需核对战前旧存档或下一周目。"));
            }
            if (plan.Strings("summons").Length > 0)
            {
                string[] summons = plan.Strings("summons");
                string[] held = summons.Where(s => p.ItemRecord("phantom", s) != null).Select(s => p.Catalog.Item("phantom", s).S("name")).ToArray();
                if (held.Length > 0)
                {
                    requirement = "使用" + string.Join("／", held);
                    notes.Add("已持有可召唤武装：" + string.Join("、", held) + "。");
                }
                else
                {
                    bool reachable = summons.Select(s => Collectible("phantom", s)).Any(i => i.Flag("available"));
                    checks.Add(Check(reachable, "尚未持有召唤类影之武装；可先在陆家村取得苦叶寺珠串或操偶铃铛，或在正道大营取得剑客召集令。"));
                    requirement = "先取得任一召唤类影之武装";
                }
            }
            if (id == "ACH_039")
                foreach (Row group in p.Treasures.Where(t => !t.Flag("handedIn")))
                    notes.Add(group.S("name") + "：" + (group.Flag("collected") ? "已收齐，待交付" : "缺少" + string.Join("、", group.Rows("items").Where(i => !i.Flag("owned")).Select(i => i.S("name")))) + "。");
            if (plan.Flag("all"))
            {
                Row[] pending = p.Achievements.Where(a => a.S("id") != id && a.S("state") != "done").ToArray();
                checks.Add(Check(pending.Length == 0, pending.Length == 0 ? "其余六十五项成就已记录解锁。" : "尚有 " + pending.Length + " 项其他成就未记录解锁。"));
                if (pending.Length > 0) notes.Add("待完成：" + string.Join("、", pending.Select(a => a.S("name"))) + "。");
            }

            string[] blocked = checks.Where(c => !c.Flag("met")).Select(c => (c.Get("met") == null ? "尚不能确认：" : "") + c.S("text")).Distinct().ToArray();
            bool unlocked = achievement.S("state") == "done";
            string availability = unlocked ? "done" : blocked.Length > 0 ? "locked" : "ready";
            string reason = unlocked ? "本机账号已记录解锁；切换旧槽位不会倒退账号成就。"
                : blocked.Length > 0 ? string.Join(" ", blocked)
                : equipment != null && !owned ? "按当前剧情可前往对应区域；先按下方路线取得武器，再完成招式要求。"
                : achievement.S("category") == "养成收集" ? "可继续养成或收集；按下方目标补齐所需材料与进度。"
                : "已核对的剧情与装备前置满足，可按下方要求继续。";
            Row[] risks = LinkedRisks(id);
            return achievement.With("availability", availability,
                "availabilityLabel", unlocked ? "已解锁" : availability == "locked" ? "暂不可取" : "前置已满足",
                "availabilityReason", reason, "currentRequirement", requirement.Or(achievement.S("description")),
                "steps", plan.Strings("steps"), "notes", notes.Distinct().ToArray(), "risks", risks, "objectives", objectives.ToArray(),
                "warning", !unlocked && (quests.Any(q => p.State(q) == "failed") || plan.Flag("ribbons") && !owned && p.StageInfo.Flag("afterMu") ||
                    risks.Any(r => r.Flag("available") && !r.Flag("optional"))),
                "planSource", plan.S("source").Or("https://www.gamersky.com/handbook/202610/2237267" +
                    (string.CompareOrdinal(id, "ACH_014") < 0 ? "" : string.CompareOrdinal(id, "ACH_032") < 0 ? "_2" :
                    string.CompareOrdinal(id, "ACH_041") < 0 ? "_3" : string.CompareOrdinal(id, "ACH_049") < 0 ? "_4" : "_5") + ".shtml"));
        }
    }
}
