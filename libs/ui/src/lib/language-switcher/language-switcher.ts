import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { LucideLanguages } from '@lucide/angular';
import { I18nService, Lang } from '@doctor-mundi/core';

@Component({
  selector: 'dm-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideLanguages],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
})
export class DmLanguageSwitcher {
  protected readonly i18n = inject(I18nService);
  readonly languageChange = output<Lang>();

  set(lang: Lang): void {
    this.i18n.setLang(lang);
    this.languageChange.emit(lang);
  }
}
