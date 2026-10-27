import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService, TranslationKey } from '@doctor-mundi/core';

@Injectable({ providedIn: 'root' })
export class LocalizedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);
  private readonly key = signal<TranslationKey>('seo.home');

  constructor() {
    super();
    effect(() => this.title.setTitle(this.i18n.t(this.key())));
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const resolved = this.buildTitle(snapshot);
    this.key.set(resolved?.startsWith('seo.') ? (resolved as TranslationKey) : 'seo.home');
  }
}
