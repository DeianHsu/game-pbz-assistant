// 存档格式和密钥定位参考 PBZ-Editor（MIT），见 THIRD_PARTY_NOTICES.md。
using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;

namespace PBZ.Native
{
    internal sealed class SaveBlock
    {
        public string Name;
        public byte Algorithm;
        public int Size;
        public byte[] Sealed;
    }

    internal sealed class SaveContainer
    {
        const int MaxSave = 256 * 1024 * 1024;
        readonly byte[] data;
        readonly int count, directoryEnd;

        public SaveContainer(byte[] source)
        {
            data = source;
            if (data.Length < 12 || data.Length > MaxSave || Encoding.ASCII.GetString(data, 0, 4) != "PBZS" || data[4] != 3 || data[5] != 1)
                throw new InvalidDataException("存档容器格式不受支持。");
            count = BitConverter.ToUInt16(data, 6);
            uint directorySize = BitConverter.ToUInt32(data, 8);
            if (count == 0 || count > 4096 || directorySize < 36 || directorySize > data.Length - 12)
                throw new InvalidDataException("存档目录不完整。");
            directoryEnd = checked(12 + (int)directorySize);
        }

        static byte[] Slice(byte[] bytes, int start, int length)
        {
            byte[] result = new byte[length];
            Buffer.BlockCopy(bytes, start, result, 0, length);
            return result;
        }

        byte[] Unseal(byte[] block, byte[] key)
        {
            if (block.Length < 36 || Encoding.ASCII.GetString(block, 0, 4) != "PBZS" || block[4] != 1 || block[5] != 1 || block[6] != 0 || block[7] != 0)
                throw new InvalidDataException("存档加密块格式不受支持。");
            return AesGcmWindows.Decrypt(key, Slice(block, 8, 12), Slice(block, 20, 16), Slice(block, 36, block.Length - 36));
        }

        bool Matches(byte[] key)
        {
            try
            {
                byte[] plain = Unseal(Slice(data, 12, directoryEnd - 12), key);
                if (plain.Length < 12) return false;
                for (int i = 0; i < 12; i++) if (plain[i] != data[i]) return false;
                return true;
            }
            catch (CryptographicException) { return false; }
        }

        public byte[] FindKey(string executable)
        {
            using (FileStream file = new FileStream(executable, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            {
                if (file.Length < 64 || file.Length > 2L * 1024 * 1024 * 1024) throw new InvalidDataException("游戏程序大小不受支持。");
                HashSet<long> seen = new HashSet<long>();
                Func<long, byte[]> candidate = delegate(long offset)
                {
                    if (offset < 0 || offset + 64 > file.Length || !seen.Add(offset)) return null;
                    if (seen.Count > 128) throw new InvalidDataException("游戏存档密钥布局无法识别。");
                    byte[] material = new byte[64], key = new byte[32];
                    file.Position = offset;
                    if (file.Read(material, 0, material.Length) != material.Length) return null;
                    for (int i = 0; i < 32; i++) key[i] = (byte)(material[i] ^ material[i + 32]);
                    Array.Clear(material, 0, material.Length);
                    if (Matches(key)) return key;
                    Array.Clear(key, 0, key.Length);
                    return null;
                };
                byte[] found = candidate(203193128);
                if (found != null) return found;
                byte[] anchor = Encoding.Unicode.GetBytes("sealed but block is PLAINTEXT\0");
                const int stride = 1024 * 1024;
                byte[] buffer = new byte[stride + anchor.Length - 1];
                for (long start = 0; start < file.Length; start += stride)
                {
                    file.Position = start;
                    int n = file.Read(buffer, 0, (int)Math.Min(buffer.Length, file.Length - start));
                    for (int i = 0; i + anchor.Length <= n; i++)
                    {
                        if (buffer[i] != anchor[0]) continue;
                        int j = 1;
                        while (j < anchor.Length && buffer[i + j] == anchor[j]) j++;
                        if (j != anchor.Length) continue;
                        for (int padding = 0; padding < 16; padding++)
                        {
                            found = candidate(start + i + anchor.Length + padding);
                            if (found != null) return found;
                        }
                    }
                }
                throw new CryptographicException("无法验证存档密钥，请核对游戏版本或等待保存完成后重试。");
            }
        }

        public List<SaveBlock> ReadBlocks(byte[] key)
        {
            byte[] directory = Unseal(Slice(data, 12, directoryEnd - 12), key);
            if (directory.Length < 12) throw new InvalidDataException("存档目录不完整。");
            for (int i = 0; i < 12; i++) if (directory[i] != data[i]) throw new InvalidDataException("存档目录与文件头不一致。");
            List<SaveBlock> blocks = new List<SaveBlock>();
            HashSet<string> names = new HashSet<string>(StringComparer.Ordinal);
            int cursor = 12;
            uint end = 0;
            for (int i = 0; i < count; i++)
            {
                if (cursor + 2 > directory.Length) throw new InvalidDataException("存档目录不完整。");
                int length = BitConverter.ToUInt16(directory, cursor); cursor += 2;
                if (length == 0 || cursor + length + 14 > directory.Length) throw new InvalidDataException("存档槽名不完整。");
                string name = new UTF8Encoding(false, true).GetString(directory, cursor, length); cursor += length;
                byte algorithm = directory[cursor], flags = directory[cursor + 1];
                uint size = BitConverter.ToUInt32(directory, cursor + 2), offset = BitConverter.ToUInt32(directory, cursor + 6), blockSize = BitConverter.ToUInt32(directory, cursor + 10);
                cursor += 14;
                long start = (long)directoryEnd + offset;
                if (!names.Add(name) || flags != 1 || size > 64 * 1024 * 1024 || offset != end || blockSize < 36 || start + blockSize > data.Length)
                    throw new InvalidDataException("存档槽范围无法识别。");
                blocks.Add(new SaveBlock { Name = name, Algorithm = algorithm, Size = (int)size, Sealed = Slice(data, (int)start, (int)blockSize) });
                end = checked(offset + blockSize);
            }
            if (cursor != directory.Length || (long)directoryEnd + end != data.Length) throw new InvalidDataException("存档包含无法识别的数据。");
            return blocks;
        }

        public byte[] DecryptBlock(SaveBlock block, byte[] key) { return Unseal(block.Sealed, key); }
    }

    // 调用 Windows CNG，不依赖额外的加密运行时。
    internal static class AesGcmWindows
    {
        [StructLayout(LayoutKind.Sequential)]
        struct AuthInfo
        {
            public int Size, Version;
            public IntPtr Nonce; public int NonceSize;
            public IntPtr AdditionalData; public int AdditionalDataSize;
            public IntPtr Tag; public int TagSize;
            public IntPtr MacContext; public int MacContextSize, AdditionalDataProcessed;
            public long DataProcessed; public int Flags;
        }
        [DllImport("bcrypt.dll", CharSet = CharSet.Unicode)] static extern int BCryptOpenAlgorithmProvider(out IntPtr algorithm, string id, string implementation, int flags);
        [DllImport("bcrypt.dll", CharSet = CharSet.Unicode)] static extern int BCryptSetProperty(IntPtr handle, string property, byte[] value, int size, int flags);
        [DllImport("bcrypt.dll")] static extern int BCryptGenerateSymmetricKey(IntPtr algorithm, out IntPtr key, IntPtr keyObject, int keyObjectSize, byte[] secret, int secretSize, int flags);
        [DllImport("bcrypt.dll")] static extern int BCryptDecrypt(IntPtr key, byte[] input, int inputSize, ref AuthInfo info, IntPtr iv, int ivSize, byte[] output, int outputSize, out int resultSize, int flags);
        [DllImport("bcrypt.dll")] static extern int BCryptDestroyKey(IntPtr key);
        [DllImport("bcrypt.dll")] static extern int BCryptCloseAlgorithmProvider(IntPtr algorithm, int flags);
        static void Check(int status) { if (status < 0) throw new CryptographicException("Windows 加密操作失败（0x" + status.ToString("X8") + "）。"); }

        public static byte[] Decrypt(byte[] keyBytes, byte[] nonce, byte[] tag, byte[] cipher)
        {
            IntPtr algorithm = IntPtr.Zero, key = IntPtr.Zero;
            GCHandle nonceHandle = new GCHandle(), tagHandle = new GCHandle();
            try
            {
                Check(BCryptOpenAlgorithmProvider(out algorithm, "AES", null, 0));
                byte[] mode = Encoding.Unicode.GetBytes("ChainingModeGCM\0");
                Check(BCryptSetProperty(algorithm, "ChainingMode", mode, mode.Length, 0));
                Check(BCryptGenerateSymmetricKey(algorithm, out key, IntPtr.Zero, 0, keyBytes, keyBytes.Length, 0));
                nonceHandle = GCHandle.Alloc(nonce, GCHandleType.Pinned);
                tagHandle = GCHandle.Alloc(tag, GCHandleType.Pinned);
                AuthInfo info = new AuthInfo { Size = Marshal.SizeOf(typeof(AuthInfo)), Version = 1, Nonce = nonceHandle.AddrOfPinnedObject(), NonceSize = nonce.Length, Tag = tagHandle.AddrOfPinnedObject(), TagSize = tag.Length };
                byte[] output = new byte[cipher.Length];
                int written;
                Check(BCryptDecrypt(key, cipher, cipher.Length, ref info, IntPtr.Zero, 0, output, output.Length, out written, 0));
                if (written != output.Length) throw new CryptographicException("解密长度不一致。");
                return output;
            }
            finally
            {
                if (nonceHandle.IsAllocated) nonceHandle.Free();
                if (tagHandle.IsAllocated) tagHandle.Free();
                if (key != IntPtr.Zero) BCryptDestroyKey(key);
                if (algorithm != IntPtr.Zero) BCryptCloseAlgorithmProvider(algorithm, 0);
            }
        }
    }
}
