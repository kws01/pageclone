export function setAt<T>(list: T[], index: number, value: T): T[] {
  return list.map((item, i) => (i === index ? value : item));
}

export function patchAt<T extends object>(list: T[], index: number, patch: Partial<T>): T[] {
  return setAt(list, index, { ...list[index], ...patch });
}

export function removeAt<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

export function duplicateAt<T>(list: T[], index: number): T[] {
  return [...list.slice(0, index + 1), list[index], ...list.slice(index + 1)];
}

export function moveAt<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
