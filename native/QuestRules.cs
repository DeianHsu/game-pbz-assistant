using System;
using System.Collections.Generic;
using System.Linq;

namespace PBZ.Native
{
    // 基础任务状态与分支规则：明确失败或未知时，不用旧分支覆盖。
    internal static class QuestRules
    {
        static object Get(object value, string key)
        {
            var map = value as IDictionary<string, object>;
            object result;
            return map != null && map.TryGetValue(key, out result) ? result : null;
        }
        static string Text(object value) { return value == null ? "" : Convert.ToString(value); }
        static object[] Array(object value) { return value as object[] ?? new object[0]; }
        static bool Flag(object value) { return value is bool && (bool)value; }

        public static string State(object record)
        {
            if (record == null) return "missing";
            switch (Text(Get(record, "QuestCompletion")))
            {
                case "EQuestCompletion::QC_Succeded":
                case "EQuestCompletion::QC_Succeeded": return "done";
                case "EQuestCompletion::QC_Started": return "active";
                case "EQuestCompletion::QC_Failed": return "failed";
                default: return "unknown";
            }
        }
        static bool BranchCompleted(object record, string branch)
        {
            return Array(Get(record, "CompletedBranches")).Any(item => Text(item) == branch) ||
                Array(Get(record, "QuestBranches")).Any(item => Text(Get(item, "BranchID")) == branch && Text(Get(item, "BranchType")) == "EBranchType::BranchCompleted");
        }
        public static Dictionary<string, object> Requirement(object rule, object record)
        {
            string state = State(record);
            bool satisfied = false;
            if (state != "failed" && state != "unknown" && state != "missing")
            {
                object[] branches = Get(rule, "branches") as object[];
                if (branches == null) branches = Get(rule, "branch") == null ? new object[0] : new[] { Get(rule, "branch") };
                satisfied = (!Flag(Get(rule, "branchOnly")) && state == "done") ||
                    (Flag(Get(rule, "accepted")) ? state == "active" : branches.Length > 0 && branches.All(branch => BranchCompleted(record, Text(branch))));
            }
            return new Dictionary<string, object> { { "satisfied", satisfied }, { "state", state } };
        }
    }
}
