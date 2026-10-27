import { ChangeDetectionStrategy, Component, booleanAttribute, inject, input } from '@angular/core';
import { I18nService } from '@doctor-mundi/core';

@Component({
  selector: 'dm-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
  host: {
    class: 'dm-logo',
    '[attr.data-inverted]': 'inverted() || null',
    '[attr.data-compact]': 'compact() || null',
  },
})
export class DmLogo {
  protected readonly i18n = inject(I18nService);
  readonly compact = input(false, { transform: booleanAttribute });
  readonly inverted = input(false, { transform: booleanAttribute });
}
