export const DEFAULT_24_HOUR_EMAIL_LIMIT = 50;

export function isValid24HourEmailLimit(value: number) {
  return Number.isInteger(value) && value >= 1;
}
