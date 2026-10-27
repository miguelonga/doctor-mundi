import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService, TranslationKey, Urgency } from '@doctor-mundi/core';

@Component({
  selector: 'dm-urgency-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="dm-tag" [class]="'dm-tag--' + urgency()">
      <span class="dm-urgency-dot" aria-hidden="true"></span>
      {{ label() }}
    </span>
  `,
  styleUrl: './urgency-tag.scss',
})
export class DmUrgencyTag {
  private readonly i18n = inject(I18nService);
  readonly urgency = input<Urgency>('standard');
  protected readonly label = computed(() =>
    this.i18n.t(('urgency.' + this.urgency()) as TranslationKey)
  );
}
