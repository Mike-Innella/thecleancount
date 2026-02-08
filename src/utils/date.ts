const pad = (value: number): string => value.toString().padStart(2, '0');

export const toDateISO = (d: Date): string => {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const isSameDateISO = (a: string, b: string): boolean => a === b;

export const todayISO = (): string => toDateISO(new Date());
