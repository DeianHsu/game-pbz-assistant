import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { readKey } from '../reference/save.mjs';

function encryptedDirectory(key) {
  const header = Buffer.alloc(12);
  header.write('PBZS'); header[4] = 3; header[5] = 1;
  header.writeUInt16LE(1, 6); header.writeUInt32LE(48, 8);
  const nonce = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  const encrypted = Buffer.concat([cipher.update(header), cipher.final()]);
  return Buffer.concat([header, Buffer.from('50425a5301010000', 'hex'), nonce, cipher.getAuthTag(), encrypted]);
}
function executable(t, bytes) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'pbz-key-test-'));
  fs.mkdirSync(path.join(folder, 'platform/steam'), { recursive: true });
  fs.writeFileSync(path.join(folder, 'platform/steam/PBZ.exe'), bytes);
  t.after(() => {
    const target = path.resolve(folder);
    assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
    assert.ok(path.basename(target).startsWith('pbz-key-test-'));
    fs.rmSync(target, { recursive: true });
  });
  return folder;
}

test('更新后密钥位置可跨读取块移动，错误候选不能通过目录认证', t => {
  const image = Buffer.alloc(2 * 1024 * 1024), anchor = Buffer.from('sealed but block is PLAINTEXT\0', 'utf16le');
  anchor.copy(image, 80); // A diagnostic-string match without the correct shares.
  const key = crypto.randomBytes(32), share = crypto.randomBytes(32), offset = 1024 * 1024 - 10;
  anchor.copy(image, offset);
  const material = offset + anchor.length + 7;
  share.copy(image, material);
  Buffer.from(share.map((v, i) => v ^ key[i])).copy(image, material + 32);
  assert.deepEqual(readKey(executable(t, image), encryptedDirectory(key)), key);
});
test('仅有定位字符串而认证密钥不匹配时拒绝解码', t => {
  const image = Buffer.alloc(256);
  Buffer.from('sealed but block is PLAINTEXT\0', 'utf16le').copy(image, 80);
  assert.throws(() => readKey(executable(t, image), encryptedDirectory(crypto.randomBytes(32))), /无法验证/);
});
test('目录截断时直接报错，不把无效存档交给密钥定位', () => {
  const source = encryptedDirectory(crypto.randomBytes(32));
  assert.throws(() => readKey('unused', source.subarray(0, source.length - 1)), /目录不完整/);
});
