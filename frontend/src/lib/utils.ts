import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKwh(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "0 kWh";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value) + " kWh";
}

export function formatPercent(value: number | null | undefined, sign: boolean = false): string {
  if (value === null || value === undefined || isNaN(value)) return "0.0%";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
  if (sign && value > 0) {
    return `+${formatted}%`;
  }
  return `${formatted}%`;
}

export function formatDecimal(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return "0.0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
