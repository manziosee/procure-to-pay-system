export const formatCurrency = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
  }).format(numAmount);
};