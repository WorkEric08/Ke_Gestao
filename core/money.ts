// Dinheiro é guardado em reais (número), mas toda conta passa por centavos inteiros:
// 0.1 * 3 e 100 / 3 em ponto flutuante não fecham no centavo.
export const toCents = (value: number): number => Math.round(value * 100);

export const fromCents = (cents: number): number => cents / 100;

// Divide em partes inteiras que somam exatamente o total; os centavos que sobram
// vão um a um para as primeiras partes (100,00 em 3x = 33,34 + 33,33 + 33,33).
export const splitCents = (totalCents: number, parts: number): number[] => {
  if (!Number.isInteger(parts) || parts < 1) {
    throw new RangeError(`splitCents: número de partes inválido (${parts})`);
  }
  const base = Math.floor(totalCents / parts);
  const rest = totalCents - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < rest ? 1 : 0));
};
