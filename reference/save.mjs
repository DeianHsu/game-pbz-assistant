// PBZS layout and key location adapted from qry6868/PBZ-Editor (MIT).
// https://github.com/qry6868/PBZ-Editor
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { MAX_SAVE_BYTES, assertSealed, saveLayout, saveBlocks, parseSaveSlot } from './save-format.mjs';

export const REFERENCE_BUILD = '26266538';
export const SUPPORTED_BUILDS = [REFERENCE_BUILD, '26367565'];
const keyCache = new Map();

function unseal(block, key) {
  assertSealed(block);
  const cipher = crypto.createDecipheriv('aes-256-gcm', key, block.subarray(8, 20));
  cipher.setAuthTag(block.subarray(20, 36));
  try { return Buffer.concat([cipher.update(block.subarray(36)), cipher.final()]); }
  catch { throw new Error('存档解密失败：版本可能不兼容，或游戏正在保存，请稍后刷新。'); }
}

export function readKey(gameDir, source) {
  if (!Buffer.isBuffer(source) || source.length < 12 || source.toString('ascii', 0, 4) !== 'PBZS') throw new Error('需要有效的 PBZS 存档来确认密钥。');
  const directorySize = source.readUInt32LE(8);
  if (directorySize < 36 || 12 + directorySize > source.length) throw new Error('存档目录不完整。');
  const directory = source.subarray(12, 12 + directorySize);
  const exe = path.join(gameDir, 'platform', 'steam', 'PBZ.exe');
  const stat = fs.statSync(exe), signature = `${stat.size}:${stat.mtimeMs}`;
  const cached = keyCache.get(exe);
  if (cached?.signature === signature) return cached.key;
  if (stat.size < 64 || stat.size > 2 * 1024 ** 3) throw new Error('游戏程序大小不受支持。');
  const fd = fs.openSync(exe, 'r');
  const seen = new Set();
  const candidate = offset => {
    if (offset < 0 || offset + 64 > stat.size || seen.has(offset)) return null;
    seen.add(offset);
    if (seen.size > 128) throw new Error('游戏存档密钥布局无法识别。');
    const material = Buffer.alloc(64);
    if (fs.readSync(fd, material, 0, 64, offset) !== 64) return null;
    const key = Buffer.from(material.subarray(0, 32).map((byte, i) => byte ^ material[i + 32]));
    try {
      if (unseal(directory, key).subarray(0, 12).equals(source.subarray(0, 12))) return key;
    } catch {}
    return null;
  };
  try {
    let key = candidate(203193128);
    if (!key) {
      // PBZ-Editor compatibility.py: adjacent XOR shares follow this native diagnostic string.
      // Authenticate every candidate with the save directory; never persist key material.
      const anchor = Buffer.from('sealed but block is PLAINTEXT\0', 'utf16le'), stride = 1024 * 1024;
      const chunk = Buffer.alloc(stride + anchor.length + 15 + 64);
      for (let start = 0; start < stat.size && !key; start += stride) {
        const length = fs.readSync(fd, chunk, 0, Math.min(chunk.length, stat.size - start), start);
        const bytes = chunk.subarray(0, length);
        for (let found = bytes.indexOf(anchor); found >= 0 && !key; found = bytes.indexOf(anchor, found + 1)) {
          for (let padding = 0; padding < 16 && !key; padding++) key = candidate(start + found + anchor.length + padding);
        }
      }
    }
    if (!key) throw new Error('无法验证新版游戏的存档密钥，请核对游戏版本或等待保存完成后重试。');
    keyCache.set(exe, { signature, key });
    return key;
  } finally { fs.closeSync(fd); }
}

export function decodeContainer(source, key, decompress) {
  const layout = saveLayout(source);
  const directory = unseal(source.subarray(12, layout.directoryEnd), key);
  const entries = [];
  for (const { name, algorithm, size, block } of saveBlocks(source, directory, layout)) {
    const packed = unseal(block, key);
    let raw;
    if (algorithm === 0) raw = packed;
    else if (algorithm === 1) raw = zlib.inflateSync(packed, { maxOutputLength: Math.max(1, size) });
    else if (algorithm === 2 && decompress) raw = decompress(packed, size);
    else throw new Error(`需要解码组件：存档槽 ${name}，压缩算法 ${algorithm}，大小 ${size}。`);
    entries.push({ name, json: parseSaveSlot(raw, size) });
  }
  return entries;
}

export function readSave(gameDir, savePath, decompress) {
  if (fs.statSync(savePath).size > MAX_SAVE_BYTES) throw new Error('存档文件超出支持大小。');
  const source = fs.readFileSync(savePath);
  return decodeContainer(source, readKey(gameDir, source), decompress);
}
