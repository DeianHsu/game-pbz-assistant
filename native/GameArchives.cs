// IoStore and Pak layout adapted from PBZ-Editor (MIT). See THIRD_PARTY_NOTICES.md.
using System;
using System.IO;
using System.IO.Compression;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Security.Cryptography;
using System.Runtime.InteropServices;

namespace PBZ.Native
{
    internal sealed class GameBytes
    {
        public const int Limit = 64 * 1024 * 1024;
        public readonly byte[] Bytes;
        public int Position;
        public GameBytes(byte[] bytes, int position = 0) { Bytes = bytes; Position = position; }
        public byte[] Take(int count)
        {
            var value = Slice(Bytes, Position, count);
            Position += count;
            return value;
        }
        public static byte[] Slice(byte[] bytes, int offset, int count)
        {
            if (offset < 0 || count < 0 || offset > bytes.Length - count) throw new InvalidDataException("游戏数据范围不完整。");
            var result = new byte[count];
            Buffer.BlockCopy(bytes, offset, result, 0, count);
            return result;
        }
        public static byte[] Range(string file, long start, long length)
        {
            if (start < 0 || length < 0 || length > Limit) throw new InvalidDataException("游戏资源范围不受支持。");
            using (var reader = new BinaryReader(new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete)))
            {
                reader.BaseStream.Position = start;
                var bytes = reader.ReadBytes((int)length);
                if (bytes.Length != length) throw new EndOfStreamException("游戏资源读取不完整。");
                return bytes;
            }
        }
        public uint U32() { uint value = BitConverter.ToUInt32(Bytes, Position); Position += 4; return value; }
        public int I32() { return unchecked((int)U32()); }
        public ushort U16() { ushort value = BitConverter.ToUInt16(Bytes, Position); Position += 2; return value; }
        public long I64() { long value = BitConverter.ToInt64(Bytes, Position); Position += 8; return value; }
        public int Count(int max = 1000000)
        {
            uint value = U32();
            if (value > max) throw new InvalidDataException("游戏数据条目数量异常。");
            return (int)value;
        }
        public string String()
        {
            int n = I32();
            if (n < -16000000 || n > 16000000) throw new InvalidDataException("游戏文本长度不受支持。");
            return (n < 0 ? Encoding.Unicode.GetString(Take(-n * 2)) : Encoding.UTF8.GetString(Take(n))).TrimEnd('\0');
        }
        public static long IntBytes(byte[] bytes, int at, int n, bool bigEndian = false)
        {
            long value = 0;
            for (int i = 0; i < n; i++) value = value * 256 + bytes[at + (bigEndian ? i : n - i - 1)];
            return value;
        }
        public static int Find(byte[] data, byte[] marker, int start)
        {
            while (start <= data.Length - marker.Length)
            {
                int at = Array.IndexOf(data, marker[0], start);
                if (at < 0 || at > data.Length - marker.Length) return -1;
                int i = 1;
                while (i < marker.Length && data[at + i] == marker[i]) i++;
                if (i == marker.Length) return at;
                start = at + 1;
            }
            return -1;
        }
        public static byte[] Hex(string s)
        {
            var result = new byte[s.Length / 2];
            for (int i = 0; i < result.Length; i++) result[i] = Convert.ToByte(s.Substring(i * 2, 2), 16);
            return result;
        }
    }

    internal static class GameCompression
    {
        [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
        delegate int Decode([In] byte[] source, int length, [Out] byte[] target, int size);
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern IntPtr GetModuleHandle(string module);
        [DllImport("kernel32.dll", ExactSpelling = true)] static extern IntPtr GetProcAddress(IntPtr module, string symbol);
        static readonly Lazy<Decode> Decoder = new Lazy<Decode>(() =>
        {
            IntPtr address = GetProcAddress(GetModuleHandle(null), "PBZ_Decompress");
            if (address == IntPtr.Zero) throw new InvalidOperationException("程序缺少内置的 Oodle 解压代码。");
            return (Decode)Marshal.GetDelegateForFunctionPointer(address, typeof(Decode));
        });

        public static byte[] Unpack(byte[] source, int size, string method)
        {
            if (size < 0 || size > GameBytes.Limit) throw new InvalidDataException("解压长度不受支持。");
            if (method == "None" && source.Length == size) return source;
            var output = new byte[size];
            if (method == "Oodle" && Decoder.Value(source, source.Length, output, size) == size) return output;
            if (method == "Zlib" && source.Length >= 6 && (source[0] & 15) == 8 &&
                (source[0] * 256 + source[1]) % 31 == 0 && (source[1] & 32) == 0)
            {
                using (var input = new MemoryStream(source, 2, source.Length - 6))
                using (var stream = new DeflateStream(input, CompressionMode.Decompress))
                {
                    int at = 0;
                    while (at < size)
                    {
                        int count = stream.Read(output, at, size - at);
                        if (count == 0) break;
                        at += count;
                    }
                    uint a = 1, b = 0;
                    foreach (byte value in output) { a = (a + value) % 65521; b = (b + a) % 65521; }
                    if (at == size && stream.ReadByte() == -1 && (b << 16 | a) == GameBytes.IntBytes(source, source.Length - 4, 4, true))
                        return output;
                }
            }
            throw new InvalidDataException("游戏数据解压失败（" + method + "）。");
        }
    }

    internal static class ResourceCrypto
    {
        static readonly byte[] Key = GameBytes.Hex("4BC8A51E5381325073F2BC7D4E3089CD557C4E9B7D453901C2C795518867E01D");
        public static byte[] Decrypt(byte[] bytes)
        {
            using (var aes = Aes.Create())
            {
                aes.Key = Key;
                aes.Mode = CipherMode.ECB;
                aes.Padding = PaddingMode.None;
                using (var transform = aes.CreateDecryptor()) return transform.TransformFinalBlock(bytes, 0, bytes.Length);
            }
        }
        public static int Padded(int size, bool encrypted) { return encrypted ? (size + 15) & ~15 : size; }
    }

    internal sealed class IoArchive
    {
        readonly string file;
        readonly byte[] toc;
        readonly int blockSize, offsetsStart, blocksStart;
        readonly ulong partitionSize;
        readonly bool encrypted;
        readonly string[] methods;
        public readonly Dictionary<string, int> Files = new Dictionary<string, int>();
        public IoArchive(string game)
        {
            file = Path.Combine(game, @"ProjectPBZ\Content\Paks\ProjectPBZ-Windows.utoc");
            toc = GameBytes.Range(file, 0, new FileInfo(file).Length);
            if (Encoding.ASCII.GetString(toc, 0, 16) != "-==--==--==--==-" || Read(20) != 144 || Read(32) != 12)
                throw new InvalidDataException("游戏资源版本不受支持。");
            int count = Read(24), blocks = Read(28), methodCount = Read(36), methodLength = Read(40), flags = toc[80];
            blockSize = Read(44);
            partitionSize = BitConverter.ToUInt64(toc, 88);
            encrypted = (flags & 2) != 0;
            if (blockSize <= 0 || partitionSize == 0 || methodCount < 0 || methodCount > 100) throw new InvalidDataException("IoStore 块格式不受支持。");
            offsetsStart = checked(144 + count * 12);
            blocksStart = checked(offsetsStart + count * 10 + Read(84) * 4 + Read(96) * 4);
            int methodsStart = checked(blocksStart + blocks * 12);
            methods = new[] { "None" }.Concat(Enumerable.Range(0, methodCount)
                .Select(i => Encoding.ASCII.GetString(toc, methodsStart + i * methodLength, methodLength).Split('\0')[0])).ToArray();
            int directoryStart = checked(methodsStart + methodCount * methodLength);
            if ((flags & 4) != 0) directoryStart = checked(directoryStart + 4 + 2 * Read(directoryStart) + blocks * 20);
            var directory = GameBytes.Slice(toc, directoryStart, Read(48));
            var r = new GameBytes(encrypted ? ResourceCrypto.Decrypt(directory) : directory);
            r.String();
            var dirs = Enumerable.Range(0, r.Count()).Select(i => new[] { r.I32(), r.I32(), r.I32(), r.I32() }).ToArray();
            var files = Enumerable.Range(0, r.Count()).Select(i => new[] { r.I32(), r.I32(), r.I32() }).ToArray();
            var names = Enumerable.Range(0, r.Count()).Select(i => r.String()).ToArray();
            var seenDirs = new HashSet<int>();
            var seenFiles = new HashSet<int>();
            Action<int, string, int> walk = null;
            walk = (index, parent, depth) =>
            {
                if (depth > 256 || !seenDirs.Add(index)) throw new InvalidDataException("IoStore 目录结构不受支持。");
                var entry = dirs[index];
                string prefix = entry[0] == -1 ? parent : parent + names[entry[0]] + "/";
                for (int f = entry[3]; f != -1; f = files[f][1])
                {
                    if (!seenFiles.Add(f)) throw new InvalidDataException("IoStore 文件索引不受支持。");
                    Files[prefix + names[files[f][0]]] = files[f][2];
                }
                for (int child = entry[1]; child != -1; child = dirs[child][2]) walk(child, prefix, depth + 1);
            };
            if (dirs.Length > 0) walk(0, "", 0);
        }
        int Read(int position) { return BitConverter.ToInt32(toc, position); }
        public byte[] ReadFile(string name)
        {
            int index;
            if (!Files.TryGetValue(name, out index)) throw new FileNotFoundException("游戏资源缺失：" + name);
            int position = checked(offsetsStart + index * 10);
            long offset = GameBytes.IntBytes(toc, position, 5, true), length = GameBytes.IntBytes(toc, position + 5, 5, true);
            if (length > GameBytes.Limit) throw new InvalidDataException("游戏资源过大。");
            if (length == 0) return new byte[0];
            long first = offset / blockSize, last = (offset + length - 1) / blockSize;
            using (var output = new MemoryStream())
            {
                for (long i = first; i <= last; i++)
                {
                    int at = checked((int)(blocksStart + i * 12));
                    ulong disk = (ulong)GameBytes.IntBytes(toc, at, 5);
                    int packed = (int)GameBytes.IntBytes(toc, at + 5, 3), raw = (int)GameBytes.IntBytes(toc, at + 8, 3);
                    int method = toc[at + 11];
                    ulong partition = disk / partitionSize;
                    string path = Path.ChangeExtension(file, null) + (partition == 0 ? "" : "_s" + partition) + ".ucas";
                    var bytes = GameBytes.Range(path, (long)(disk % partitionSize), ResourceCrypto.Padded(packed, encrypted));
                    if (encrypted) bytes = GameBytes.Slice(ResourceCrypto.Decrypt(bytes), 0, packed);
                    byte[] chunk = GameCompression.Unpack(bytes, raw, methods[method]);
                    output.Write(chunk, 0, chunk.Length);
                }
                return GameBytes.Slice(output.ToArray(), (int)(offset - first * blockSize), (int)length);
            }
        }
    }

    internal sealed class PakArchive
    {
        readonly string file;
        readonly bool encrypted;
        readonly string[] methods;
        readonly byte[] encoded;
        readonly Dictionary<string, int> files = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        public PakArchive(string game)
        {
            file = Path.Combine(game, @"ProjectPBZ\Content\Paks\ProjectPBZ-Windows.pak");
            var footer = GameBytes.Range(file, new FileInfo(file).Length - 221, 221);
            if (BitConverter.ToUInt32(footer, 17) != 0x5a6f12e1 || BitConverter.ToInt32(footer, 21) != 12)
                throw new InvalidDataException("Pak 版本不受支持。");
            encrypted = footer[16] != 0;
            methods = new[] { "None" }.Concat(Enumerable.Range(0, 5).Select(i => Encoding.ASCII.GetString(footer, 61 + i * 32, 32).Split('\0')[0])).ToArray();
            var r = new GameBytes(Index(BitConverter.ToInt64(footer, 25), BitConverter.ToInt64(footer, 33), GameBytes.Slice(footer, 41, 20)));
            r.String();
            r.Count();
            r.I64();
            byte[] directory = null;
            for (int part = 0; part < 2; part++)
            {
                if (r.U32() == 0) continue;
                var bytes = Index(r.I64(), r.I64(), r.Take(20));
                if (part == 1) directory = bytes;
            }
            encoded = r.Take(r.Count(GameBytes.Limit));
            if (r.U32() != 0 || directory == null) throw new InvalidDataException("Pak 索引结构不受支持。");
            var d = new GameBytes(directory);
            int dirs = d.Count();
            for (int i = 0; i < dirs; i++)
            {
                string prefix = d.String().TrimStart('/');
                int count = d.Count();
                for (int j = 0; j < count; j++)
                {
                    string name = d.String();
                    int offset = d.I32();
                    if (offset != int.MinValue) files[prefix + name] = offset;
                }
            }
        }
        byte[] Index(long offset, long length, byte[] expected)
        {
            var bytes = GameBytes.Range(file, offset, length);
            if (encrypted) bytes = ResourceCrypto.Decrypt(bytes);
            using (var sha = SHA1.Create())
                if (!sha.ComputeHash(bytes).SequenceEqual(expected)) throw new InvalidDataException("Pak 索引校验失败。");
            return bytes;
        }
        public byte[] ReadFile(string name)
        {
            int position;
            if (!files.TryGetValue(name, out position)) throw new FileNotFoundException("Pak 资源缺失：" + name);
            var r = new GameBytes(encoded, position);
            uint bits = r.U32();
            int method = (int)(bits >> 23 & 63), count = (int)(bits >> 6 & 65535);
            bool blockEncrypted = (bits & (1U << 22)) != 0;
            int blockSize = (int)(bits & 63);
            blockSize = blockSize == 63 ? r.Count(GameBytes.Limit) : blockSize * 2048;
            Func<int, long> variable = bit => (bits & (1U << bit)) != 0 ? r.U32() : r.I64();
            long offset = variable(31), raw = variable(30), packed = method == 0 ? raw : variable(29);
            if (raw < 0 || raw > GameBytes.Limit || packed < 0 || packed > GameBytes.Limit) throw new InvalidDataException("Pak 资源过大。");
            int[] lengths = method == 0 || count == 1 && !blockEncrypted ? new[] { (int)packed }
                : Enumerable.Range(0, count).Select(i => r.Count(GameBytes.Limit)).ToArray();
            int headerSize = 53 + (method == 0 ? 0 : 4 + count * 16);
            var data = new GameBytes(GameBytes.Range(file, checked(offset + headerSize), lengths.Sum(n => (long)ResourceCrypto.Padded(n, blockEncrypted))));
            using (var output = new MemoryStream())
            {
                foreach (int length in lengths)
                {
                    var block = data.Take(ResourceCrypto.Padded(length, blockEncrypted));
                    if (blockEncrypted) block = GameBytes.Slice(ResourceCrypto.Decrypt(block), 0, length);
                    int expected = (int)Math.Min(blockSize == 0 ? raw : blockSize, raw - output.Length);
                    var bytes = GameCompression.Unpack(block, expected, methods[method]);
                    output.Write(bytes, 0, bytes.Length);
                }
                if (output.Length != raw) throw new InvalidDataException("Pak 资源长度不一致。");
                return output.ToArray();
            }
        }
    }
}
