// Read-only IoStore layout adapted from PBZ-Editor/resources_reader.py (MIT).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { decompress } from 'ooz-wasm';
import { buildMapCatalog, readBellNames } from './map-data.mjs';

const PAK_KEY = Buffer.from('4BC8A51E5381325073F2BC7D4E3089CD557C4E9B7D453901C2C795518867E01D', 'hex');
const LIMIT = 64 * 1024 * 1024;
function decrypt(data) {
  const cipher = crypto.createDecipheriv('aes-256-ecb', PAK_KEY, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(data), cipher.final()]);
}
class Reader {
  constructor(data, position = 0) { this.data = data; this.p = position; }
  take(n) {
    if (n < 0 || this.p + n > this.data.length) throw new Error('游戏资源不完整。');
    const data = this.data.subarray(this.p, this.p + n); this.p += n; return data;
  }
  u32() { return this.take(4).readUInt32LE(); }
  i32() { return this.take(4).readInt32LE(); }
  string() {
    const n = this.i32();
    if (Math.abs(n) > 16000000) throw new Error('资源字符串长度无法识别。');
    return this.take(Math.abs(n) * (n < 0 ? 2 : 1)).toString(n < 0 ? 'utf16le' : 'utf8').replace(/\0+$/, '');
  }
}
function readRange(file, start, length) {
  if (!Number.isSafeInteger(start) || start < 0 || length < 0 || length > LIMIT) throw new Error('资源范围不受支持。');
  const fd = fs.openSync(file, 'r'), data = Buffer.alloc(length);
  try { if (fs.readSync(fd, data, 0, length, start) !== length) throw new Error('资源读取不完整。'); }
  finally { fs.closeSync(fd); }
  return data;
}

export class IoStore {
  constructor(gameDir) {
    this.file = path.join(gameDir, 'ProjectPBZ/Content/Paks/ProjectPBZ-Windows.utoc');
    const b = this.data = fs.readFileSync(this.file);
    if (b.toString('ascii', 0, 16) !== '-==--==--==--==-' || b.readUInt32LE(20) !== 144 || b.readUInt32LE(32) !== 12)
      throw new Error('游戏资源版本不受支持。');
    this.count = b.readUInt32LE(24);
    const blocks = b.readUInt32LE(28), methods = b.readUInt32LE(36), methodLength = b.readUInt32LE(40);
    this.blockSize = b.readUInt32LE(44); this.flags = b[80];
    this.partitionSize = Number(b.readBigUInt64LE(88));
    this.offsetsStart = 144 + this.count * 12;
    this.blocksStart = this.offsetsStart + this.count * 10 + b.readUInt32LE(84) * 4 + b.readUInt32LE(96) * 4;
    const methodsStart = this.blocksStart + blocks * 12;
    this.methods = ['None', ...Array.from({ length: methods }, (_, i) => b.toString('ascii', methodsStart + i * methodLength, methodsStart + (i + 1) * methodLength).split('\0')[0])];
    let directoryStart = methodsStart + methods * methodLength;
    if (this.flags & 4) directoryStart += 4 + 2 * b.readUInt32LE(directoryStart) + blocks * 20;
    let directory = b.subarray(directoryStart, directoryStart + b.readUInt32LE(48));
    if (this.flags & 2) directory = decrypt(directory);
    const r = new Reader(directory); r.string();
    const dirs = Array.from({ length: r.u32() }, () => Array.from({ length: 4 }, () => r.u32()));
    const files = Array.from({ length: r.u32() }, () => Array.from({ length: 3 }, () => r.u32()));
    const names = Array.from({ length: r.u32() }, () => r.string());
    this.files = new Map();
    const absent = 0xffffffff;
    const walk = (ix, parent) => {
      const [name, firstChild, , firstFile] = dirs[ix];
      const current = name === absent ? parent : [...parent, names[name]];
      let f = firstFile, child = firstChild;
      while (f !== absent) {
        const [filename, next, chunk] = files[f];
        this.files.set([...current, names[filename]].join('/'), chunk); f = next;
      }
      while (child !== absent) { walk(child, current); child = dirs[child][2]; }
    };
    if (dirs.length) walk(0, []);
  }
  readFile(name) {
    const index = this.files.get(name);
    if (index === undefined) throw new Error(`游戏资源缺失：${name}`);
    const b = this.data, p = this.offsetsStart + index * 10;
    const offset = b.readUIntBE(p, 5), length = b.readUIntBE(p + 5, 5);
    if (length > LIMIT) throw new Error('游戏资源过大。');
    const first = Math.floor(offset / this.blockSize), last = Math.floor((offset + length - 1) / this.blockSize);
    const result = [];
    for (let i = first; i <= last; i++) {
      const entry = this.blocksStart + i * 12;
      const disk = b.readUIntLE(entry, 5), packedSize = b.readUIntLE(entry + 5, 3), rawSize = b.readUIntLE(entry + 8, 3), method = b[entry + 11];
      const part = Math.floor(disk / this.partitionSize), local = disk % this.partitionSize;
      const file = this.file.replace(/\.utoc$/, part ? `_s${part}.ucas` : '.ucas');
      let data = readRange(file, local, this.flags & 2 ? Math.ceil(packedSize / 16) * 16 : packedSize);
      if (this.flags & 2) data = decrypt(data);
      data = data.subarray(0, packedSize);
      if (method) {
        if (this.methods[method] !== 'Oodle') throw new Error('不支持的游戏资源压缩方式。');
        data = Buffer.from(decompress(data, rawSize));
      }
      if (data.length !== rawSize) throw new Error('游戏资源解压长度不一致。');
      result.push(data);
    }
    const start = offset - first * this.blockSize;
    return Buffer.concat(result).subarray(start, start + length);
  }
}

export function assetNames(b) {
  const count = b.readUInt32LE(60), stringLength = b.readUInt32LE(64);
  if (!count || count > 200000) throw new Error('任务资源名称表无法识别。');
  const headers = 76 + count * 8;
  let p = headers + count * 2; const start = p, names = [];
  for (let i = 0; i < count; i++) {
    const h = b.readUInt16BE(headers + i * 2), length = (h & 0x7fff) * (h & 0x8000 ? 2 : 1);
    names.push(b.toString(h & 0x8000 ? 'utf16le' : 'utf8', p, p + length)); p += length;
  }
  if (p - start !== stringLength) throw new Error('任务资源名称表长度不一致。');
  return names;
}

// PBZ Pak v12 layout adapted from PBZ-Editor/pak_reader.py (MIT).
export class PakReader {
  constructor(gameDir) {
    this.file = path.join(gameDir, 'ProjectPBZ/Content/Paks/ProjectPBZ-Windows.pak');
    const footer = readRange(this.file, fs.statSync(this.file).size - 221, 221);
    if (footer.readUInt32LE(17) !== 0x5a6f12e1 || footer.readUInt32LE(21) !== 12) throw new Error('Pak 版本不受支持。');
    this.encrypted = Boolean(footer[16]);
    this.methods = ['None', ...Array.from({ length: 5 }, (_, i) => footer.toString('ascii', 61 + i * 32, 93 + i * 32).split('\0')[0])];
    const index = (offset, length, checksum) => {
      let data = readRange(this.file, offset, length);
      if (this.encrypted) data = decrypt(data);
      if (!crypto.createHash('sha1').update(data).digest().equals(checksum)) throw new Error('Pak 索引校验失败。');
      return data;
    };
    const r = new Reader(index(Number(footer.readBigUInt64LE(25)), Number(footer.readBigUInt64LE(33)), footer.subarray(41, 61)));
    r.string(); const count = r.u32(); r.take(8);
    let directory;
    for (let part = 0; part < 2; part++) if (r.u32()) {
      const offset = Number(r.take(8).readBigUInt64LE()), length = Number(r.take(8).readBigUInt64LE()), checksum = r.take(20);
      const data = index(offset, length, checksum); if (part === 1) directory = data;
    }
    this.encoded = r.take(r.u32());
    if (r.u32() || !directory || count > 1000000) throw new Error('Pak 索引结构不受支持。');
    const d = new Reader(directory); this.files = new Map(); const dirs = d.u32();
    for (let i = 0; i < dirs; i++) {
      const prefix = d.string(), files = d.u32();
      for (let j = 0; j < files; j++) {
        const name = d.string(), offset = d.i32();
        if (offset !== -2147483648) this.files.set((prefix.replace(/^\//, '') + name).toLowerCase(), offset);
      }
    }
  }
  readFile(name) {
    const position = this.files.get(name.toLowerCase());
    if (position === undefined) throw new Error(`Pak 资源缺失：${name}`);
    const r = new Reader(this.encoded, position), bits = r.u32();
    const method = (bits >>> 23) & 63, encrypted = Boolean(bits & (1 << 22)), count = (bits >>> 6) & 0xffff;
    let blockSize = bits & 63; blockSize = blockSize === 63 ? r.u32() : blockSize * 2048;
    const variable = bit => bits & (1 << bit) ? r.u32() : Number(r.take(8).readBigUInt64LE());
    const offset = variable(31), rawSize = variable(30), packedSize = method ? variable(29) : rawSize;
    if (rawSize > LIMIT || packedSize > LIMIT) throw new Error('Pak 资源过大。');
    const headerSize = 53 + (method ? 4 + count * 16 : 0);
    const lengths = method ? (count === 1 && !encrypted ? [packedSize] : Array.from({ length: count }, () => r.u32())) : [packedSize];
    const data = readRange(this.file, offset + headerSize, lengths.reduce((sum, n) => sum + (encrypted ? Math.ceil(n / 16) * 16 : n), 0));
    let cursor = 0, total = 0; const result = [];
    for (const length of lengths) {
      const padded = encrypted ? Math.ceil(length / 16) * 16 : length;
      let block = data.subarray(cursor, cursor + padded); cursor += padded;
      if (encrypted) block = decrypt(block);
      block = block.subarray(0, length);
      const expected = Math.min(blockSize || rawSize, rawSize - total);
      const raw = !method ? block : this.methods[method] === 'Oodle' ? Buffer.from(decompress(block, expected)) : this.methods[method] === 'Zlib' ? zlib.inflateSync(block, { maxOutputLength: expected }) : null;
      if (!raw || raw.length !== expected) throw new Error('Pak 资源解压失败。');
      result.push(raw); total += raw.length;
    }
    if (total !== rawSize) throw new Error('Pak 资源长度不一致。');
    return Buffer.concat(result);
  }
}

export function localization(data) {
  const r = new Reader(data);
  if (r.take(16).toString('hex') !== '0e147475674a03fc4a15909dc3377f1b' || r.take(1)[0] !== 3) throw new Error('本地化资源版本不受支持。');
  const stringsOffset = Number(r.take(8).readBigInt64LE()); r.u32();
  const entries = [];
  const namespaces = r.u32();
  for (let i = 0; i < namespaces; i++) {
    r.u32(); const namespace = r.string(), count = r.u32();
    for (let j = 0; j < count; j++) { r.u32(); const key = r.string(); r.u32(); entries.push({ namespace, key, index: r.i32() }); }
  }
  const s = new Reader(data, stringsOffset), strings = [], count = s.u32();
  for (let i = 0; i < count; i++) { strings.push(s.string()); s.i32(); }
  return entries.filter(e => e.index >= 0 && e.index < strings.length).map(e => ({ namespace: e.namespace, key: e.key, value: strings[e.index] }));
}

function textKeys(b, start, end) {
  const result = [];
  for (let p = start; p + 4 < end; p++) {
    const n = b.readInt32LE(p);
    if (n < 2 || n > 256 || p + 4 + n > end || b[p + 3 + n] !== 0) continue;
    const key = b.toString('ascii', p + 4, p + 3 + n);
    if (/^[A-Za-z][A-Za-z0-9_-]+$/.test(key)) result.push(key);
  }
  return [...new Set(result)];
}

export function buildQuestCatalog(gameDir) {
  const store = new IoStore(gameDir);
  const loc = new Map(localization(new PakReader(gameDir).readFile('ProjectPBZ/Content/Localization/Game/zh-Hans/Game.locres')).map(e => [e.key, e.value]));
  const quests = [];
  for (const file of store.files.keys()) {
    if (!/\/PBZQuest\/[^/]+\/[^/]+\.uasset$/.test(file)) continue;
    const b = store.readFile(file), names = assetNames(b), base = b.readUInt32LE(4);
    const keys = textKeys(b, base, b.length);
    const titleKey = keys.find(k => loc.has(k) && !/SubTitle|Details|Des/.test(k) && !/BPTYPE/.test(k));
    const branches = {};
    const start = b.readUInt32LE(32), end = b.readUInt32LE(36);
    if ((end - start) % 72) throw new Error('任务导出表结构变化，无法生成任务目录。');
    for (let p = start; p < end; p += 72) {
      if (names[b.readUInt32LE(p + 16) & 0x3fffffff] !== 'PBZQuestBranch') continue;
      const off = base + Number(b.readBigUInt64LE(p)), size = Number(b.readBigUInt64LE(p + 8));
      if (size < 12 || off + size > b.length) continue;
      const id = names[b.readUInt32LE(off + size - 12)];
      if (!id || b.readUInt32LE(off + size - 8) !== 0 || b.readUInt32LE(off + size - 4) !== 0) continue;
      const branchKeys = textKeys(b, off, off + size);
      const objectiveKey = branchKeys.find(k => /^Quest.*Des_/.test(k));
      const detailsKey = branchKeys.find(k => /^Quest.*Details_/.test(k));
      if (objectiveKey) branches[id] = { objective: loc.get(objectiveKey) || objectiveKey, details: loc.get(detailsKey) || '' };
    }
    const id = path.basename(file, '.uasset');
    const type = file.split('/').at(-2);
    quests.push({ id, name: loc.get(titleKey) || id, type, branches,
      nativeInterruptionTags: names.filter(n => /任务中断|变怪|pz\.后街\.进入/.test(n)) });
  }
  const bells = Object.fromEntries([...loc].filter(([key]) => /^Bell_/.test(key)));
  const achievementNames = assetNames(store.readFile('ProjectPBZ/Content/PBZContent/DataTable/DT_Achievement.uasset'));
  const achievements = achievementNames.filter(n => /^ACH_\d{3}$/.test(n)).sort().map(id => {
    const number = Number(id.slice(4));
    return { id, name: loc.get(`Achievement_Name_${number}`) || id, description: loc.get(`Achievement_Des_${number}`) || '' };
  });
  const items = [], warnings = [];
  try { Object.assign(bells, readBellNames(store, loc)); }
  catch { warnings.push('铃铛名称表未识别，使用本地化名称。'); }
  for (const [category, file] of [
    ['goods', 'Item/DT_InventoryData'], ['weapon', 'UI/DT_WeaponData'],
    ['phantom', 'UI/DT_ShaqiWeaponData'], ['accessory', 'UI/DT_Accessory'], ['medicine', 'UI/DT_MedicineTable']
  ]) {
    try { items.push(...itemTable(store.readFile(`ProjectPBZ/Content/PBZContent/DataTable/${file}.uasset`), category, loc)); }
    catch (error) { warnings.push(`${category} 物品名称未识别：${error.message}`); }
  }
  let maps = [];
  try { maps = buildMapCatalog(store, loc, items, bells); }
  catch (error) { warnings.push(`地图收集表未识别：${error.message}`); }
  return { quests, bells, achievements, items, maps, warnings };
}

// Native item row boundaries/ID offsets follow PBZ-Editor/catalog_builder.py.
function itemTable(b, category, loc) {
  const names = assetNames(b), base = b.readUInt32LE(4), declared = b.readUInt32LE(base + 10), start = base + 14;
  const starts = [], weapon = category === 'weapon' || category === 'phantom';
  if (weapon) {
    const signature = Buffer.alloc(14);
    signature.writeUInt32LE(names.indexOf(category === 'weapon' ? 'Weapon.Slot.Main' : 'Weapon.Slot.ShaChi'));
    Buffer.from('800301800301', 'hex').copy(signature, 8);
    starts.push(start);
    for (let p = b.indexOf(signature); p >= 0; p = b.indexOf(signature, p + 1)) {
      if (p + signature.length < b.length) starts.push(p + signature.length);
    }
  } else {
    const schema = b.subarray(start + 8, start + 10);
    for (let p = start; p < b.length - 12; p++) {
      if (b.readUInt32LE(p) < names.length && b.readUInt32LE(p + 4) === 0 && b.subarray(p + 8, p + 10).equals(schema)) starts.push(p);
    }
  }
  if (starts.length !== declared) throw new Error('物品表行数与原生计数不一致');
  const result = [], seen = new Set(), marker = Buffer.from('0800000044656661756c7400', 'hex');
  for (let i = 0; i < starts.length; i++) {
    const p = starts[i], end = starts[i + 1] || b.length, row = names[b.readUInt32LE(p)];
    let idOffset = end - (weapon ? 24 : 17);
    if (category === 'goods' && (b.readUInt32LE(idOffset) >= names.length || b.readUInt32LE(idOffset + 4) > 1000000)) idOffset = end - 24;
    const index = b.readUInt32LE(idOffset), number = b.readUInt32LE(idOffset + 4);
    if (index >= names.length || number > 1000000) throw new Error('物品 ID 字段不受支持');
    const id = names[index] + (number ? `_${number - 1}` : '');
    if (!id || id === 'None' || seen.has(id)) continue;
    const keys = [];
    for (let m = b.indexOf(marker, p); m >= 0 && m < end; m = b.indexOf(marker, m + 1)) {
      try { keys.push(new Reader(b, m + marker.length).string()); } catch {}
    }
    const nameKey = keys.find(k => loc.has(k));
    let name = loc.get(nameKey) || row;
    if (name.includes('<LetterBold')) name = name.match(/<LetterBold[^>]*>(.*?)<\//s)?.[1] || row;
    else if (/Des|Function/.test(nameKey || '')) name = row;
    name = name.replace(/<[^>]*>/g, '').split('\n')[0].trim();
    const descriptionKey = keys.find(k => loc.has(k) && k !== nameKey && /Des|Description|Function/.test(k));
    const description = (loc.get(descriptionKey) || (loc.get(nameKey)?.includes('<LetterBold') ? loc.get(nameKey) : '') || '').replace(/<[^>]*>/g, '').trim();
    result.push({ id, name, category, rowName: row, description }); seen.add(id);
  }
  return result;
}
