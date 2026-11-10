// Game table layouts adapted from PBZ-Editor (MIT).
using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    internal sealed class Catalog
    {
        const string Root = "ProjectPBZ/Content/PBZContent/";
        internal static readonly byte[] TextMarker = GameBytes.Hex("0800000044656661756c7400");
        public readonly List<Row> Quests = new List<Row>();
        public readonly List<Row> Items = new List<Row>();
        public readonly Row[] Achievements;
        public readonly Row[] Maps;
        public readonly Row[] ScenePickups;
        public readonly List<string> Warnings = new List<string>();
        public readonly Dictionary<string, string> Localization;
        readonly Dictionary<string, string> bells = new Dictionary<string, string>();

        public Catalog(string game)
        {
            var archive = new IoArchive(game);
            Localization = ReadLocalization(new PakArchive(game).ReadFile("ProjectPBZ/Content/Localization/Game/zh-Hans/Game.locres"));
            try { bells = MapCatalog.BellNames(archive, this); }
            catch (Exception) { Warnings.Add("铃铛名称表未识别，使用本地化名称。"); }
            foreach (string file in archive.Files.Keys.Where(file => Regex.IsMatch(file, @"/PBZQuest/[^/]+/[^/]+\.uasset$")))
                Quests.Add(ReadQuest(file, archive.ReadFile(file)));
            Achievements = Names(archive.ReadFile(Root + "DataTable/DT_Achievement.uasset"))
                .Where(name => Regex.IsMatch(name, @"^ACH_\d{3}$")).OrderBy(name => name, StringComparer.Ordinal)
                .Select(id =>
                {
                    int number = int.Parse(id.Substring(4));
                    return Data.Make("id", id, "name", Local("Achievement_Name_" + number).Or(id), "description", Local("Achievement_Des_" + number));
                }).ToArray();
            string[] paths = { "Item/DT_InventoryData", "UI/DT_WeaponData", "UI/DT_ShaqiWeaponData", "UI/DT_Accessory", "UI/DT_MedicineTable" };
            string[] categories = { "goods", "weapon", "phantom", "accessory", "medicine" };
            for (int i = 0; i < paths.Length; i++)
            {
                try { Items.AddRange(ReadItems(archive.ReadFile(Root + "DataTable/" + paths[i] + ".uasset"), categories[i])); }
                catch (Exception error) { Warnings.Add(categories[i] + " 物品名称未识别：" + error.Message); }
            }
            try { Maps = MapCatalog.Read(archive, this); }
            catch (Exception error) { Warnings.Add("地图收集表未识别：" + error.Message); Maps = new Row[0]; }
            try { ScenePickups = SceneLoot.Read(archive, this); }
            catch (Exception error) { Warnings.Add("普通拾取点未识别：" + error.Message); ScenePickups = new Row[0]; }
        }

        public string Local(string key)
        {
            string value;
            return key != null && Localization.TryGetValue(key, out value) ? value : "";
        }
        public string BellName(string id)
        {
            string name;
            return id != null && bells.TryGetValue(id, out name) ? name : Local(id);
        }
        public Row Item(string category, string id)
        {
            return Items.FirstOrDefault(i => i.S("category") == category && string.Equals(i.S("id"), id, StringComparison.OrdinalIgnoreCase));
        }
        public static int Offset(byte[] bytes, int at) { return checked((int)BitConverter.ToUInt32(bytes, at)); }

        static Dictionary<string, string> ReadLocalization(byte[] bytes)
        {
            var r = new GameBytes(bytes);
            if (!r.Take(16).SequenceEqual(GameBytes.Hex("0e147475674a03fc4a15909dc3377f1b")) || r.Take(1)[0] != 3)
                throw new InvalidDataException("本地化资源版本不受支持。");
            int offset = checked((int)r.I64());
            r.U32();
            var records = new List<KeyValuePair<string, int>>();
            int namespaces = r.Count();
            for (int i = 0; i < namespaces; i++)
            {
                r.U32();
                r.String();
                int count = r.Count();
                for (int j = 0; j < count; j++)
                {
                    r.U32();
                    string key = r.String();
                    r.U32();
                    records.Add(new KeyValuePair<string, int>(key, r.I32()));
                }
            }
            var s = new GameBytes(bytes, offset);
            var strings = new string[s.Count()];
            for (int i = 0; i < strings.Length; i++) { strings[i] = s.String(); s.I32(); }
            var local = new Dictionary<string, string>();
            foreach (var record in records)
                if (record.Value >= 0 && record.Value < strings.Length) local[record.Key] = strings[record.Value];
            return local;
        }

        internal static string[] Names(byte[] bytes)
        {
            int count = Offset(bytes, 60), length = Offset(bytes, 64);
            if (count == 0 || count > 200000) throw new InvalidDataException("游戏名称表无法识别。");
            int headers = 76 + count * 8, start = headers + count * 2, position = start;
            var names = new string[count];
            for (int i = 0; i < count; i++)
            {
                int h = (int)GameBytes.IntBytes(bytes, headers + 2 * i, 2, true);
                bool wide = (h & 0x8000) != 0;
                int size = (h & 0x7fff) * (wide ? 2 : 1);
                names[i] = (wide ? Encoding.Unicode : Encoding.UTF8).GetString(bytes, position, size);
                position += size;
            }
            if (position - start != length) throw new InvalidDataException("游戏名称表长度不一致。");
            return names;
        }

        static IEnumerable<string> TextKeys(byte[] bytes, int start, int end)
        {
            for (int p = start; p + 4 < end; p++)
            {
                int n = BitConverter.ToInt32(bytes, p);
                if (n < 2 || n > 256 || p + 4 + n > end || bytes[p + 3 + n] != 0) continue;
                string key = Encoding.ASCII.GetString(bytes, p + 4, n - 1);
                if (Regex.IsMatch(key, @"^[A-Za-z][A-Za-z0-9_-]+$")) yield return key;
            }
        }
        Row ReadQuest(string file, byte[] bytes)
        {
            string[] names = Names(bytes);
            int asset = Offset(bytes, 4), start = Offset(bytes, 32), end = Offset(bytes, 36);
            string title = TextKeys(bytes, asset, bytes.Length).FirstOrDefault(k => Localization.ContainsKey(k) && !Regex.IsMatch(k, "SubTitle|Details|Des|BPTYPE"));
            if ((end - start) % 72 != 0 || end > bytes.Length || start > end) throw new InvalidDataException("任务导出表结构变化。");
            var branches = new Row();
            for (int p = start; p < end; p += 72)
            {
                int index = (int)(BitConverter.ToUInt32(bytes, p + 16) & 0x3fffffff);
                if (index >= names.Length || names[index] != "PBZQuestBranch") continue;
                int off = checked(asset + (int)BitConverter.ToUInt64(bytes, p));
                int size = checked((int)BitConverter.ToUInt64(bytes, p + 8));
                if (size < 12 || off > bytes.Length - size) continue;
                index = Offset(bytes, off + size - 12);
                if (index >= names.Length || Offset(bytes, off + size - 8) != 0 || Offset(bytes, off + size - 4) != 0) continue;
                string[] keys = TextKeys(bytes, off, off + size).ToArray();
                string objective = keys.FirstOrDefault(k => Regex.IsMatch(k, @"^Quest.*Des_"));
                string details = keys.FirstOrDefault(k => Regex.IsMatch(k, @"^Quest.*Details_"));
                if (objective != null) branches[names[index]] = Data.Make("objective", Local(objective).Or(objective), "details", Local(details));
            }
            string id = Path.GetFileNameWithoutExtension(file);
            return Data.Make("id", id, "name", Local(title).Or(id), "type", file.Split('/').Reverse().Skip(1).First(),
                "branches", branches, "nativeInterruptionTags", names.Where(n => Regex.IsMatch(n, @"任务中断|变怪|pz\.后街\.进入")).ToArray());
        }
        IEnumerable<Row> ReadItems(byte[] bytes, string category)
        {
            string[] names = Names(bytes);
            int asset = Offset(bytes, 4), count = Offset(bytes, asset + 10), start = asset + 14;
            var starts = new List<int>();
            bool weapon = category == "weapon" || category == "phantom";
            if (weapon)
            {
                var signature = new byte[14];
                BitConverter.GetBytes(Array.IndexOf(names, category == "weapon" ? "Weapon.Slot.Main" : "Weapon.Slot.ShaChi")).CopyTo(signature, 0);
                GameBytes.Hex("800301800301").CopyTo(signature, 8);
                starts.Add(start);
                for (int p = GameBytes.Find(bytes, signature, 0); p >= 0; p = GameBytes.Find(bytes, signature, p + 1))
                    if (p + signature.Length < bytes.Length) starts.Add(p + signature.Length);
            }
            else
            {
                ushort schema = BitConverter.ToUInt16(bytes, start + 8);
                for (int p = start; p < bytes.Length - 12; p++)
                    if (BitConverter.ToUInt32(bytes, p) < names.Length && BitConverter.ToUInt32(bytes, p + 4) == 0 && BitConverter.ToUInt16(bytes, p + 8) == schema)
                        starts.Add(p);
            }
            if (starts.Count != count) throw new InvalidDataException("物品表行数与原生计数不一致。");
            var seen = new HashSet<string>();
            for (int i = 0; i < starts.Count; i++)
            {
                int p = starts[i], end = i + 1 < starts.Count ? starts[i + 1] : bytes.Length;
                string row = names[Offset(bytes, p)];
                int idOffset = end - (weapon ? 24 : 17);
                if (category == "goods" && (BitConverter.ToUInt32(bytes, idOffset) >= names.Length || BitConverter.ToUInt32(bytes, idOffset + 4) > 1000000)) idOffset = end - 24;
                int index = Offset(bytes, idOffset), number = Offset(bytes, idOffset + 4);
                if (index >= names.Length || number > 1000000) throw new InvalidDataException("物品 ID 字段不受支持。");
                string id = names[index] + (number == 0 ? "" : "_" + (number - 1));
                if (id == "" || id == "None" || !seen.Add(id)) continue;
                var keys = new List<string>();
                for (int m = GameBytes.Find(bytes, TextMarker, p); m >= 0 && m < end; m = GameBytes.Find(bytes, TextMarker, m + 1))
                {
                    try { keys.Add(new GameBytes(bytes, m + TextMarker.Length).String()); }
                    catch (InvalidDataException) { }
                    catch (ArgumentException) { }
                }
                string nameKey = keys.FirstOrDefault(k => Localization.ContainsKey(k));
                string localized = Local(nameKey), name = localized.Or(row);
                bool letter = name.Contains("<LetterBold");
                if (letter) name = Regex.Match(name, "<LetterBold[^>]*>(.*?)</", RegexOptions.Singleline).Groups[1].Value.Or(row);
                else if (Regex.IsMatch(nameKey ?? "", "Des|Function")) name = row;
                name = Regex.Replace(name, "<[^>]*>", "").Split('\n')[0].Trim();
                string descriptionKey = keys.FirstOrDefault(k => k != nameKey && Localization.ContainsKey(k) && Regex.IsMatch(k, "Des|Description|Function"));
                string description = Regex.Replace(Local(descriptionKey).Or(letter ? localized : ""), "<[^>]*>", "").Trim();
                yield return Data.Make("id", id, "name", name, "category", category, "rowName", row, "description", description);
            }
        }
    }
}
