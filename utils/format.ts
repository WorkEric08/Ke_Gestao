
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (timestamp: number) => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(timestamp));
};

export const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Celular (11 dígitos): (XX) XXXXX-XXXX
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  }
  
  // Fixo (10 dígitos): (XX) XXXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
  }
  
  return phone;
};

// Sem centavos: para indicadores estreitos (um cartão de 120 px), onde "R$ 1.240" cabe e "R$ 1.240,00" não.
export const formatCurrencyWhole = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
};

export const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};
