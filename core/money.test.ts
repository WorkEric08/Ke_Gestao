import { describe, expect, it } from 'vitest';
import { fromCents, splitCents, toCents } from './money';

describe('toCents / fromCents', () => {
  it('arredonda ao centavo mais próximo, sem erro de ponto flutuante', () => {
    expect(toCents(0.1 * 3)).toBe(30);
    expect(toCents(19.9)).toBe(1990);
    expect(fromCents(1990)).toBe(19.9);
  });

  it('propriedade: qualquer valor de 2 casas faz a ida e volta sem perder um centavo', () => {
    for (let cents = 0; cents <= 2_000_000; cents++) {
      if (toCents(fromCents(cents)) !== cents) throw new Error(`falhou em ${cents} centavos`);
    }
  });
});

describe('splitCents', () => {
  it('dá os centavos que sobram às primeiras partes', () => {
    expect(splitCents(10000, 3)).toEqual([3334, 3333, 3333]);
    expect(splitCents(10000, 4)).toEqual([2500, 2500, 2500, 2500]);
    expect(splitCents(1, 3)).toEqual([1, 0, 0]);
  });

  it('recusa número de partes inválido', () => {
    expect(() => splitCents(100, 0)).toThrow(RangeError);
    expect(() => splitCents(100, 1.5)).toThrow(RangeError);
  });

  it('propriedade: soma exata, tamanho certo e partes que diferem em no máximo 1 centavo', () => {
    let seed = 12345;
    const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    for (let i = 0; i < 5000; i++) {
      const total = Math.floor(rand() * 5_000_000);
      const parts = 1 + Math.floor(rand() * 12);
      const split = splitCents(total, parts);
      expect(split).toHaveLength(parts);
      expect(split.reduce((a, b) => a + b, 0)).toBe(total);
      expect(Math.max(...split) - Math.min(...split)).toBeLessThanOrEqual(1);
    }
  });
});
