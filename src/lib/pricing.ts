export const PRICING: Record<number, number> = {
  1: 10,
  2: 18,
  3: 25,
};

export function getPrice(binCount: number): number {
  return PRICING[binCount] ?? 0;
}
