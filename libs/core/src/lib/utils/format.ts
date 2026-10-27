import { I18nService } from '../i18n/i18n.service';

export function durationLabel(weeks: number, i18n: I18nService): string {
  return weeks === 1
    ? i18n.t('date.week', { count: weeks })
    : i18n.t('date.weeks', { count: weeks });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
