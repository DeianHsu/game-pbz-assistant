// DT_WeaponData forms share the base inventory row after soul tempering.
export const weaponFormBases = { HeiMoShang: 'Tang', XieHuo: 'Long', JueYing: 'Double' };

function findEntry(table, id, exact) {
  if (exact) return table[id];
  const key = String(id || '').toLowerCase();
  return table[Object.keys(table).find(name => name.toLowerCase() === key)];
}

export function itemRecord(table, category, id, exact = false) {
  const record = findEntry(table, id, exact);
  if (record || category !== 'weapon') return record;
  const baseId = findEntry(weaponFormBases, id, exact);
  if (!baseId) return undefined;
  const base = findEntry(table, baseId, exact), tempered = base?.AlreadySnapSoul;
  return tempered === true || Number.isInteger(tempered) && tempered > 0 ? base : undefined;
}
