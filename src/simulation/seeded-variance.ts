/** Returns a stable integer in the inclusive [-maximum, maximum] range. */
export function getSeededVariance(seed: string, maximum: number) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) % (maximum * 2 + 1) - maximum;
}
