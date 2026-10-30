import { describe, expect, it } from 'vitest';
import { addMonths, monthKey, startOfDay } from './time';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h, 30).getTime();
const ymd = (ts: number) => {
  const d = new Date(ts);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()];
};

describe('addMonths', () => {
  it('soma meses mantendo o dia e a hora', () => {
    expect(ymd(addMonths(at(2026, 3, 15), 1))).toEqual([2026, 4, 15]);
    expect(new Date(addMonths(at(2026, 3, 15, 9), 2)).getHours()).toBe(9);
  });

  it('cai no último dia quando o mês de destino é mais curto', () => {
    expect(ymd(addMonths(at(2026, 1, 31), 1))).toEqual([2026, 2, 28]);
    expect(ymd(addMonths(at(2028, 1, 31), 1))).toEqual([2028, 2, 29]);
    expect(ymd(addMonths(at(2026, 3, 31), 1))).toEqual([2026, 4, 30]);
  });

  it('atravessa o ano', () => {
    expect(ymd(addMonths(at(2026, 11, 30), 3))).toEqual([2027, 2, 28]);
    expect(ymd(addMonths(at(2026, 12, 10), 12))).toEqual([2027, 12, 10]);
  });

  it('parcelas mensais de uma venda no dia 31 nunca pulam um mês', () => {
    const sale = at(2026, 1, 31);
    const months = Array.from({ length: 12 }, (_, i) => ymd(addMonths(sale, i + 1))[1]);
    expect(months).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1]);
  });
});

describe('startOfDay / monthKey', () => {
  it('zera a hora', () => {
    const d = new Date(startOfDay(at(2026, 5, 9, 17)));
    expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getDate()]).toEqual([0, 0, 0, 9]);
  });

  it('monthKey usa mês com dois dígitos', () => {
    expect(monthKey(at(2026, 3, 9))).toBe('2026-03');
    expect(monthKey(at(2026, 12, 31))).toBe('2026-12');
  });
});
