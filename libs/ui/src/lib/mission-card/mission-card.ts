import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowUpRight,
  LucideBadgeCheck,
  LucideCalendarDays,
  LucideClock3,
  LucideHeart,
  LucideMapPin,
} from '@lucide/angular';
import {
  COUNTRY_BY_CODE,
  I18nService,
  Mission,
  MissionMatch,
  Organization,
  durationLabel,
} from '@doctor-mundi/core';
import { DmOrganizationMark } from '../organization-mark/organization-mark';
import { DmUrgencyTag } from '../urgency-tag/urgency-tag';

@Component({
  selector: 'dm-mission-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DmUrgencyTag,
    DmOrganizationMark,
    LucideArrowUpRight,
    LucideBadgeCheck,
    LucideCalendarDays,
    LucideClock3,
    LucideHeart,
    LucideMapPin,
  ],
  templateUrl: './mission-card.html',
  styleUrl: './mission-card.scss',
  host: {
    '[attr.data-featured]': 'featured() || null',
  },
})
export class DmMissionCard {
  protected readonly i18n = inject(I18nService);
  readonly mission = input.required<Mission>();
  readonly organization = input<Organization | null>(null);
  readonly match = input<MissionMatch | null>(null);
  readonly saved = input(false);
  readonly featured = input(false);

  readonly saveToggle = output<Mission>();

  protected readonly country = computed(() => COUNTRY_BY_CODE.get(this.mission().countryCode));
  protected readonly orgName = computed(() => this.organization()?.name ?? '');
  protected readonly verified = computed(() => this.organization()?.verified ?? false);
  protected readonly openSlots = computed(() =>
    Math.max(0, this.mission().slots.total - this.mission().slots.filled)
  );
  protected readonly slotsLabel = computed(() =>
    this.openSlots() === 1
      ? this.i18n.t('common.oneOpenSlot')
      : this.i18n.t('common.openSlots', { count: this.openSlots() })
  );
  protected readonly dates = computed(() =>
    this.i18n.formatDateRange(this.mission().startDate, this.mission().endDate)
  );
  protected readonly duration = computed(() => durationLabel(this.mission().durationWeeks, this.i18n));
  protected readonly place = computed(() => {
    const c = this.country();
    return `${this.mission().city}${c ? ', ' + this.i18n.loc(c.name) : ''}`;
  });
  protected readonly coords = computed(() => {
    const { lat, lng } = this.mission().coordinates;
    const ns = lat >= 0 ? 'N' : 'S';
    const ew = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(1)}°${ns} / ${Math.abs(lng).toFixed(1)}°${ew}`;
  });
  protected readonly matchLabel = computed(() => {
    const match = this.match();
    return match ? `${match.score}% ${this.i18n.t('common.match')}` : '';
  });
  protected readonly matchTitle = computed(() => {
    const match = this.match();
    if (!match) return '';
    return match.reasons.map((reason) => this.i18n.loc(reason)).join(' · ');
  });
  protected readonly imageAlt = computed(() => {
    const title = this.i18n.loc(this.mission().title);
    return `${title} — ${this.place()}`;
  });
  protected readonly saveLabel = computed(() =>
    this.saved()
      ? this.i18n.t('common.saved')
      : this.i18n.t('common.save')
  );

  protected toggleSave(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.saveToggle.emit(this.mission());
  }
}
