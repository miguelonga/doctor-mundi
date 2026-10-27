import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Lang, Localized } from '../models/localized';
import { TRANSLATIONS, TranslationKey } from './translations';

const LANG_KEY = 'doctor-mundi.lang';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;

  readonly lang = signal<Lang>(this.readStoredLang());
  readonly isEs = computed(() => this.lang() === 'es');
  readonly locale = computed(() => (this.isEs() ? 'es-ES' : 'en-GB'));

  constructor() {
    this.syncDocument();
  }

  setLang(lang: Lang): void {
    if (lang === this.lang()) return;
    this.lang.set(lang);
    try {
      this.window?.localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Storage can be blocked; the in-memory language still works.
    }
    this.syncDocument();
  }

  toggle(): void {
    this.setLang(this.isEs() ? 'en' : 'es');
  }

  t(key: TranslationKey, params?: Readonly<Record<string, string | number>>): string {
    const entry = TRANSLATIONS[key];
    const value = entry[this.isEs() ? 0 : 1];
    if (!params) return value;
    return value.replace(/\{\{(\w+)\}\}/g, (_, token: string) =>
      String(params[token] ?? `{{${token}}}`)
    );
  }

  loc(value: Localized | undefined | null): string {
    if (!value) return '';
    return value[this.lang()];
  }

  formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(
      this.locale(),
      options ?? { day: 'numeric', month: 'short', year: 'numeric' }
    ).format(date);
  }

  formatDateShort(value: string | Date): string {
    return this.formatDate(value, { day: 'numeric', month: 'short' });
  }

  formatDateRange(from: string, to: string): string {
    const a = new Date(from);
    const b = new Date(to);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '';
    const sameYear = a.getFullYear() === b.getFullYear();
    const sameMonth = sameYear && a.getMonth() === b.getMonth();
    const fmt = new Intl.DateTimeFormat(this.locale(), {
      day: 'numeric',
      month: 'short',
      year: sameYear ? undefined : 'numeric',
    });
    if (sameMonth) {
      const endFmt = new Intl.DateTimeFormat(this.locale(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return `${a.getDate()}–${endFmt.format(b)}`;
    }
    return `${fmt.format(a)} – ${fmt.format(b)}`;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat(this.locale()).format(value);
  }

  formatRelative(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    const diff = date.getTime() - Date.now();
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat(this.locale(), { numeric: 'auto' });
    const day = 86_400_000;
    if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute');
    if (abs < day) return rtf.format(Math.round(diff / 3_600_000), 'hour');
    if (abs < day * 30) return rtf.format(Math.round(diff / day), 'day');
    if (abs < day * 365) return rtf.format(Math.round(diff / (day * 30)), 'month');
    return rtf.format(Math.round(diff / (day * 365)), 'year');
  }

  languageName(code: string): string {
    try {
      const display = new Intl.DisplayNames([this.locale()], { type: 'language' });
      return display.of(code) ?? code.toUpperCase();
    } catch {
      return code.toUpperCase();
    }
  }

  private readStoredLang(): Lang {
    try {
      const stored = this.window?.localStorage.getItem(LANG_KEY);
      if (stored === 'es' || stored === 'en') return stored;
    } catch {
      // ignore
    }
    return 'es';
  }

  private syncDocument(): void {
    this.document.documentElement.lang = this.lang();
  }
}
