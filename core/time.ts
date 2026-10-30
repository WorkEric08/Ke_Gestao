export const startOfDay = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// Mantém o dia do mês; se o mês de destino é mais curto, cai no último dia
// (31/01 + 1 mês = 28/02, e não 03/03 como `setMonth` faria sozinho).
export const addMonths = (ts: number, months: number): number => {
  const d = new Date(ts);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d.getTime();
};

export const monthKey = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
