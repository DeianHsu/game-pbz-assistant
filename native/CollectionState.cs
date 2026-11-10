using System;
using System.Collections.Generic;
using System.Linq;

namespace PBZ.Native
{
    // 地图点位只依据对应存档证据判断，不将字段缺失视为未收集。
    internal static class CollectionState
    {
        static readonly HashSet<string> InventoryKinds = new HashSet<string> { "weapon", "phantom", "accessory", "medicine", "flower" };
        static object Get(object value, string key)
        {
            var map = value as IDictionary<string, object>;
            object result;
            return map != null && map.TryGetValue(key, out result) ? result : null;
        }
        static string Text(object value) { return value == null ? "" : Convert.ToString(value); }
        static object[] Array(object value) { return value as object[]; }
        static IDictionary<string, object> Map(object value) { return value as IDictionary<string, object>; }
        static bool Same(object a, object b) { return string.Equals(Text(a), Text(b), StringComparison.OrdinalIgnoreCase); }

        public static string Detect(object point, Progress progress)
        {
            string kind = Text(Get(point, "kind")), id = Text(Get(point, "id"));
            object slot = progress.Slot;
            if (kind == "bell")
            {
                object manager = Get(slot, "BellManager");
                object[][] arrays = { Array(Get(manager, "ActivateBellIDs")), Array(Get(manager, "ActivateCraneBellIDs")) };
                if (arrays.Any(a => a != null && a.Any(value => Same(value, id)))) return "done";
                return arrays.All(a => a != null) ? "missing" : "unknown";
            }
            if (InventoryKinds.Contains(kind))
            {
                bool? acquired = progress.Acquired(id, kind == "flower" ? "goods" : kind);
                return acquired == true ? "done" : acquired == false ? "missing" : "unknown";
            }
            object nodes = Get(Get(slot, "EventPipeline"), "ExecuteNodeGuid");
            object[] ids = Array(Get(point, "nodes"));
            if (kind == "banyan" || kind == "pillar" || kind == "scarecrow")
            {
                var map = Map(nodes);
                if (map == null || ids == null || ids.Length == 0) return "unknown";
                return ids.Any(value => map.ContainsKey(Text(value))) ? "done" : "missing";
            }
            var checks = new List<bool?>();
            string actor = Text(Get(point, "actor"));
            if (actor != "" && actor != "None")
            {
                var actors = Map(Get(slot, "LevelActorManager"));
                if (actors == null) checks.Add(null);
                else
                {
                    int dash = actor.IndexOf('-');
                    checks.Add(actors.Keys.Any(key => Same(key, actor) || dash > 0 && Same(key, actor.Substring(dash + 1))));
                }
            }
            string domain = Text(Get(point, "domain"));
            if (domain != "" && domain != "None")
            {
                object[] domains = Array(Get(Get(slot, "PBZGameSystem"), "CompleteAddItemMobDomainNames"));
                checks.Add(domains == null ? (bool?)null : domains.Any(value => Same(value, domain)));
            }
            if (ids != null && ids.Length > 0)
            {
                var map = Map(nodes);
                checks.Add(map == null ? (bool?)null : ids.Any(value => map.ContainsKey(Text(value))));
            }
            if (checks.Any(value => value == true)) return "done";
            return checks.Count == 0 || checks.Any(value => value == null) ? "unknown" : "missing";
        }
    }
}
