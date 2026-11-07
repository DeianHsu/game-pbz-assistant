using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    internal static class SceneLayers
    {
        internal sealed class Layer
        {
            public readonly string Name;
            public readonly bool InitiallyActive;
            public readonly Layer Parent;
            public Layer(string name, bool initiallyActive, Layer parent)
            {
                Name = name;
                InitiallyActive = initiallyActive;
                Parent = parent;
            }
        }

        static readonly int[] BaseCell = { 0, 2, 9, 10, 12 };
        static readonly int[] LayeredCell = { 0, 2, 3, 9, 10, 12 };

        public static void Attach(IoArchive archive, IEnumerable<string> worlds, List<Row> points, List<string> warnings)
        {
            var assets = archive.Files.Keys.Where(path => path.StartsWith("ProjectPBZ/Content/DataLayers/", StringComparison.Ordinal) &&
                path.EndsWith(".uasset", StringComparison.OrdinalIgnoreCase));
            var groups = points.ToLookup(point => point.S("world"), StringComparer.OrdinalIgnoreCase);
            try
            {
                foreach (var world in archive.PackagesImporting(worlds, assets))
                {
                    var group = groups[Path.GetFileNameWithoutExtension(world.Key)].ToArray();
                    try { AttachWorld(archive, world.Key, world.Value, group); }
                    catch (InvalidDataException) { /* Keep pickup locations when a world uses an unrecognized layout. */ }
                    catch (ArgumentException) { }
                    catch (OverflowException) { }
                }
            }
            catch (InvalidDataException) { }
            int unread = points.Count(point => point.Get("layers") == null);
            if (unread > 0) warnings.Add(unread + " 个普通拾取点的场景分区未能确认。");
        }

        static void AttachWorld(IoArchive archive, string world, string[] imports, Row[] points)
        {
            int headerSize = Catalog.Offset(archive.ReadFile(world, 0, 76), 4);
            byte[] header = archive.ReadFile(world, 0, headerSize);
            string[] names = Catalog.Names(header);
            var exports = SceneLoot.Exports(header, names, true);
            var cells = points.ToLookup(point => point.S("cell"));
            var layerIndices = new Dictionary<string, int>();
            var layers = new Dictionary<int, Layer>();
            for (int i = 0; i < exports.Length; i++)
                if (exports[i].Name.StartsWith("DataLayer_", StringComparison.Ordinal)) layerIndices.Add(exports[i].Name, i);

            // Runtime cell and layer metadata are small exports scattered through the world package.
            var pages = new Dictionary<int, byte[]>();
            Func<SceneLoot.Export, MapCatalog.MapReader> read = entry =>
            {
                const int pageSize = 65536, exportLimit = 512;
                if (entry.End - entry.Start > exportLimit) throw new InvalidDataException("场景分区结构变化。");
                int page = entry.Start / pageSize * pageSize;
                byte[] bytes;
                if (!pages.TryGetValue(page, out bytes)) pages[page] = bytes = archive.ReadFile(world, page, pageSize + exportLimit);
                return new MapCatalog.MapReader(GameBytes.Slice(bytes, entry.Start - page, entry.End - entry.Start), names, 0);
            };
            foreach (var entry in exports.Where(entry => cells.Contains(entry.Name)))
            {
                var map = read(entry);
                int[] fields = map.Header();
                Layer[] resolved;
                if (fields.SequenceEqual(BaseCell)) resolved = new Layer[0];
                else if (fields.SequenceEqual(LayeredCell))
                {
                    map.Reader.Take(5); // Streaming level reference and spatial loading flag.
                    if (!map.Header().SequenceEqual(new[] { 1 })) continue; // FDataLayerInstanceNames.
                    resolved = new Layer[map.Reader.Count(32)];
                    for (int i = 0; i < resolved.Length; i++)
                    {
                        int index;
                        if (layerIndices.TryGetValue(map.Name(), out index))
                            resolved[i] = ReadLayer(index, exports, read, header, imports, layers, 0);
                    }
                    if (resolved.Any(layer => layer == null)) continue;
                }
                else continue;
                foreach (Row point in cells[entry.Name]) point["layers"] = resolved;
            }
        }

        static Layer ReadLayer(int index, SceneLoot.Export[] exports, Func<SceneLoot.Export, MapCatalog.MapReader> read,
            byte[] header, string[] imports, Dictionary<int, Layer> layers, int depth)
        {
            if (index < 0 || index >= exports.Length || depth > 12 || !exports[index].Name.StartsWith("DataLayer_", StringComparison.Ordinal))
                throw new InvalidDataException("场景分区父级无效。");
            Layer layer;
            if (layers.TryGetValue(index, out layer)) return layer;
            var map = read(exports[index]);
            string name = "";
            int state = 0, parent = 0;
            foreach (int field in map.Header())
                switch (field)
                {
                    case 0: name = IoArchive.ImportedAsset(header, map.Reader.I32(), imports); break;
                    case 1: state = map.Reader.Take(1)[0]; break;
                    case 2: parent = map.Reader.I32(); break;
                    default: throw new InvalidDataException("场景分区属性变化。");
                }
            if (name == "" || state > 2 || parent < 0) throw new InvalidDataException("场景分区未识别。");
            layer = new Layer(name, state == 2, parent == 0 ? null : ReadLayer(parent - 1, exports, read, header, imports, layers, depth + 1));
            layers.Add(index, layer);
            return layer;
        }
    }
}
