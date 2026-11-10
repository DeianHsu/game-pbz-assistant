// Build-time only: share the original guide data without embedding JavaScript or game resources.
import { writeFileSync } from 'node:fs';
import { checkpoints, STATE_LABELS } from '../reference/rules.mjs';
import { sources, treasureGroups, questAchievements, chivalryEncounters, trueEndingQuests, questFailureRules, unknownQuestFailure, baiXueSteps, cuiCamp } from '../reference/risk-data.mjs';
import { treasureStages, minimumStage } from '../reference/stages.mjs';
import { collectionGuides } from '../reference/collection-guides.mjs';
import { accessSources, physicalRouteSources, pointRoutes, pointChecks } from '../reference/collection-access-data.mjs';
import { bookDirectory } from '../reference/book-guides.mjs';
import { navigationMaps, navigationDefinitions } from '../reference/quest-navigation.mjs';
import { questOffers } from '../reference/quest-offers.mjs';
import { questArchive } from '../reference/quest-catalog.mjs';
import { collectionCategories } from '../reference/collections.mjs';
import { collectibleCategories, collectionAliases, unlistedCollectionItems } from '../reference/collectibles.mjs';
import { analyzeAchievements } from '../reference/achievements.mjs';
import { achievementPlans } from '../reference/achievement-plans.mjs';
import { achievementObjectives, questObjectives } from '../reference/objective-progress.mjs';
import { weaponFormBases } from '../reference/item-record.mjs';
import { pipaRepair, soulComponentProducts, soulComponents, soulForms, soulGuides, soulRecipes, soulSources } from '../reference/soul-data.mjs';

const achievementHelp = analyzeAchievements(null, {}, {
  items: [], quests: [], achievements: Array.from({ length: 66 }, (_, i) => ({
    id: 'ACH_' + String(i + 1).padStart(3, '0')
  }))
}).rows.map(({ id, hint, category, progress }) => [id, { hint, category, progress }]);

writeFileSync(process.argv[2], JSON.stringify({
  checkpoints, STATE_LABELS, sources, treasureGroups, questAchievements, chivalryEncounters, trueEndingQuests, questFailureRules, unknownQuestFailure, baiXueSteps, cuiCamp,
  treasureStages, minimumStage, collectionGuides, accessSources, physicalRouteSources,
  pointRoutes: Object.fromEntries(pointRoutes), pointChecks, books: bookDirectory(), navigationMaps,
  navigationDefinitions: Object.fromEntries(navigationDefinitions), questOffers, questArchive, collectionCategories, collectibleCategories,
  achievementHelp: Object.fromEntries(achievementHelp), achievementPlans, achievementObjectives, questObjectives, weaponFormBases,
  collectionAliases, unlistedCollectionItems, pipaRepair, soulComponentProducts, soulComponents, soulForms, soulGuides, soulRecipes, soulSources
}));
