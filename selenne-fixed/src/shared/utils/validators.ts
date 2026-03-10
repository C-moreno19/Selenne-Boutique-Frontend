export const lettersOnly = (value: string) => {
  if (!value) return value;
  return value.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
};

export const numbersOnly = (value: string) => {
  if (!value) return value;
  return value.replace(/\D+/g, '');
};

export const removeSpaces = (value: string) => {
  if (!value) return value;
  return value.replace(/\s+/g, '');
};

export const removeAt = (value: string) => {
  if (!value) return value;
  return value.replace(/@/g, '');
};

export default { lettersOnly, numbersOnly, removeSpaces, removeAt };
