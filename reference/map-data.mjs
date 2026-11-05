// Read-only native map data, following the format also documented by PBZ-Editor.
import { assetNames } from './resources.mjs';

export class MapReader {
  constructor(b, names, p = 0) { this.b = b; this.names = names; this.p = p; }
  u32() { const n = this.b.readUInt32LE(this.p); this.p += 4; return n; }
  name() {
    const index = this.u32(), number = this.u32();
    if (index >= this.names.length) throw new Error(`地图名称字段无法识别：${this.p - 8}`);
    return this.names[index] + (number ? `_${number - 1}` : '');
  }
  string() {
    const n = this.b.readInt32LE(this.p); this.p += 4;
    if (Math.abs(n) > 1000000) throw new Error('地图字符串长度无法识别。');
    const size = Math.abs(n) * (n < 0 ? 2 : 1);
    const result = this.b.toString(n < 0 ? 'utf16le' : 'utf8', this.p, this.p + size).replace(/\0+$/, '');
    this.p += size; return result;
  }
  vector() { const xyz = [0, 4, 8].map(i => this.b.readInt32LE(this.p + i)); this.p += 12; return xyz; }
  header() {
    let index = 0; const props = [], masked = [];
    for (let i = 0; i < 20; i++) {
      const fragment = this.b.readUInt16LE(this.p); this.p += 2;
      index += fragment & 127;
      for (let j = 0; j < fragment >>> 9; j++) { props.push(index + j); if (fragment & 128) masked.push(index + j); }
      index += fragment >>> 9;
      if (fragment & 256) break;
      if (i === 19) throw new Error('地图属性头无法识别。');
    }
    const size = !masked.length ? 0 : masked.length <= 8 ? 1 : masked.length <= 16 ? 2 : Math.ceil(masked.length / 32) * 4;
    const zero = new Set(masked.filter((_, i) => this.b[this.p + Math.floor(i / 8)] & (1 << (i % 8))));
    this.p += size;
    return props.filter(p => !zero.has(p));
  }
  strings() { const count = this.u32(); if (count > 10000) throw new Error('地图事件数组过大。'); return Array.from({ length: count }, () => this.string()); }
}

export function readBell(r) {
  const point = { kind: 'bell' };
  for (const prop of r.header()) {
    if (prop === 0) point.id = r.name();
    else if (prop === 1) point.map = r.name();
    else if (prop === 2) point.position = r.vector();
    else throw new Error('铃铛点位结构变化。');
  }
  return point;
}
export function readDomain(r, kind) {
  const point = { kind, nodes: [] };
  for (const prop of r.header()) {
    if (prop === 0) point.actor = r.name();
    else if (prop === 1) point.id = r.name();
    else if (prop === 2) point.nodes = r.strings();
    else if (prop === 3) point.domain = r.name();
    else if (prop === 4) point.condition = r.name();
    else if (prop === 5) point.map = r.name();
    else if (prop === 6) point.position = r.vector();
    else throw new Error(`材料点位属性 ${prop} 未识别：${r.p}`);
  }
  return point;
}

export function readEquipment(r, kind) {
  const point = { kind, nodes: [] };
  for (const prop of r.header()) {
    if (prop === 0) point.id = r.name();
    else if (prop === 1) point.actor = r.name();
    else if (prop === 3) point.nodes = r.strings();
    else if (prop === 4) point.domain = r.name();
    else if (prop === 5) point.condition = r.name();
    else if (prop === 6) point.map = r.name();
    else if (prop === 7) point.position = r.vector();
    else throw new Error(`装备点位属性 ${prop} 未识别：${r.p}`);
  }
  return point;
}

const kinds = ['bell', 'blackstone', 'amber', 'flower', 'key', 'primary', 'weapon', 'phantom', 'accessory', 'medicine', 'banyan', 'pillar', 'scarecrow'];
export function readNativeMaps(store) {
  const b = store.readFile('ProjectPBZ/Content/PBZContent/Maps/DT_MapItemData.uasset');
  const r = new MapReader(b, assetNames(b), b.readUInt32LE(4));
  const root = r.header();
  if (root.join(',') !== '0,1' || r.u32() !== 0) throw new Error('地图收集表结构变化。');
  const count = r.u32(), maps = [];
  if (count > 100) throw new Error('地图数量不受支持。');
  for (let i = 0; i < count; i++) {
    const id = r.name(), points = [];
    for (const prop of r.header()) {
      if (!kinds[prop]) throw new Error('地图收集分类无法识别。');
      const length = r.u32();
      if (length > 10000) throw new Error('地图收集点数量异常。');
      for (let j = 0; j < length; j++) {
        const point = prop === 0 ? readBell(r) : prop >= 6 && prop <= 9 ? readEquipment(r, kinds[prop]) : readDomain(r, kinds[prop]);
        points.push({ ...point, key: `${id}:${kinds[prop]}:${j}`, rawMap: id, order: j + 1 });
      }
    }
    if (id.toLowerCase() !== 'test') maps.push({ id, points });
  }
  return maps;
}

export function readMapGroups(store) {
  const b = store.readFile('ProjectPBZ/Content/PBZContent/UI/InGame/Map/DA_MapIDAsset.uasset');
  const r = new MapReader(b, assetNames(b), b.readUInt32LE(4));
  if (r.header().join(',') !== '0' || r.u32() !== 0) throw new Error('地图分组结构无法识别。');
  const count = r.u32(), groups = [];
  for (let i = 0; i < count; i++) {
    const id = r.name();
    if (r.header().join(',') !== '0') throw new Error('地图子区结构变化。');
    const children = Array.from({ length: r.u32() }, () => r.name());
    if (id.toLowerCase() !== 'test') groups.push({ id, members: children.length ? children : [id] });
  }
  return groups;
}

export function readMapLabels(store, loc) {
  const b = store.readFile('ProjectPBZ/Content/PBZContent/DataTable/UI/DT_MapData.uasset'), names = assetNames(b);
  const marker = Buffer.from('0800000044656661756c7400', 'hex'), labels = {};
  for (let p = b.indexOf(marker, b.readUInt32LE(4)); p >= 0; p = b.indexOf(marker, p + 1)) {
    for (const distance of [20, 24]) {
      try {
        const r = new MapReader(b, names, p - distance), id = r.name(), props = r.header(), map = r.name();
        if (!props.includes(0) || !props.includes(1) || r.p + 2 !== p) continue;
        const text = new MapReader(b, names, p + marker.length).string();
        if (loc.has(text)) labels[id.toLowerCase()] = { name: loc.get(text), map, order: Object.keys(labels).length };
      } catch { /* Only native MapName text records match this layout. */ }
    }
  }
  return labels;
}

export function buildMapCatalog(store, loc, items) {
  const maps = readNativeMaps(store), groups = readMapGroups(store), labels = readMapLabels(store, loc);
  return groups.map(group => {
    const members = group.members.map(s => s.toLowerCase());
    const points = maps.filter(m => members.includes(m.id.toLowerCase())).flatMap(m => m.points)
      .filter(p => !['primary', 'key'].includes(p.kind))
      .map(p => ({ ...p, name: p.kind === 'bell' ? loc.get(p.id) || ({ Bell_FJZL_GP_002: '镜林龙柱' }[p.id]) || p.id : (() => { const item = items.find(i => i.id.toLowerCase() === p.id?.toLowerCase()); return p.kind === 'flower' && /[\u4e00-\u9fff]/.test(item?.rowName || '') ? item.rowName : item?.name || p.id || ''; })(),
        category: ['weapon', 'phantom'].includes(p.kind) ? 'weapon' : ['accessory', 'medicine'].includes(p.kind) ? 'accessory' : ['banyan', 'pillar', 'scarecrow'].includes(p.kind) ? 'challenge' : p.kind }));
    return { id: group.id, name: labels[group.id.toLowerCase()]?.name || `未命名地区（${group.id}）`, members: group.members, points };
  }).filter(m => m.points.length > 0);
}
