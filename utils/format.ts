
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
