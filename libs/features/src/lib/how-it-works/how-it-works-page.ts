import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideArrowUpRight,
  LucideBookOpen,
  LucideCheck,
  LucideFileCheck2,
  LucidePlus,
  LucideRefreshCw,
  LucideShieldCheck,
  LucideSparkles,
} from '@lucide/angular';
import { Button } from '@tahoe/ui';
import { I18nService, TranslationKey } from '@doctor-mundi/core';
import { AuthStore } from '@doctor-mundi/data-access';

type Audience = 'volunteer' | 'organization';
type Step = { number: string; title: string; body: string };

@Component({
  selector: 'dm-how-it-works-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    LucideArrowRight,
    LucideArrowUpRight,
    LucideBookOpen,
    LucideCheck,
    LucideFileCheck2,
    LucidePlus,
    LucideRefreshCw,
    LucideShieldCheck,
    LucideSparkles,
  ],
  templateUrl: './how-it-works-page.html',
  styleUrl: './how-it-works-page.scss',
})
export class HowItWorksPage {
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AuthStore);
  protected readonly audience = signal<Audience>('volunteer');

  protected readonly steps = computed<readonly Step[]>(() => {
    const org = this.audience() === 'organization';
    return [
      {
        number: '01',
        title: this.i18n.t(org ? 'how.org1Title' : 'how.volunteer1Title'),
        body: this.i18n.t(org ? 'how.org1Body' : 'how.volunteer1Body'),
      },
      {
        number: '02',
        title: this.i18n.t(org ? 'how.org2Title' : 'how.volunteer2Title'),
        body: this.i18n.t(org ? 'how.org2Body' : 'how.volunteer2Body'),
      },
      {
        number: '03',
        title: this.i18n.t(org ? 'how.org3Title' : 'how.volunteer3Title'),
        body: this.i18n.t(org ? 'how.org3Body' : 'how.volunteer3Body'),
      },
    ];
  });

  protected readonly checks: readonly TranslationKey[] = [
    'how.check1',
    'how.check2',
    'how.check3',
  ];

  protected readonly faqs: readonly { q: TranslationKey; a: TranslationKey }[] = [
    { q: 'faq.q1', a: 'faq.a1' },
    { q: 'faq.q2', a: 'faq.a2' },
    { q: 'faq.q3', a: 'faq.a3' },
    { q: 'faq.q4', a: 'faq.a4' },
    { q: 'faq.q5', a: 'faq.a5' },
  ];

  protected readonly ctaTitle = computed(() =>
    this.audience() === 'organization'
      ? this.i18n.t('how.orgCtaTitle')
      : this.i18n.t('landing.ctaTitle')
  );
  protected readonly ctaBody = computed(() =>
    this.audience() === 'organization'
      ? this.i18n.t('how.orgCtaBody')
      : this.i18n.t('landing.ctaBody')
  );
  protected readonly ctaLabel = computed(() => {
    if (this.audience() === 'organization') return this.i18n.t('how.orgCtaButton');
    return this.auth.isAuthenticated()
      ? this.i18n.t('nav.profile')
      : this.i18n.t('landing.ctaButton');
  });
  protected readonly ctaRoute = computed(() => {
    if (this.audience() === 'organization') return 'mailto:organizaciones@doctormundi.org';
    return this.auth.isAuthenticated() ? '/perfil' : '/crear-cuenta';
  });

  protected select(audience: Audience): void {
    this.audience.set(audience);
  }
}
