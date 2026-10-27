import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '@doctor-mundi/core';

@Component({
  selector: 'dm-score-ring',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './score-ring.html',
  styleUrl: './score-ring.scss',
  host: {
    role: 'img',
    '[attr.aria-label]': 'ariaLabel()',
    '[style.--dm-score-size]': "size() + 'px'",
  },
})
export class DmScoreRing {
  protected readonly i18n = inject(I18nService);
  readonly score = input.required<number>();
  readonly size = input(132);

  protected readonly radius = 46;
  protected readonly circumference = 2 * Math.PI * this.radius;
  protected readonly offset = computed(
    () => this.circumference * (1 - Math.max(0, Math.min(100, this.score())) / 100)
  );
  protected readonly color = computed(() =>
    this.score() >= 80 ? 'var(--dm-petrol-500)' : this.score() >= 55 ? 'var(--dm-sand-500)' : 'var(--dm-signal)'
  );
  protected readonly ariaLabel = computed(() =>
    this.i18n.t('profile.scoreOf', { score: this.score() })
  );
}
