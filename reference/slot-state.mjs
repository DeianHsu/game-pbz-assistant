import { analyzeSlot } from './rules.mjs';
import { analyzeAchievements } from './achievements.mjs';
import { analyzeCollections } from './collections.mjs';
import { analyzeCollectibles } from './collectibles.mjs';
import { analyzeQuestNavigation } from './quest-navigation.mjs';

function analyzeEntry(slot, accountAchievements, catalog) {
  const achievements = analyzeAchievements(accountAchievements, slot.json, catalog);
  const analysis = analyzeSlot(slot.json, catalog, achievements);
  const collections = analyzeCollections(slot.json, catalog, analysis.stage);
  const collectibles = analyzeCollectibles(slot.json, catalog, collections, analysis);
  const navigation = analyzeQuestNavigation(slot.json, catalog, analysis, collections);
  return { ...analysis, ...navigation, achievements, collections, collectibles, selectedSlot: slot.name };
}

export function snapshotAccount(entries, catalog, index) {
  const slots = entries.filter(entry => entry.json.PBZGameSystem && entry.json.Narrative);
  if (!slots.length) throw new Error(`本地存档 ${index + 1} 没有可读取的槽位。`);
  const accountAchievements = entries.find(entry => entry.name === '__Achievements__')?.json;
  return { states: slots.map(slot => analyzeEntry(slot, accountAchievements, catalog)) };
}
