using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    internal sealed class Progress
    {
        public static readonly Row Guides = LoadGuides();
        static Row LoadGuides()
        {
            using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("PBZ.Guides"))
            using (var reader = new StreamReader(stream)) return Data.Serializer().DeserializeObject(reader.ReadToEnd()).Dict();
        }
        static readonly Dictionary<string, string> Fields = new Dictionary<string, string> {
            { "goods", "InventoryInfos" }, { "weapon", "MainWeaponInfos" }, { "phantom", "ShaChiWeaponInfo" },
            { "accessory", "AccessoryInfos" }, { "medicine", "MedicineInfos" }
        };
        static readonly Row WeaponFormBases = Guides.Get("weaponFormBases").Dict();
        public readonly Catalog Catalog;
        public readonly Row Slot, StageInfo, SystemInfo, BaiXueStep;
        public readonly Row[] Treasures, Achievements, Gates, Quests;
        public readonly Dictionary<string, Row> QuestFailures;
        public readonly string Location, Bell;
        public readonly int Rank;
        public readonly int Cycle;
        public readonly HashSet<string> Tags;
        public readonly Dictionary<string, Row> Records = new Dictionary<string, Row>();
        public readonly bool KnownTags, KnownQuests;
        public Progress(Catalog catalog, Account account, string slotName)
        {
            Catalog = catalog;
            Slot = account.Entries.Get(slotName).Dict();
            SystemInfo = Slot.Get("PBZGameSystem").Dict();
            Cycle = SystemInfo.N("CycleCount", -1);
            var narrative = Slot.Get("Narrative");
            var records = narrative.Get("NarrativeSavedQuests") as object[];
            KnownQuests = records != null;
            if (!KnownQuests) throw new InvalidDataException("当前存档没有可识别的任务记录。");
            foreach (var record in records.OfType<Row>()) Records[record.S("QuestClass").Split('/').Last().Split('.')[0]] = record;
            var events = Slot.Get("EventPipeline");
            KnownTags = events.Get("GlobalTags") is object[];
            Tags = new HashSet<string>(events.Strings("GlobalTags"));
            StageInfo = Stage.Detect(Slot);
            Rank = StageInfo.N("rank");
            Location = SystemInfo.S("CurrentLevelName");
            string bell = SystemInfo.S("LastSaveActorID");
            Bell = catalog.BellName(bell).Or(bell);
            Treasures = BuildTreasures();
            Achievements = BuildAchievements(account.Entries.Get("__Achievements__"));
            Quests = BuildQuests();
            QuestFailures = Quests.Where(q => q.Get("failure") != null && q.S("catalogNote") == "").ToDictionary(q => q.S("id"));
            BaiXueStep = BuildBaiXueStep();
            Gates = BuildGates();
        }
        public Row Quest(string id) { Row row; return Records.TryGetValue(id, out row) ? row : null; }
        public string State(string id) { return QuestRules.State(Quest(id)); }
        public bool Started(string id) { string state = State(id); return state == "done" || state == "active"; }
        public bool? Tag(string id) { return KnownTags ? (bool?)Tags.Contains(id) : null; }
        public bool? Done(string id) { return KnownQuests ? (bool?)(State(id) == "done") : null; }
        public bool? Branch(string id, string branch)
        {
            return KnownQuests ? (bool?)(Started(id) && BranchCompleted(Quest(id), branch)) : null;
        }
        public static bool BranchCompleted(Row quest, string branch)
        {
            return quest.Strings("CompletedBranches").Contains(branch) || quest.Rows("QuestBranches")
                .Any(b => b.S("BranchID") == branch && b.S("BranchType") == "EBranchType::BranchCompleted");
        }
        public static bool BranchActive(Row quest, string branch)
        {
            return quest.Rows("QuestBranches").Any(b => b.S("BranchID") == branch && b.S("BranchType") == "EBranchType::BranchActivating");
        }
        public bool? Killed(string id)
        {
            var boss = Slot.Get("BossRecord") as Row;
            if (boss == null || Cycle < 0) return null;
            return boss.Get(id).Get("Records").Dict().Any(p => p.Key.StartsWith(Cycle + "_", StringComparison.Ordinal) && p.Value.N("KillCount") > 0);
        }
        public bool Reached(string map) { return Location.Has(map) || StageInfo.Strings("regions").Any(region => region.Has(map)); }
        public Row Inventory(string category)
        {
            string field;
            return Fields.TryGetValue(category, out field) ? Slot.Get("Inventory").Get(field) as Row : null;
        }
        static object FindEntry(Row table, string id, bool exact)
        {
            return exact ? table.Get(id) : table.FirstOrDefault(p => p.Key.Equals(id, StringComparison.OrdinalIgnoreCase)).Value;
        }
        public Row ItemRecord(string category, string id, bool exact = false)
        {
            var table = Inventory(category);
            if (table == null) return null;
            Row record = FindEntry(table, id, exact) as Row;
            if (record != null || category != "weapon") return record;
            string baseId = FindEntry(WeaponFormBases, id, exact) as string;
            if (baseId == null) return null;
            Row baseRecord = FindEntry(table, baseId, exact) as Row;
            return baseRecord.Flag("AlreadySnapSoul") || baseRecord.N("AlreadySnapSoul") > 0 ? baseRecord : null;
        }
        public bool? Acquired(string id, string category = "goods", bool possession = false, bool exact = false)
        {
            if (Inventory(category) == null || Cycle < 0) return null;
            var record = ItemRecord(category, id, exact);
            if (record == null) return false;
            if (possession) return true;
            int acquired = record.N("AcquiredCycle", -1);
            return acquired < 0 ? (bool?)null : acquired == Cycle;
        }
        bool? Owned(string category, string id)
        {
            if (Inventory(category) == null) return null;
            Row record = ItemRecord(category, id);
            return record != null && (category != "goods" || record.N("CurrentAmount") > 0 || record.N("MaxAmount") > 0);
        }

        bool? ObjectiveEvidence(Row evidence)
        {
            string id = evidence.S("id");
            switch (evidence.S("kind"))
            {
                case "tag": return Tag(id);
                case "killed": return Killed(id);
                case "item": return evidence.Flag("possession") ? Owned(evidence.S("category"), id) : Acquired(id, evidence.S("category"));
                case "branch": return State(id) == "unknown" ? (bool?)null : BranchCompleted(Quest(id), evidence.S("step"));
                case "done": return State(id) == "unknown" ? (bool?)null : Done(id);
                default: return null;
            }
        }
        public static Row Objective(string name, bool? completed, string area = "")
        {
            return Data.Make("name", name, "value", completed.HasValue ? (int?)(completed.Value ? 1 : 0) : null, "area", area);
        }
        public Row[] ReadObjectives(Row[] definitions)
        {
            return definitions.Select(definition =>
            {
                string item = definition.S("item"), name = definition.S("name");
                if (name == "") name = Catalog.Item("goods", item).S("name").Or(item);
                bool?[] values = definition.Rows("evidence").Select(ObjectiveEvidence).ToArray();
                bool? completed = values.Contains(true) ? true : values.All(value => value == false) ? (bool?)false : null;
                return Objective(name, completed);
            }).ToArray();
        }

        Row[] BuildTreasures()
        {
            return Guides.Rows("treasureGroups").Select(group =>
            {
                string branch = group.S("branch");
                bool handIn = Done("MiaoShouKongKong") == true || Branch("MiaoShouKongKong", branch) == true;
                bool collected = handIn || Branch("MiaoShouKongKong", branch.Split('-')[0]) == true;
                var items = group.Strings("ids").Select(id =>
                {
                    bool? got = Acquired(id);
                    return Data.Make("id", id, "name", Catalog.Item("goods", id).S("name").Or(id),
                        "owned", collected || got == true, "known", collected || got.HasValue);
                }).ToArray();
                return group.With("handedIn", handIn, "collected", items.All(i => i.Flag("owned")), "items", items);
            }).ToArray();
        }
        Row[] BuildAchievements(object saved)
        {
            bool known = saved.Get("UnlockedIds") is object[];
            var unlocked = new HashSet<string>(saved.Strings("UnlockedIds"));
            object counters = saved.Get("Counters"), elements = saved.Get("CompletedElements");
            Func<string, string, int?> counter = (key, fallback) =>
            {
                int n = counters.N(key, -1);
                return n >= 0 ? (int?)n : elements.Get(fallback) is object[] ? elements.Strings(fallback).Distinct().Count() : (int?)null;
            };
            Func<string, string, int?> max = (category, key) =>
            {
                var items = Inventory(category);
                return items == null ? (int?)null : items.Values.Select(i => i.N(key)).DefaultIfEmpty(0).Max();
            };
            var values = new Dictionary<string, int?> {
                { "ACH_033", Enumerable.Range(1, 5).Count(i => Tags.Contains("lz.龙柱.龙柱结算" + i)) },
                { "ACH_040", Enumerable.Range(1, 5).Count(i => Tags.Contains("rszx.榕树之心.完成挑战" + i)) },
                { "ACH_041", counter("ACH_041", "__ACH_041") }, { "ACH_042", max("weapon", "WeaponLevel") },
                { "ACH_043", counter("ACH_043", null) }, { "ACH_044", counter("ACH_044", "ACH_044") },
                { "ACH_045", counter("ACH_045", null) }, { "ACH_046", counter("__ACH_046_Accessory", "__ACH_046_Accessory") },
                { "ACH_047", counter("ACH_047", "__ACH_047") }, { "ACH_048", max("phantom", "ShaChiWeaponLevel") },
                { "ACH_066", known ? (int?)Catalog.Achievements.Count(a => a.S("id") != "ACH_066" && unlocked.Contains(a.S("id"))) : null }
            };
            var weapons = new Dictionary<string, string> {
                { "ACH_051", "IronBlade" }, { "ACH_052", "ChiZheCanJian" }, { "ACH_053", "SlitheringSword" },
                { "ACH_054", "HeiMoShang" }, { "ACH_055", "ZhanMaBlade" }, { "ACH_056", "BaiYing" },
                { "ACH_057", "RenOuYanYueDao" }, { "ACH_058", "YuuBlade" }, { "ACH_059", "JadeDualChakram" },
                { "ACH_060", "BaiShanShuangJian" }, { "ACH_061", "JinGua" }, { "ACH_063", "TieGongZhuQuanTao" }, { "ACH_064", "ThunderSpear" }
            };
            return Catalog.Achievements.Select(achievement =>
            {
                string id = achievement.S("id");
                object info = Guides.Get("achievementHelp").Get(id);
                int? value;
                Row progress = values.TryGetValue(id, out value) ? info.Get("progress").Dict().With("value", value) : null;
                var linked = Guides.Get("questAchievements").Dict().Where(p => p.Value.List().Contains(id)).Select(p => p.Key);
                if (id == "ACH_013") linked = linked.Concat(Guides.Strings("trueEndingQuests"));
                var requirements = linked.Distinct().Select(q => Data.Make("id", q, "name", Catalog.Quests.FirstOrDefault(quest => quest.S("id") == q).S("name").Or(q),
                    "done", Done(q) == true, "recorded", Quest(q) != null)).ToArray();
                string weapon;
                Row equipment = null;
                if (weapons.TryGetValue(id, out weapon))
                {
                    string category = string.CompareOrdinal(id, "ACH_061") < 0 ? "weapon" : "phantom";
                    var owned = Owned(category, weapon);
                    equipment = Catalog.Item(category, weapon).Dict().With("known", owned.HasValue, "owned", owned == true);
                }
                return achievement.With("category", info.S("category"), "hint", info.S("hint"), "progress", progress, "requirements", requirements,
                    "equipment", equipment, "state", !known ? "unknown" : unlocked.Contains(id) ? "done" : "active",
                    "stateLabel", !known ? "无成就记录" : unlocked.Contains(id) ? "本地已解锁" : "未记录解锁",
                    "source", Guides.Get("sources").Get("steam").S("url"));
            }).ToArray();
        }
        Row Result(string state, bool satisfied, string evidence, string mode = "auto")
        {
            return Data.Make("state", state, "satisfied", satisfied, "evidence", evidence, "mode", mode);
        }
        public bool? BaiXueNecklaceGiven()
        {
            if (Done("BaiXue") == true || Branch("BaiXue", "2") == true || Started("BaiXue") && BranchActive(Quest("BaiXue"), "3")) return true;
            bool? necklace = Acquired("I_10003");
            if (necklace != true) return necklace;
            int amount = ItemRecord("goods", "I_10003").N("CurrentAmount", -1);
            return amount < 0 ? (bool?)null : amount == 0;
        }
        Row BuildBaiXueStep()
        {
            const string snow = "BaiXue", ledger = "YongShengDaoZhu";
            if (State(snow) == "failed") return Data.Make("id", "failed", "quest", snow);
            if (Done(snow) == true || Acquired("AC_Bleed", "accessory") == true) return Data.Make("id", "done", "quest", snow);
            bool spared = Tags.Contains("ddsd.杀气怪面.放走"), defeated = Tags.Contains("ddsd.杀气怪面.死亡");
            string step;
            if (Tags.Contains("pz.老槐树.可以挖掘") || Acquired("F_06022") == true) step = "tree";
            else if (Tags.Contains("pz.老槐树.解锁记忆之花") || Acquired("F_06004") == true) step = "petal2";
            else if (BaiXueNecklaceGiven() == true) step = "petal1";
            else if (Started(snow) && BranchActive(Quest(snow), "1") && !spared) step = "puppet";
            else if (Acquired("K_05007") == true && Acquired("I_10003") == true) step = "home";
            else if (spared) step = "spared";
            else if (Tags.Contains("ddsd.杀气怪面.不放走") && !defeated) step = "fight";
            else if (defeated || Done(ledger) == true || Started(snow) || Tags.Contains("ddsd.白雪儿.接任务") || Acquired("K_05007") == true) step = "puppet";
            else if (State(ledger) == "failed") return Data.Make("id", "failed", "quest", ledger);
            else if (Tags.Contains("ddsd.获得物品.赎罪名单") || Acquired("R_070002") == true || Branch(ledger, "1") == true || BranchActive(Quest(ledger), "2")) step = "deliver";
            else step = Started(ledger) || Tags.Contains("ddsd.杀气怪面.对话3") ? "ledger" : "start";
            return Guides.Get("baiXueSteps").Get(step).Dict().With("id", step);
        }
        Row BaiXueCheck()
        {
            string id = BaiXueStep.S("id"), quest = BaiXueStep.S("quest");
            if (id == "done") return Result("done", true, "白雪儿已完成，或本周目已取得饰品雪与血。");
            if (id == "failed") return Result("failed", false, Guides.S("unknownQuestFailure")).With("quest", quest);
            bool verify = BaiXueStep.Flag("verify");
            string progress = "";
            if (BaiXueStep.S("map") == "HouJie")
            {
                bool?[] petals = { Acquired("F_06004"), Acquired("F_06022") };
                progress = "花瓣 " + (petals.All(v => v.HasValue) ? petals.Count(v => v == true) + "/2" : "待核对") +
                    " · 雪与血" + (Acquired("AC_Bleed", "accessory").HasValue ? "待领取" : "待核对");
            }
            return Result(verify ? "unknown" : "active", false, BaiXueStep.S("evidence"), verify ? "manual" : "auto").With(
                "quest", quest, "title", BaiXueStep.S("title"), "action", BaiXueStep.S("action"), "bell", BaiXueStep.S("bell"),
                "source", BaiXueStep.S("source"), "otherSource", BaiXueStep.S("otherSource"), "progress", progress,
                "stateLabel", verify ? "领取待核对" : "下一步");
        }
        bool ZhouRescued(Row record, bool? letter)
        {
            return Tags.Contains("ddsd.周平子.开笼子") || Tags.Contains("ddsd.周平子.获得遗书") ||
                letter == true || BranchActive(record, "1") || BranchCompleted(record, "1");
        }
        bool CuiDelivered
        {
            get
            {
                var camp = Guides.Get("cuiCamp");
                return Branch("XiaoCui", camp.S("branch")) == true || Tags.Contains(camp.S("deliveredTag"));
            }
        }
        Row QuestFailure(string id, Row record, string state)
        {
            if (state == "done" || state == "unknown") return null;
            var rule = Guides.Get("questFailureRules").Get(id);
            string tag = rule.S("tag");
            string[] branches = rule.Strings("unlessBranches");
            if (tag != "" && Tags.Contains(tag) && (record != null || rule.S("state") == "failed") &&
                !rule.Strings("unlessTags").Any(Tags.Contains) && !(branches.Length > 0 && branches.All(branch => BranchCompleted(record, branch))) &&
                !(id == "WuXiangWang" && ZhouRescued(record, Acquired("R_070017"))))
            {
                var context = rule.Get("context").Dict().Where(pair => Tags.Contains(pair.Key)).ToArray();
                return Data.Make("state", state == "failed" ? state : rule.S("state").Or("interrupted"),
                    "reason", rule.S("reason") + string.Concat(context.Select(pair => pair.Value.Str())),
                    "evidence", string.Join("、", new[] { tag }.Concat(context.Select(pair => pair.Key))),
                    "action", rule.S("action"), "source", rule.S("source"));
            }
            if (id == "XiaoCui" && record != null && StageInfo.S("crusherEntry") != "" && !CuiDelivered)
            {
                var camp = Guides.Get("cuiCamp");
                return Data.Make("state", state == "failed" ? state : "interrupted", "reason", camp.S("missed"),
                    "evidence", StageInfo.S("crusherEntry"), "action", camp.S("recovery"), "source", camp.S("source"));
            }
            return state == "failed" ? Data.Make("state", state, "reason", Guides.S("unknownQuestFailure"), "evidence", record.S("QuestCompletion")) : null;
        }
        Row Special(Row rule, Row record)
        {
            string state = QuestRules.State(record), kind = rule.S("check");
            Row[] details = new Row[0];
            if (kind == "chivalry")
                details = Guides.Rows("chivalryEncounters").Select((e, i) =>
                {
                    bool? got = Acquired(e.S("id"));
                    bool freed = Tags.Contains("pz.不灭侠胆.帮助正道解脱" + (i + 1));
                    return e.With("state", got == true ? "done" : freed ? "active" : "unknown",
                        "label", "第 " + (i + 1) + " 处 · " + e.S("name") + " · " + e.S("area"),
                        "flower", Catalog.Item("goods", e.S("id")).S("name").Or(e.S("id")),
                        "text", got == true ? "本周目花瓣已取得" : freed ? "已记录解脱，花瓣尚未记录取得" : "尚无解脱或花瓣记录");
                }).ToArray();
            Row result;
            if (state == "failed") result = Result("failed", false, "所选槽位明确记录任务失败。");
            else if (state == "unknown") result = Result("unknown", false, "任务状态无法识别。", "manual");
            else if (kind == "red-route")
            {
                bool reward = Acquired("F_03008") == true && Acquired("AC_LowShachi", "accessory") == true;
                bool escaped = Tags.Contains("zddy.红衣女剑客.荡绳离开"), dead = Tags.Contains("zddy.击杀.红衣女剑客");
                bool formation = new[] { "zddy.剑阵.出场", "zddy.剑阵.二阶段", "zddy.击杀.剑阵1", "zddy.击杀.剑阵2", "zddy.剑阵.完成任务", "achievment.剑横北斗.完成" }.Any(Tags.Contains);
                if (reward) result = Result("done", true, "本周目花瓣与同心双鱼佩均已取得。");
                else if (!KnownTags) result = Result("unknown", false, "缺少女剑客路线事件记录。", "manual");
                else if (dead && !formation) result = Result("failed", false, "已记录女剑客死亡，未记录七星剑阵入战、击杀或完成。").With("stateLabel", "提前击杀风险");
                else if (escaped) result = Result("done", true, "存档记录女剑客荡绳离开。");
                else if (dead || state == "done") result = Result("unknown", false, "缺少离场及成对奖励证据，请核对击杀时序。", "manual");
                else result = Result(state, false, "尚无女剑客离场证据。");
            }
            else if (kind == "chivalry")
            {
                if (Tags.Contains("pz.不灭侠胆.任务失败")) result = Result("failed", false, "存档明确记录不灭侠胆任务失败。");
                else if (state == "done" || Acquired("TU_19006") == true) result = Result("done", true, "任务已完成或本周目侠胆奖励已取得。");
                else
                {
                    bool? jade = Acquired("I_06006");
                    bool known = KnownTags && jade.HasValue && details.All(d => Acquired(d.S("id")).HasValue);
                    result = Result(known ? state : "unknown", false, "交战后在跪地窗口帮助弟子解脱，再调查原地花瓣。", known ? "auto" : "manual")
                        .With("progress", "花瓣 " + details.Count(d => d.S("state") == "done") + "/6");
                    if (known && jade != true && !BranchActive(record, "1")) result["action"] = "见过剑阵领头人后，回庞镇“组织”酒馆找狼头领取破碎的侠胆。";
                }
            }
            else
            {
                bool? letter = Acquired("R_070017");
                bool evidence = state == "done" || ZhouRescued(record, letter);
                result = evidence ? Result("done", true, "已有开笼、遗书、交付分支或完成记录。")
                    : Result(KnownTags && letter.HasValue ? "missing" : "unknown", false, "尚无开笼或遗书记录，请先核对救人步骤。", KnownTags && letter.HasValue ? "auto" : "manual");
            }
            if (details.Length > 0) result["riskDetails"] = details;
            return result;
        }

        Row Evaluate(Row rule)
        {
            string kind = rule.S("check"), id = rule.S("quest");
            Row record = Quest(id);
            switch (kind)
            {
                case "":
                    return QuestRules.Requirement(rule, record).With("mode", "auto", "evidence", record == null
                        ? "所选槽位没有此任务记录。" : "任务状态：" + record.S("QuestCompletion") + "。已完成分支：" + string.Join("、", record.Strings("CompletedBranches")));
                case "red-route": case "chivalry": case "cage": return Special(rule, record);
                case "bai-xue": return BaiXueCheck();
                case "cui-camp":
                    bool delivered = CuiDelivered;
                    return Result(delivered ? "done" : State(id), delivered, delivered ? "存档记录了小翠的营地交付分支或墓前事件。" : "存档尚无战前交付完成的记录。")
                        .With("stateLabel", delivered ? "战前交付已完成" : "先交付再开战");
                case "achievement":
                    Row a = Achievements.FirstOrDefault(row => row.S("id") == rule.S("achievement"));
                    return Result(a.S("state").Or("unknown"), a.S("state") == "done", "按本地账号成就解锁记录判断。").With("stateLabel", a.S("stateLabel"));
                case "tags":
                    if (!KnownTags) return Result("unknown", false, "没有可识别的事件标签。", "manual");
                    string[] expected = rule.Strings("tags"), found = expected.Where(Tags.Contains).ToArray();
                    return Result("active", expected.Length == found.Length, "已记录事件：" + string.Join("、", found)).With("progress", found.Length + "/" + expected.Length);
                case "item":
                    string category = rule.S("category"), itemId = rule.S("item");
                    Row item = Catalog.Item(category, itemId);
                    if (item == null) return Result("unknown", false, "当前物品表无法核对这个物品。", "manual");
                    bool? own = Owned(category, itemId);
                    bool handedIn = rule.S("evidenceQuest") != "" && QuestRules.Requirement(Data.Make("branch", rule.S("evidenceBranch")), Quest(rule.S("evidenceQuest"))).Flag("satisfied");
                    return Result(own.HasValue ? "missing" : "unknown", own == true || handedIn,
                        handedIn ? "已完成对应珍宝交付分支。" : item.S("name") + (own == true ? "已有获取记录。" : own.HasValue ? "没有获得记录。" : "背包字段缺失。"),
                        own.HasValue ? "auto" : "manual").With("stateLabel", "未记录获得");
                default:
                    bool done = rule.S("completeQuest") != "" && Done(rule.S("completeQuest")) == true ||
                        rule.S("acceptedQuest") != "" && Started(rule.S("acceptedQuest"));
                    return Result(done ? "done" : "unknown", done, done ? "对应任务状态已证明路线开启或完成。" : "存档没有可靠的选择或遭遇记录，需现场核对。", done ? "auto" : "manual");
            }
        }
        bool Available(string id)
        {
            if (id == "mu-rewards" && !StageInfo.Flag("afterMu") || id == "crusher-reward" && !StageInfo.Flag("afterCrusher")) return false;
            if (new[] { "qixing", "baishan", "chivalry" }.Contains(id) && Location.Has("Zhengdaodaying")) return true;
            if ((id == "qingshe" || id == "mirage") && (StageInfo.Flag("approachingEstate") || StageInfo.Flag("readyForEstate"))) return true;
            if ((id == "snow" || id == "sanmian") && StageInfo.Flag("afterEstate")) return true;
            return Rank >= Guides.Get("minimumStage").N(id, int.MaxValue);
        }
        public int TreasureRank(string branch) { return Guides.Get("treasureStages").N(branch, int.MaxValue); }
        Row[] BuildGates()
        {
            var passed = new Dictionary<string, bool> {
                { "valley", Killed("BP_Monster_HookMan_P2") == true }, { "jingye", Killed("BP_Monster_JingYe") == true },
                { "baichilian", Killed("BP_Monster_ChiLian_P2") == true || Done("MainCh1-LinZhongShaJi") == true },
                { "pangzhen", Tags.Contains("pz.后街.进入") }, { "baishan", Done("BaiShanMiWen") == true || Branch("BaiShanMiWen", "3") == true },
                { "qingshe", Tags.Contains("quest.任务中断.进入青蛇屋外围") }, { "ending", SystemInfo.Flag("bIsFinishGame") },
                { "luxiaokui", Killed("BP_Monster_MuXiaoKui") == true || Killed("BP_Monster_MuXiaoKui_P2") == true },
                { "lu-well", Done("MainCh1-ShiXinCun") == true }, { "qixing", Tags.Contains("achievment.剑横北斗.完成") },
                { "chivalry", Done("BuMieXiaDan") == true }, { "mirage", Rank >= 7 },
                { "sanmian", Done("SanMianHunDun") == true },
                { "crusher", StageInfo.S("crusherEntry") != "" }
            };
            return Guides.Rows("checkpoints").Select(g =>
            {
                string id = g.S("id");
                bool available = Available(id);
                Row[] items = g.Rows("requirements").Select(rule =>
                {
                    var result = new Row(rule);
                    foreach (var field in Evaluate(rule)) result[field.Key] = field.Value;
                    string quest = result.S("quest");
                    var info = Catalog.Quests.FirstOrDefault(q => q.S("id") == quest);
                    Row failedQuest;
                    if (!result.Flag("satisfied") && QuestFailures.TryGetValue(quest, out failedQuest)) result["failure"] = failedQuest.Get("failure");
                    string title = result.S("title");
                    if (title == "完成紫色任务") title = "完成" + info.S("name").Or(quest);
                    if (rule.S("check") == "achievement") title = "核对" + Achievements.FirstOrDefault(a => a.S("id") == rule.S("achievement")).S("name").Or(rule.S("achievement"));
                    string[] achievements = rule.Get("achievements") == null ? Guides.Get("questAchievements").Strings(quest) : rule.Strings("achievements");
                    string label = result.S("stateLabel").Or(result.S("mode") == "manual" ? "需现场核对" : Guides.Get("STATE_LABELS").S(result.S("state")));
                    return result.With("title", title, "available", available && (id != "treasures" || Rank >= TreasureRank(rule.S("branch"))) &&
                        (id != "crusher-reward" || CuiDelivered),
                        "stateLabel", label, "achievements", achievements,
                        "source", result.S("source").Or(g.S("source")),
                        "current", rule.S("check") == "bai-xue" ? new string[0] : Quest(quest).Rows("QuestBranches").Where(b => b.S("BranchType") == "EBranchType::BranchActivating")
                            .Select(b => info.Get("branches").Get(b.S("BranchID")).S("objective")).Where(s => s != "").ToArray());
                }).ToArray();
                return g.With("available", available, "passed", passed.ContainsKey(id) && passed[id], "items", items,
                    "currentPending", items.Count(i => i.Flag("available") && !i.Flag("optional") && !i.Flag("satisfied") && i.Get("failure") == null));
            }).ToArray();
        }
        Row[] BuildQuests()
        {
            var map = Catalog.Quests.ToDictionary(q => q.S("id"));
            return map.Keys.Concat(Records.Keys).Distinct().Select(id =>
            {
                Row info;
                map.TryGetValue(id, out info);
                Row record = Quest(id);
                string type = info.S("type").Or(record.S("QuestClass").Contains("/Tutorial/") ? "Tutorial" : "Other");
                var branches = record.Rows("QuestBranches").Select(branch =>
                {
                    string key = branch.S("BranchID"), state = branch.S("BranchType");
                    return info.Get("branches").Get(key).Dict().With("id", key, "state", state,
                        "completed", BranchCompleted(record, key), "active", state == "EBranchType::BranchActivating");
                }).ToArray();
                string status = QuestRules.State(record);
                Row failure = QuestFailure(id, record, status);
                status = failure.S("state").Or(status);
                bool archived = id == "FengChe" ? status != "done" : record == null && failure == null;
                return Data.Make("id", id, "name", info.S("name").Or(id), "type", type, "branches", branches, "state", status,
                    "stateLabel", Guides.Get("STATE_LABELS").S(status), "recorded", record != null, "failure", failure,
                    "catalogNote", archived ? Guides.Get("questArchive").S(id) : "");
            }).Where(q => q.S("type") != "Tutorial" && q.S("type") != "Quest_Branchline").ToArray();
        }
    }
}
