export type Lang = 'es' | 'en';

export interface Localized {
  readonly es: string;
  readonly en: string;
}

/** Tiny helper so seed data stays readable. */
export function L(es: string, en: string): Localized {
  return { es, en };
}
