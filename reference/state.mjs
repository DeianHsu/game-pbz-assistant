import fs from 'node:fs';
import path from 'node:path';
import { decompress } from 'ooz-wasm';
import { discoverGame, discoverSaves } from './discovery.mjs';
import { readSave, SUPPORTED_BUILDS } from './save.mjs';
import { buildQuestCatalog } from './resources.mjs';
import { snapshotAccount } from './slot-state.mjs';

export function readReferenceSnapshot() {
  const game = discoverGame();
  const manifestPath = path.resolve(game, '../../appmanifest_4115450.acf');
  let build;
  try { build = fs.readFileSync(manifestPath, 'utf8').match(/"buildid"\s*"([^"]+)"/)?.[1]; } catch {}
  if (!SUPPORTED_BUILDS.includes(build)) throw new Error(`当前已验证 Steam 构建 ${SUPPORTED_BUILDS.join('、')}，本机为 ${build || '未知'}。请先适配新版任务数据。`);
  const catalog = buildQuestCatalog(game);
  const accounts = discoverSaves(game).map((file, index) => {
    const before = fs.statSync(file);
    const entries = readSave(game, file, (bytes, size) => Buffer.from(decompress(bytes, size)));
    const after = fs.statSync(file);
    if (after.size !== before.size || after.mtimeMs !== before.mtimeMs) throw new Error('游戏正在保存，请稍后重试。');
    return snapshotAccount(entries, catalog, index);
  });
  return { accounts, catalog };
}
