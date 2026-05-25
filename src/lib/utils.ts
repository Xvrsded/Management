import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Normalizes an RT or RW string (e.g., "RW 01", "1", "01") 
 * into a strict 3-digit padded format like "001", "002".
 */
export function normalizeRegionNumber(value?: string | number): string {
  if (!value && value !== 0) return '';
  return value
    .toString()
    .trim()
    .replace(/[^0-9]/g, '')
    .padStart(3, '0');
}
