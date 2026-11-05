using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace PBZ.Native
{
    // 与 stages.mjs 相同的存档证据：主线进度、到访地图、首领及事件。
    internal static class Stage
    {
        static readonly string[] Names = { "未知阶段", "悲泣溪谷阶段", "血色森林阶段", "陆家村阶段", "庞镇阶段", "梅谷湖阶段", "枷笼山阶段", "戏梦山庄阶段", "断魂山阶段", "通关后" };
        static IDictionary<string, object> Map(object value) { return value as IDictionary<string, object> ?? new Dictionary<string, object>(); }
        static object Get(object value, string key) { object result; return Map(value).TryGetValue(key, out result) ? result : null; }
        static string Text(object value) { return value == null ? "" : Convert.ToString(value); }
        static IEnumerable<object> Array(object value) { return value as object[] ?? new object[0]; }
        static bool Done(object quest)
        {
            string value = Text(Get(quest, "QuestCompletion"));
            return value == "EQuestCompletion::QC_Succeded" || value == "EQuestCompletion::QC_Succeeded";
        }
        static bool Started(object quest) { return Done(quest) || Text(Get(quest, "QuestCompletion")) == "EQuestCompletion::QC_Started"; }
        static bool Completed(object quest, string id)
        {
            return Array(Get(quest, "CompletedBranches")).Any(x => Text(x) == id) ||
                Array(Get(quest, "QuestBranches")).Any(x => Text(Get(x, "BranchID")) == id && Text(Get(x, "BranchType")) == "EBranchType::BranchCompleted");
        }
        static bool Active(object quest, string id)
        {
            return Array(Get(quest, "QuestBranches")).Any(x => Text(Get(x, "BranchID")) == id && Text(Get(x, "BranchType")) == "EBranchType::BranchActivating");
        }
        static string QuestId(object quest)
        {
            string path = Text(Get(quest, "QuestClass"));
            string last = path.Substring(path.LastIndexOf('/') + 1);
            int dot = last.IndexOf('.');
            return dot < 0 ? last : last.Substring(0, dot);
        }
        static bool Killed(object slot, string id, string cycle)
        {
            object records = Get(Get(Get(slot, "BossRecord"), id), "Records");
            foreach (KeyValuePair<string, object> record in Map(records))
            {
                object count = Get(record.Value, "KillCount");
                double number;
                if (record.Key.StartsWith(cycle + "_", StringComparison.Ordinal) && double.TryParse(Text(count), out number) && number > 0) return true;
            }
            return false;
        }

        public static Dictionary<string, object> Detect(object slot)
        {
            var quests = new Dictionary<string, object>(StringComparer.Ordinal);
            foreach (object quest in Array(Get(Get(slot, "Narrative"), "NarrativeSavedQuests"))) quests[QuestId(quest)] = quest;
            Func<string, object> questById = id => quests.ContainsKey(id) ? quests[id] : null;
            object system = Get(slot, "PBZGameSystem");
            string cycle = Text(Get(system, "CycleCount"));
            string location = Text(Get(system, "CurrentLevelName"));
            var regions = new List<string>();
            foreach (KeyValuePair<string, object> entry in Map(Get(Get(slot, "MapSubsystem"), "UnLockMaskInfos")))
                if (Array(Get(entry.Value, cycle)).Any()) regions.Add(entry.Key);
            regions.Add(location);
            int rank = 1;
            foreach (var item in new[] {
                new { Id = "MainCh1-LinZhongShaJi", Rank = 2 }, new { Id = "MainCh1-ShiXinCun", Rank = 3 },
                new { Id = "MainCh2-SiZhen", Rank = 4 }, new { Id = "MainCh2-XinZhiZongJi", Rank = 4 },
                new { Id = "MainCh2-SiDaSheWu", Rank = 4 }, new { Id = "MainCh3-LongYuZuo", Rank = 8 } })
                if (Started(questById(item.Id))) rank = Math.Max(rank, item.Rank);
            foreach (var item in new[] {
                new { Pattern = "PangZhen|HouJie", Rank = 4 }, new { Pattern = "MeiGu", Rank = 5 },
                new { Pattern = "DengDing|JiaLong", Rank = 6 }, new { Pattern = "XiMeng", Rank = 7 },
                new { Pattern = "DuanHun|HunDuan", Rank = 8 } })
                if (regions.Any(region => Regex.IsMatch(region, item.Pattern, RegexOptions.IgnoreCase))) rank = Math.Max(rank, item.Rank);
            object estate = questById("MainCh3-PoJu");
            bool afterEstate = Done(estate) || Completed(estate, "2") || Active(estate, "3");
            if (Completed(estate, "1") || Active(estate, "2") || afterEstate) rank = Math.Max(rank, 7);
            if (Get(system, "bIsFinishGame") is bool && (bool)Get(system, "bIsFinishGame")) rank = 9;
            object lu = questById("MainCh1-ShiXinCun");
            bool afterMu = Killed(slot, "BP_Monster_MuXiaoKui", cycle) || Killed(slot, "BP_Monster_MuXiaoKui_P2", cycle) || Done(lu) || Active(lu, "4") || Completed(lu, "4");
            bool afterCrusher = Array(Get(Get(slot, "EventPipeline"), "GlobalTags")).Any(x => Text(x) == "achievment.锯理力争.完成");
            return new Dictionary<string, object> {
                { "rank", rank }, { "name", Names[rank] }, { "location", location }, { "regions", regions.ToArray() },
                { "afterMu", afterMu }, { "afterEstate", afterEstate }, { "readyForEstate", Started(estate) },
                { "afterCrusher", afterCrusher }, { "finished", rank == 9 }
            };
        }
    }
}
