import { describe, expect, it } from 'vitest';
import { ttlToMs } from '../src/utils/jwt';

describe('ttlToMs', () => {
  it('parses common TTL strings', () => {
    expect(ttlToMs('15m')).toBe(900_000);
    expect(ttlToMs('7d')).toBe(604_800_000);
    expect(ttlToMs('30s')).toBe(30_000);
    expect(ttlToMs('2h')).toBe(7_200_000);
  });

  it('falls back to a raw number', () => {
    expect(ttlToMs('1000')).toBe(1000);
  });
});
