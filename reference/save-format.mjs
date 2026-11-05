export const MAX_SAVE_BYTES = 256 * 1024 * 1024;
const decoder = new TextDecoder('utf-8', { ignoreBOM: true });
const view = bytes => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
const matches = (bytes, prefix) => prefix.every((byte, i) => bytes[i] === byte);

export function assertSealed(block) {
  if (block.length < 36 || !matches(block, [0x50, 0x42, 0x5a, 0x53, 1, 1, 0, 0])) {
    throw new Error('存档加密块格式无法识别。');
  }
}

export function saveLayout(source) {
  if (source.length < 12 || source.length > MAX_SAVE_BYTES || !matches(source, [0x50, 0x42, 0x5a, 0x53])) {
    throw new Error('不是支持的影之刃零存档。');
  }
  const header = view(source), count = header.getUint16(6, true), directorySize = header.getUint32(8, true);
  if (source[4] !== 3 || source[5] !== 1 || !count || count > 4096 || directorySize < 36 || 12 + directorySize > source.length) {
    throw new Error('存档容器版本或目录不受支持。');
  }
  return { count, directoryEnd: 12 + directorySize };
}

export function* saveBlocks(source, directory, { count, directoryEnd }) {
  if (directory.length < 12 || !matches(directory, source.subarray(0, 12))) {
    throw new Error('存档目录与文件头不一致。');
  }
  const fields = view(directory), names = new Set();
  let cursor = 12, end = 0;
  for (let i = 0; i < count; i++) {
    if (cursor + 2 > directory.length) throw new Error('存档目录不完整。');
    const length = fields.getUint16(cursor, true); cursor += 2;
    if (!length || cursor + length + 14 > directory.length) throw new Error('存档槽名不完整。');
    const name = decoder.decode(directory.subarray(cursor, cursor + length)); cursor += length;
    const algorithm = directory[cursor], flags = directory[cursor + 1];
    const size = fields.getUint32(cursor + 2, true), offset = fields.getUint32(cursor + 6, true);
    const blockSize = fields.getUint32(cursor + 10, true);
    cursor += 14;
    const start = directoryEnd + offset;
    if (names.has(name) || flags !== 1 || size > 64 * 1024 * 1024 || offset !== end || blockSize < 36 || start + blockSize > source.length) {
      throw new Error('存档槽范围无法识别。');
    }
    yield { name, algorithm, size, block: source.subarray(start, start + blockSize) };
    names.add(name); end = offset + blockSize;
  }
  if (cursor !== directory.length || directoryEnd + end !== source.length) throw new Error('存档包含无法识别的数据。');
}

export function parseSaveSlot(raw, size) {
  if (raw.length !== size) throw new Error('存档槽解压大小不一致。');
  const json = JSON.parse(decoder.decode(raw));
  if (!json || Array.isArray(json) || typeof json !== 'object') throw new Error('存档槽结构无法识别。');
  return json;
}
