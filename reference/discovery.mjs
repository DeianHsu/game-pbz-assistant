import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const APP_ID = '4115450';
export function discoverGame() {
  const roots = [];
  if (process.platform === 'win32') {
    for (const [key, value] of [['HKCU\\Software\\Valve\\Steam', 'SteamPath'], ['HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', 'InstallPath']]) {
      try {
        const output = execFileSync('reg.exe', ['query', key, '/v', value], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
        const match = output.match(/REG_SZ\s+(.+)/);
        if (match) roots.push(match[1].trim());
      } catch { /* Try the next Steam installation location. */ }
    }
  }
  roots.push(path.join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Steam'));
  for (const root of [...roots]) {
    try {
      const text = fs.readFileSync(path.join(root, 'steamapps/libraryfolders.vdf'), 'utf8');
      for (const match of text.matchAll(/"path"\s*"([^"]+)"/g)) roots.push(match[1].replaceAll('\\\\', '\\'));
    } catch { /* The library file is optional. */ }
  }
  for (const root of new Set(roots)) {
    try {
      const text = fs.readFileSync(path.join(root, `steamapps/appmanifest_${APP_ID}.acf`), 'utf8');
      const folder = text.match(/"installdir"\s*"([^"]+)"/)?.[1];
      if (folder) {
        const game = path.join(root, 'steamapps/common', folder);
        if (fs.existsSync(path.join(game, 'platform/steam/PBZ.exe'))) return game;
      }
    } catch { /* Try the next Steam library. */ }
  }
  throw new Error('没有找到 Steam 版影之刃零。');
}

export function discoverSaves(gameDir) {
  const root = path.join(gameDir, 'ProjectPBZ/Saved/SaveGames/Steam');
  const saves = fs.readdirSync(root, { withFileTypes: true }).filter(x => x.isDirectory())
    .map(x => path.join(root, x.name, 'PBZSaveGame.sav')).filter(file => fs.existsSync(file));
  if (!saves.length) throw new Error('没有找到本地存档。请先在游戏内保存一次。');
  return saves.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
}
