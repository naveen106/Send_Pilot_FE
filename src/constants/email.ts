export const DEFAULT_24_HOUR_EMAIL_LIMIT = 50;
export const MAX_24_HOUR_EMAIL_LIMIT = 200;

export function isValid24HourEmailLimit(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= MAX_24_HOUR_EMAIL_LIMIT;
}
