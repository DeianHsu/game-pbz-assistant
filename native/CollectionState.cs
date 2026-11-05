using System;
using System.Collections.Generic;
using System.Linq;

namespace PBZ.Native
{
    // 地图点位只依据对应存档证据判断，不将字段缺失视为未收集。
    internal static class CollectionState
    {
        static readonly Dictionary<string, string> Fields = new Dictionary<string, string> {
            { "weapon", "MainWeaponInfos" }, { "phantom", "ShaChiWeaponInfo" }, { "accessory", "AccessoryInfos" },
            { "medicine", "MedicineInfos" }, { "flower", "InventoryInfos" }
        };
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
        static bool Integer(object value) { return value is int || value is long; }

        public static string Detect(object point, object slot)
        {
            string kind = Text(Get(point, "kind")), id = Text(Get(point, "id"));
            if (kind == "bell")
            {
                object manager = Get(slot, "BellManager");
                object[][] arrays = { Array(Get(manager, "ActivateBellIDs")), Array(Get(manager, "ActivateCraneBellIDs")) };
                if (arrays.Any(a => a != null && a.Any(value => Same(value, id)))) return "done";
                return arrays.All(a => a != null) ? "missing" : "unknown";
            }
            string field;
            if (Fields.TryGetValue(kind, out field))
            {
                IDictionary<string, object> table = Map(Get(Get(slot, "Inventory"), field));
                object cycle = Get(Get(slot, "PBZGameSystem"), "CycleCount");
                if (table == null || !Integer(cycle)) return "unknown";
                var entry = table.FirstOrDefault(pair => Same(pair.Key, id));
                if (entry.Key == null || entry.Value == null) return "missing";
                object acquired = Get(entry.Value, "AcquiredCycle");
                if (!Integer(acquired)) return "unknown";
                return Convert.ToInt64(acquired) == Convert.ToInt64(cycle) ? "done" : "missing";
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
