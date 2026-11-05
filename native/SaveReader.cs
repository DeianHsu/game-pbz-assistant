using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Row = System.Collections.Generic.Dictionary<string, object>;

namespace PBZ.Native
{
    internal sealed class Account
    {
        public readonly Row Entries;
        public readonly string[] Slots;
        public readonly string Preferred;
        public readonly DateTime Modified;
        public Account(Row entries, DateTime modified)
        {
            Entries = entries;
            Modified = modified;
            Slots = entries.Where(pair => pair.Value.Get("PBZGameSystem") is Row && pair.Value.Get("Narrative") is Row)
                .Select(pair => pair.Key).ToArray();
            if (Slots.Length == 0) throw new InvalidDataException("存档没有可读的游戏槽位。");
            string continued = entries.Get("__Advanced__").S("LastContinueSlot");
            Preferred = Slots.Contains(continued) ? continued : Slots.OrderByDescending(slot => Time(slot), StringComparer.Ordinal).First();
        }
        public string Time(string slot) { return Entries.Get(slot).Get("PBZGameSystem").S("DateTimeString"); }
    }

    internal static class SaveReader
    {
        public static Account Read(string game, string save)
        {
            var before = new FileInfo(save);
            long size = before.Length;
            DateTime modified = before.LastWriteTimeUtc;
            if (size < 12 || size > 256 * 1024 * 1024) throw new InvalidDataException("存档长度不受支持。");
            byte[] bytes;
            using (var file = new BinaryReader(new FileStream(save, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete)))
                bytes = file.ReadBytes((int)size);
            var container = new SaveContainer(bytes);
            byte[] key = container.FindKey(Path.Combine(game, @"platform\steam\PBZ.exe"));
            var entries = new Row();
            try
            {
                foreach (SaveBlock block in container.ReadBlocks(key))
                {
                    string method;
                    switch (block.Algorithm)
                    {
                        case 0: method = "None"; break;
                        case 1: method = "Zlib"; break;
                        case 2: method = "Oodle"; break;
                        default: throw new InvalidDataException("存档使用了不支持的压缩算法：" + block.Algorithm);
                    }
                    entries.Add(block.Name, Data.Parse(GameCompression.Unpack(container.DecryptBlock(block, key), block.Size, method)));
                }
            }
            finally { Array.Clear(key, 0, key.Length); }
            before.Refresh();
            if (before.Length != size || before.LastWriteTimeUtc != modified) throw new IOException("读取时存档发生变化，请稍后重试。");
            return new Account(entries, modified);
        }
    }
}
