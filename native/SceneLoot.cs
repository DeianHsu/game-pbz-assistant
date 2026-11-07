using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    internal static class SceneLoot
    {
        public const string MoneyCategory = "money-point";
        public const string MaterialCategory = "weapon-material-point";
        static readonly Regex Blueprint = new Regex(@"/BP_(?:Rubbish(?:_[ABC])?|Chest|HangingGift)\.uasset$", RegexOptions.IgnoreCase);
        static readonly Regex WeaponMaterial = new Regex(@"^Weapon_Material_\d{2}$", RegexOptions.IgnoreCase);
        static readonly Dictionary<string, string[]> Levels = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase) {
            { "PBZ_Xigu_WP", new[] { "XiGu" } }, { "PBZ_Fujizhilin_WP", new[] { "FuJiZhiLin" } },
            { "PBZ_Zhengdaodaying_WP", new[] { "LuJiaCun", "ZhengDaoDaYing" } },
            { "PBZ_Pangzhen_WP", new[] { "PangZhen", "MeiGuHu" } },
            { "PBZ_Houjie_WP", new[] { "HouJie" } }, { "PBZ_Huanshuyiji2_WP", new[] { "MeiGu_YiJi" } },
            { "PBZ_DengDingShanDao_WP", new[] { "DengDingShanDao" } },
            { "PBZ_Ximeng_WP", new[] { "XiMeng" } }, { "PBZ_Duanhun_WP", new[] { "DuanHunYa", "DuanHunShan" } }
        };

        // Serialized fields up to the loot selector on the three blueprint classes.
        // i = int/object ref, b = byte, n = name, p = PickupInfo array, m/w/s = name map/set.
        const string RubbishFields = "biiiiinbpbbimwbbitssbinib";
        const string ChestFields = "biiiiiiiiiiiipbiiBawmaabiissniitbswsb";
        const string HangingFields = "biiiiiin";

        sealed class Amount
        {
            public readonly int Min, Max;
            public readonly float Weight;
            public readonly float[] Multipliers;
            public Amount(int min, int max, float weight = 1, float[] multipliers = null)
            {
                Min = min;
                Max = max;
                Weight = weight;
                Multipliers = multipliers ?? new float[0];
            }
        }
        sealed class Rewards
        {
            public readonly List<Amount> Money = new List<Amount>();
            public readonly Dictionary<string, List<Amount>> Materials = new Dictionary<string, List<Amount>>(StringComparer.OrdinalIgnoreCase);
            public void AddMaterial(string id, int min, int max, float weight = 1)
            {
                if (max <= 0 || !WeaponMaterial.IsMatch(id)) return;
                List<Amount> amounts;
                if (!Materials.TryGetValue(id, out amounts)) Materials[id] = amounts = new List<Amount>();
                amounts.Add(new Amount(min, max, weight));
            }
        }
        internal sealed class Export
        {
            public string Name;
            public uint Number, Class;
            public long Outer;
            public int Start, End;
        }

        internal static Export[] Exports(byte[] bytes, string[] names, bool headerOnly = false)
        {
            int start = Catalog.Offset(bytes, 32), end = Catalog.Offset(bytes, 36), asset = Catalog.Offset(bytes, 4);
            if (start > end || end > asset || (end - start) % 72 != 0) throw new InvalidDataException("场景物件表结构变化。");
            var exports = new Export[(end - start) / 72];
            for (int i = 0; i < exports.Length; i++)
            {
                int at = start + i * 72;
                int name = (int)(BitConverter.ToUInt32(bytes, at + 16) & 0x3fffffff);
                int position = checked(asset + (int)BitConverter.ToUInt64(bytes, at));
                int limit = checked(position + (int)BitConverter.ToUInt64(bytes, at + 8));
                if (name >= names.Length || !headerOnly && limit > bytes.Length) throw new InvalidDataException("场景物件范围异常。");
                exports[i] = new Export { Name = names[name], Number = BitConverter.ToUInt32(bytes, at + 20),
                    Outer = BitConverter.ToInt64(bytes, at + 24), Class = BitConverter.ToUInt32(bytes, at + 36), Start = position, End = limit };
            }
            return exports;
        }
        static MapCatalog.MapReader Reader(byte[] bytes, string[] names, Export entry)
        {
            return new MapCatalog.MapReader(bytes, names, entry.Start);
        }
        static int[] Location(byte[] bytes, string[] names, Export root)
        {
            var map = Reader(bytes, names, root);
            if (map.Header().FirstOrDefault() != 5 || map.Reader.Position > root.End - 24)
                throw new InvalidDataException("场景拾取物坐标无法识别。");
            var result = new int[3];
            for (int i = 0; i < 3; i++)
            {
                double value = BitConverter.ToDouble(bytes, map.Reader.Position + i * 8);
                result[i] = checked((int)Math.Round(value));
            }
            return result;
        }

        static void SkipText(GameBytes r)
        {
            r.U32(); // FText flags
            byte history = r.Take(1)[0];
            if (history == 0) { r.String(); r.String(); r.String(); }
            else if (history == 255)
            {
                uint invariant = r.U32();
                if (invariant == 1) r.String();
                else if (invariant != 0) throw new InvalidDataException("拾取物文本结构变化。");
            }
            else throw new InvalidDataException("拾取物文本类型变化。");
        }
        static void ReadPickups(MapCatalog.MapReader map, Rewards rewards)
        {
            int count = map.Reader.Count(500);
            for (int i = 0; i < count; i++)
            {
                string id = "";
                int amount = 0;
                foreach (int field in map.Header())
                    switch (field)
                    {
                        case 0: id = map.Name(); break;
                        case 1: amount = map.Reader.I32(); break;
                        default: throw new InvalidDataException("拾取奖励结构变化。");
                    }
                rewards.AddMaterial(id, amount, amount);
            }
        }
        static void ReadNameMap(MapCatalog.MapReader map, int valueSize, Rewards rewards)
        {
            var r = map.Reader;
            r.Take(r.Count(500) * 8); // removed keys
            int count = r.Count(500);
            for (int i = 0; i < count; i++)
            {
                string id = map.Name();
                if (valueSize == 4)
                {
                    int amount = r.I32();
                    rewards.AddMaterial(id, amount, amount);
                }
                else r.Take(valueSize);
            }
        }
        static Rewards ReadActor(byte[] bytes, string[] names, Export actor, string blueprint,
            Dictionary<string, Rewards> loot, out string lootId)
        {
            bool chest = blueprint == "BP_Chest", hanging = blueprint == "BP_HangingGift";
            string fields = chest ? ChestFields : hanging ? HangingFields : RubbishFields;
            int dustField = chest ? 30 : hanging ? -1 : 23;
            int legacyField = chest ? 36 : hanging ? -1 : 20;
            int modeField = chest ? 32 : hanging ? -1 : 24;
            bool legacy = false;
            int mode = chest ? 0 : 1;
            var direct = new Rewards();
            var map = Reader(bytes, names, actor);
            var r = map.Reader;
            lootId = "";
            foreach (int field in map.Header())
            {
                if (field >= fields.Length) break;
                switch (fields[field])
                {
                    case 'i':
                        int number = r.I32();
                        if (field == dustField && number > 0) direct.Money.Add(new Amount(number, number));
                        break;
                    case 'b':
                        byte value = r.Take(1)[0];
                        if (field == legacyField) legacy = value == 1;
                        if (field == modeField) mode = value;
                        break;
                    case 'n':
                        string name = map.Name();
                        if (chest || hanging || field == 22) lootId = name;
                        break;
                    case 'p': ReadPickups(map, direct); break;
                    case 'm': ReadNameMap(map, 4, direct); break;
                    case 'w': ReadNameMap(map, 1, direct); break;
                    case 's': ReadNameMap(map, 0, direct); break;
                    case 'a': r.Take(r.Count(500) * 4); break;
                    case 'B': r.Take(r.Count(500)); break;
                    case 't': SkipText(r); break;
                }
                if (r.Position > actor.End) throw new InvalidDataException("场景拾取物奖励范围异常。");
            }
            Rewards table;
            return !legacy && mode == 1 && loot.TryGetValue(lootId, out table) ? table : direct;
        }

        static Dictionary<string, Rewards> ReadLootTable(IoArchive archive)
        {
            byte[] bytes = archive.ReadFile("ProjectPBZ/Content/PBZContent/DataTable/DT_LevelLootDataTable.uasset");
            var map = new MapCatalog.MapReader(bytes, Catalog.Names(bytes), Catalog.Offset(bytes, 4) + 10);
            var r = map.Reader;
            var rows = new Dictionary<string, Rewards>(StringComparer.OrdinalIgnoreCase);
            int count = r.Count(10000);
            for (int i = 0; i < count; i++)
            {
                string id = map.Name();
                if (!map.Header().SequenceEqual(new[] { 0, 1 }) || map.Name() != id) throw new InvalidDataException("场景掉落表结构变化。");
                var rewards = new Rewards();
                int configs = r.Count(100);
                for (int j = 0; j < configs; j++)
                    foreach (int type in map.Header())
                    {
                        if (type == 6) { r.Take(1); continue; } // grade
                        if (type < 1 || type > 5) throw new InvalidDataException("场景掉落类型变化。");
                        int options = r.Count(500);
                        for (int k = 0; k < options; k++) ReadLootOption(map, type, rewards);
                    }
                rows.Add(id, rewards);
            }
            if (r.Position != bytes.Length) throw new InvalidDataException("场景掉落表长度不一致。");
            return rows;
        }
        static void ReadLootOption(MapCatalog.MapReader map, int type, Rewards rewards)
        {
            var r = map.Reader;
            string item = "";
            int minimum = 0, maximum = 0;
            float weight = 0;
            float[] multipliers = null;
            foreach (int field in map.Header())
            {
                if (type == 1 && field == 2)
                {
                    multipliers = new float[r.Count(100)];
                    for (int i = 0; i < multipliers.Length; i++) multipliers[i] = BitConverter.ToSingle(r.Take(4), 0);
                }
                else if (type == 4 && field == 3) r.Take(r.Count(100) * 4);
                else if (type != 1 && field == 0) item = map.Name();
                else if (type == 3 && field == 1) r.Take(1);
                else if ((type == 1 || type == 2) && field == 3) weight = BitConverter.ToSingle(r.Take(4), 0);
                else if (type == 1 && field == 0 || type == 2 && field == 1) minimum = r.I32();
                else if (type == 1 && field == 1 || type == 2 && field == 2) maximum = r.I32();
                else r.U32();
            }
            if (maximum <= 0 || weight <= 0) return;
            if (type == 1) rewards.Money.Add(new Amount(minimum, maximum, weight, multipliers));
            if (type == 2) rewards.AddMaterial(item, minimum, maximum, weight);
        }

        static string FormatAmount(Amount[] amounts, int cycle, out long? sortValue)
        {
            sortValue = null;
            if (amounts.Length == 0) return "";
            var invalid = amounts.FirstOrDefault(amount => amount.Min > amount.Max);
            if (invalid != null) return string.Format("配置异常（{0:N0} / {1:N0}）", invalid.Min, invalid.Max);
            bool baseOnly = amounts.Any(amount => amount.Multipliers.Length > 0 &&
                (cycle < 0 || cycle >= amount.Multipliers.Length || float.IsNaN(amount.Multipliers[cycle]) ||
                    float.IsInfinity(amount.Multipliers[cycle]) || amount.Multipliers[cycle] < 0));
            long min = 0, max = 0;
            bool approximate = false;
            foreach (Amount amount in amounts)
            {
                float multiplier = baseOnly || amount.Multipliers.Length == 0 ? 1 : amount.Multipliers[cycle];
                float low = amount.Weight < 1 ? 0 : amount.Min * multiplier, high = amount.Max * multiplier;
                long roundedLow = (long)Math.Round(low, MidpointRounding.AwayFromZero);
                long roundedHigh = (long)Math.Round(high, MidpointRounding.AwayFromZero);
                approximate |= low != roundedLow || high != roundedHigh;
                min += roundedLow;
                max += roundedHigh;
            }
            if (!baseOnly) sortValue = min;
            string text = min == max ? min.ToString("N0") : string.Format("{0:N0}–{1:N0}", min, max);
            if (baseOnly) return text + (cycle < 0 ? "（基础值，周目未知）" : "（基础值，本周目倍率未知）");
            return approximate ? "约 " + text : text;
        }

        public static string Money(Row point, int cycle, out long? sortValue)
        {
            return FormatAmount((Amount[])point["money"], cycle, out sortValue);
        }

        public static string Materials(Row point)
        {
            return string.Join("、", point.Rows("materials").Select(material =>
            {
                long? unused;
                return material.S("name") + " ×" + FormatAmount((Amount[])material["amounts"], 0, out unused);
            }));
        }

        static Row ReadFlow(byte[] bytes, string[] names, string[] imports, Export[] exports, IEnumerable<Export> components)
        {
            try
            {
                foreach (Export component in components)
                {
                    var reader = Reader(bytes, names, component);
                    int[] fields = reader.Header();
                    if (!fields.Contains(46)) continue;
                    int preset = 0;
                    if (fields.Contains(30))
                    {
                        int count = reader.Reader.Count(100);
                        if (count > 0) preset = reader.Reader.I32();
                        if (count > 1) reader.Reader.Take((count - 1) * 4);
                    }
                    if (reader.Reader.Position > component.End - 4) return Data.Make("id", "unknown");
                    string id = IoArchive.ImportedAsset(bytes, reader.Reader.I32(), imports).Or("unknown");
                    if (id != "BPF_VisibleInteractPrefab" || preset <= 0 || preset > exports.Length)
                        return Data.Make("id", id);
                    var settings = exports[preset - 1];
                    if (!settings.Name.StartsWith("BP_FlowPresetData_VisibleInteract", StringComparison.Ordinal))
                        return Data.Make("id", id);
                    var config = Reader(bytes, names, settings);
                    int[] configFields = config.Header();
                    if (!configFields.Contains(0) || configFields.Any(field => field != 0 && field != 2) || config.Reader.Count(32) != 1)
                        return Data.Make("id", id);
                    string tag = config.Name();
                    bool defaultVisible = configFields.Contains(2) && config.Reader.Take(1)[0] == 1;
                    return Data.Make("id", id, "visibleTag", tag, "defaultVisible", defaultVisible);
                }
                return null;
            }
            catch (InvalidDataException) { return Data.Make("id", "unknown"); }
        }

        public static Row[] Read(IoArchive archive, Catalog catalog)
        {
            var loot = ReadLootTable(archive);
            var blueprints = archive.Files.Keys.Where(path => Blueprint.IsMatch(path)).ToArray();
            if (blueprints.Length == 0) throw new InvalidDataException("缺少场景拾取物资源。");
            var blueprintNames = new HashSet<string>(blueprints.Select(Path.GetFileNameWithoutExtension), StringComparer.OrdinalIgnoreCase);
            var maps = archive.Files.Keys.Where(path => path.StartsWith("ProjectPBZ/Content/Maps/", StringComparison.Ordinal) &&
                path.EndsWith(".umap", StringComparison.OrdinalIgnoreCase)).ToArray();
            var flows = archive.Files.Keys.Where(path => path.Has("/FlowGraph/") && path.EndsWith(".uasset", StringComparison.OrdinalIgnoreCase));
            var known = catalog.Maps.SelectMany(map => map.Rows("points"))
                .Where(point => point.S("actor") != "").ToLookup(point => point.S("actor"), StringComparer.OrdinalIgnoreCase);
            var bells = catalog.Maps.SelectMany(map => map.Rows("points")).Where(point => point.S("kind") == "bell" && point.Get("position") is int[]).ToArray();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var points = new List<Row>();
            int unread = 0;
            foreach (var scene in archive.PackagesImporting(maps.Where(path => path.Has("/_Generated_/")), blueprints.Concat(flows)))
            {
                if (!scene.Value.Any(blueprintNames.Contains)) continue;
                string level = scene.Key.Split('/').FirstOrDefault(Levels.ContainsKey);
                if (level == null) continue;
                byte[] bytes = archive.ReadFile(scene.Key);
                string[] names = Catalog.Names(bytes);
                Export[] exports = Exports(bytes, names);
                var roots = exports.Where(entry => entry.Name == "DefaultSceneRoot").ToLookup(entry => entry.Outer);
                var components = exports.Where(entry => entry.Name.StartsWith("BP_PBZFlowComponent", StringComparison.Ordinal))
                    .ToLookup(entry => entry.Outer);
                for (int i = 0; i < exports.Length; i++)
                {
                    Export actor = exports[i];
                    if ((actor.Class & 0xc0000000) != 0x80000000) continue;
                    int imported = (int)(actor.Class & 0x3fffffff);
                    if (imported >= scene.Value.Length || !blueprintNames.Contains(scene.Value[imported]) ||
                        actor.Name.StartsWith("Default__", StringComparison.Ordinal)) continue;
                    string blueprint = scene.Value[imported];
                    string key = level + "-" + actor.Name + (actor.Number == 0 ? "" : "_" + (actor.Number - 1).ToString(CultureInfo.InvariantCulture));
                    if (!seen.Add(key)) continue;
                    try
                    {
                        string row;
                        Rewards rewards = ReadActor(bytes, names, actor, blueprint, loot, out row);
                        bool money = rewards.Money.Count > 0;
                        if (!money && rewards.Materials.Count == 0) continue;
                        Export root = roots[i].FirstOrDefault();
                        if (root == null) throw new InvalidDataException("缺少拾取物的场景根组件。");
                        int[] position = Location(bytes, names, root);
                        string[] memberMaps = Levels[level];
                        string region = known[key].FirstOrDefault().S("rawMap");
                        if (!memberMaps.Contains(region, StringComparer.OrdinalIgnoreCase))
                        {
                            string area = row.Split('.')[0];
                            region = memberMaps.FirstOrDefault(map => map.Equals(area, StringComparison.OrdinalIgnoreCase));
                            if (region == null) region = bells.Where(bell => memberMaps.Contains(bell.S("rawMap"), StringComparer.OrdinalIgnoreCase))
                                .OrderBy(bell => Collections.DistanceSquared(position, (int[])bell["position"])).FirstOrDefault().S("rawMap").Or(memberMaps[0]);
                        }
                        string[] categories = money && rewards.Materials.Count > 0 ? new[] { MoneyCategory, MaterialCategory }
                            : new[] { money ? MoneyCategory : MaterialCategory };
                        Row[] materials = rewards.Materials.OrderBy(pair => pair.Key, StringComparer.OrdinalIgnoreCase)
                            .Select(pair => Data.Make("name", catalog.Item("goods", pair.Key).S("name").Or(pair.Key), "amounts", pair.Value.ToArray())).ToArray();
                        string type = blueprint == "BP_Chest" ? "宝箱" : blueprint == "BP_HangingGift" ? "吊挂物" : "拾取物";
                        Row flow = ReadFlow(bytes, names, scene.Value, exports, components[i]);
                        points.Add(Data.Make("key", "scene-loot:" + key, "actor", key, "rawMap", region,
                            "position", position, "lootRow", row, "pickupCategories", categories,
                            "money", rewards.Money.ToArray(), "materials", materials, "pickupType", type,
                            "world", level, "cell", Path.GetFileNameWithoutExtension(scene.Key), "flow", flow));
                    }
                    catch (InvalidDataException) { unread++; }
                    catch (ArgumentException) { unread++; }
                    catch (OverflowException) { unread++; }
                }
            }
            if (unread > 0) catalog.Warnings.Add("有 " + unread + " 个场景物件结构未识别，拾取点列表可能不完整。");
            SceneLayers.Attach(archive, maps.Where(path => Levels.ContainsKey(Path.GetFileNameWithoutExtension(path))), points, catalog.Warnings);
            return points.ToArray();
        }

        public static string State(Row point, Dictionary<string, object> actors)
        {
            if (actors == null) return "unknown";
            string id = point.S("actor");
            object record;
            if (!actors.TryGetValue(id, out record) && !actors.TryGetValue(id.Substring(id.IndexOf('-') + 1), out record))
                return "missing";
            string type = point.S("pickupType");
            string field = type == "宝箱" ? "SwitchState" : type == "吊挂物" ? "Broken" : "Destroy";
            object value = record.Get(field);
            if (!(value is bool) || type == "吊挂物" && (bool)value) return "unknown";
            return (bool)value ? "done" : "missing";
        }
    }
}
