using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    internal static class MapCatalog
    {
        const string Root = "ProjectPBZ/Content/PBZContent/";
        static readonly string[] Kinds = { "bell", "blackstone", "amber", "flower", "key", "primary", "weapon", "phantom", "accessory", "medicine", "banyan", "pillar", "scarecrow" };
        internal sealed class MapReader
        {
            public readonly GameBytes Reader;
            readonly string[] names;
            public MapReader(byte[] bytes, string[] names, int offset) { Reader = new GameBytes(bytes, offset); this.names = names; }
            public string Name()
            {
                int index = Reader.Count(names.Length - 1);
                uint number = Reader.U32();
                return names[index] + (number == 0 ? "" : "_" + (number - 1));
            }
            public int[] Header()
            {
                int index = 0;
                var props = new List<int>();
                var masked = new List<int>();
                for (int i = 0; i < 20; i++)
                {
                    int fragment = Reader.U16(), length = fragment >> 9;
                    index += fragment & 127;
                    for (int j = 0; j < length; j++)
                    {
                        props.Add(index + j);
                        if ((fragment & 128) != 0) masked.Add(index + j);
                    }
                    index += length;
                    if ((fragment & 256) != 0)
                    {
                        int count = masked.Count;
                        int size = count == 0 ? 0 : count <= 8 ? 1 : count <= 16 ? 2 : (count + 31) / 32 * 4;
                        var mask = Reader.Take(size);
                        for (int j = 0; j < count; j++) if ((mask[j / 8] & (1 << (j % 8))) != 0) props.Remove(masked[j]);
                        return props.ToArray();
                    }
                }
                throw new InvalidDataException("地图属性头无法识别。");
            }
            public int[] Vector() { return new[] { Reader.I32(), Reader.I32(), Reader.I32() }; }
            public string[] Strings() { return Enumerable.Range(0, Reader.Count(10000)).Select(i => Reader.String()).ToArray(); }
        }

        static MapReader Open(byte[] bytes, int[] expected)
        {
            var map = new MapReader(bytes, Catalog.Names(bytes), Catalog.Offset(bytes, 4));
            if (!map.Header().SequenceEqual(expected) || map.Reader.U32() != 0) throw new InvalidDataException("地图表结构变化。");
            return map;
        }
        static Row ReadPoint(MapReader map, int kind)
        {
            var point = Data.Make("kind", Kinds[kind]);
            int[] props = map.Header();
            if (kind == 0)
            {
                foreach (int prop in props)
                    switch (prop)
                    {
                        case 0: point["id"] = map.Name(); break;
                        case 1: point["map"] = map.Name(); break;
                        case 2: point["position"] = map.Vector(); break;
                        default: throw new InvalidDataException("铃铛结构变化。");
                    }
                return point;
            }
            bool equipment = kind >= 6 && kind <= 9;
            point["nodes"] = new string[0];
            foreach (int prop in props)
            {
                if (prop == 0 || prop == 1) { point[(prop == 0) == equipment ? "id" : "actor"] = map.Name(); continue; }
                switch (prop - (equipment ? 1 : 0))
                {
                    case 2: point["nodes"] = map.Strings(); break;
                    case 3: point["domain"] = map.Name(); break;
                    case 4: point["condition"] = map.Name(); break;
                    case 5: point["map"] = map.Name(); break;
                    case 6: point["position"] = map.Vector(); break;
                    default: throw new InvalidDataException("地图点位结构变化。");
                }
            }
            return point;
        }
        static Row[] ReadPoints(IoArchive archive)
        {
            var map = Open(archive.ReadFile(Root + "Maps/DT_MapItemData.uasset"), new[] { 0, 1 });
            var points = new List<Row>();
            int count = map.Reader.Count(100);
            for (int i = 0; i < count; i++)
            {
                string id = map.Name();
                foreach (int kind in map.Header())
                {
                    if (kind >= Kinds.Length) throw new InvalidDataException("地图收集分类无法识别。");
                    int length = map.Reader.Count(10000);
                    for (int j = 0; j < length; j++)
                    {
                        var point = ReadPoint(map, kind);
                        if (id.Equals("test", StringComparison.OrdinalIgnoreCase) || kind == 4 || kind == 5) continue;
                        point["rawMap"] = id;
                        point["key"] = id + ":" + Kinds[kind] + ":" + j;
                        point["order"] = j + 1;
                        points.Add(point);
                    }
                }
            }
            return points.ToArray();
        }
        static Dictionary<string, string> Labels(IoArchive archive, Catalog catalog)
        {
            byte[] bytes = archive.ReadFile(Root + "DataTable/UI/DT_MapData.uasset");
            string[] names = Catalog.Names(bytes);
            var labels = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var marker = Catalog.TextMarker;
            for (int p = GameBytes.Find(bytes, marker, Catalog.Offset(bytes, 4)); p >= 0; p = GameBytes.Find(bytes, marker, p + 1))
            {
                foreach (int distance in new[] { 20, 24 })
                {
                    try
                    {
                        var map = new MapReader(bytes, names, p - distance);
                        string id = map.Name();
                        int[] props = map.Header();
                        map.Name();
                        if (!props.Contains(0) || !props.Contains(1) || map.Reader.Position + 2 != p) continue;
                        string text = catalog.Local(new GameBytes(bytes, p + marker.Length).String());
                        if (text != "") labels[id] = text;
                    }
                    catch (InvalidDataException) { }
                    catch (ArgumentException) { }
                }
            }
            return labels;
        }
        public static Row[] Read(IoArchive archive, Catalog catalog)
        {
            Row[] points = ReadPoints(archive);
            var labels = Labels(archive, catalog);
            foreach (var point in points)
            {
                string kind = point.S("kind"), id = point.S("id");
                Row item = catalog.Items.FirstOrDefault(i => i.S("id").Equals(id, StringComparison.OrdinalIgnoreCase));
                point["name"] = kind == "bell" ? catalog.Local(id).Or(id == "Bell_FJZL_GP_002" ? "镜林龙柱" : id)
                    : kind == "flower" && Regex.IsMatch(item.S("rowName"), @"[\u4e00-\u9fff]") ? item.S("rowName") : item.S("name").Or(id);
                point["category"] = kind == "phantom" ? "weapon" : kind == "medicine" ? "accessory"
                    : kind == "banyan" || kind == "pillar" || kind == "scarecrow" ? "challenge" : kind;
            }
            var group = Open(archive.ReadFile(Root + "UI/InGame/Map/DA_MapIDAsset.uasset"), new[] { 0 });
            var result = new List<Row>();
            int count = group.Reader.Count(100);
            for (int i = 0; i < count; i++)
            {
                string id = group.Name();
                if (!group.Header().SequenceEqual(new[] { 0 })) throw new InvalidDataException("地图子区结构变化。");
                string[] children = Enumerable.Range(0, group.Reader.Count(100)).Select(j => group.Name()).ToArray();
                if (children.Length == 0) children = new[] { id };
                var list = points.Where(p => children.Contains(p.S("rawMap"), StringComparer.OrdinalIgnoreCase)).ToArray();
                if (id.Equals("test", StringComparison.OrdinalIgnoreCase) || list.Length == 0) continue;
                string label;
                if (!labels.TryGetValue(id, out label)) label = "未命名地区（" + id + "）";
                result.Add(Data.Make("id", id, "name", label, "members", children, "points", list));
            }
            return result.ToArray();
        }
    }
}
