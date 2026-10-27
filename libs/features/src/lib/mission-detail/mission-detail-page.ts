import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideArrowLeft,
  LucideArrowUpRight,
  LucideBadgeCheck,
  LucideCalendarDays,
  LucideCheck,
  LucideClipboardList,
  LucideGlobe,
  LucideHandHeart,
  LucideHeart,
  LucideInfo,
  LucideLanguages,
  LucideMapPin,
  LucideShieldCheck,
  LucideTruck,
} from '@lucide/angular';
import { Button } from '@tahoe/ui';
import {
  APPLICATION_STATUS_LABELS,
  CONTRACT_LABELS,
  COUNTRY_BY_CODE,
  I18nService,
  LANGUAGE_NAMES,
  LEVEL_LABELS,
  Mission,
  MissionMatch,
  MissionStatus,
  ROLE_LABELS,
  RegionId,
  TranslationKey,
  computeMissionMatch,
  durationLabel,
  recommendationCountFor,
} from '@doctor-mundi/core';
import {
  ApplicationsStore,
  AuthStore,
  MissionDetailStore,
  OrganizationsStore,
  ProfileStore,
  SavedStore,
} from '@doctor-mundi/data-access';
import { DmMissionCard, DmOrganizationMark, DmScoreRing, DmUrgencyTag, DmWorldMap } from '@doctor-mundi/ui';
import { ToastStore } from '../shared/toast.store';

@Component({
  selector: 'dm-mission-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    DmMissionCard,
    DmOrganizationMark,
    DmScoreRing,
    DmUrgencyTag,
    DmWorldMap,
    LucideArrowLeft,
    LucideArrowUpRight,
    LucideBadgeCheck,
    LucideCalendarDays,
    LucideCheck,
    LucideClipboardList,
      LucideGlobe,
    LucideHandHeart,
    LucideHeart,
    LucideInfo,
    LucideLanguages,
    LucideMapPin,
    LucideShieldCheck,
    LucideTruck,
    ],
  templateUrl: './mission-detail-page.html',
  styleUrl: './mission-detail-page.scss',
})
export class MissionDetailPage {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(MissionDetailStore);
  protected readonly organizations = inject(OrganizationsStore);
  protected readonly profile = inject(ProfileStore);
  protected readonly saved = inject(SavedStore);
  protected readonly auth = inject(AuthStore);
  protected readonly applications = inject(ApplicationsStore);
  private readonly toast = inject(ToastStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  protected readonly mission = this.store.mission;
  protected readonly similar = this.store.similar;
  protected readonly loading = this.store.loading;

  protected readonly orgById = computed(
    () => new Map(this.organizations.organizations().map((org) => [org.id, org]))
  );

  protected readonly organization = computed(() => {
    const mission = this.mission();
    return mission ? (this.orgById().get(mission.orgId) ?? null) : null;
  });

  protected readonly country = computed(() => {
    const mission = this.mission();
    return mission ? (COUNTRY_BY_CODE.get(mission.countryCode) ?? null) : null;
  });

  protected readonly application = computed(() => {
    const mission = this.mission();
    if (!mission || !this.auth.isAuthenticated()) return null;
    return (
      this.applications
        .applications()
        .find((item) => item.missionId === mission.id && item.status !== 'withdrawn') ?? null
    );
  });

  protected readonly applied = computed(() => !!this.application());
  protected readonly match = computed<MissionMatch | null>(() => {
    const mission = this.mission();
    const profile = this.profile.profile();
    if (!mission || !profile) return null;
    return computeMissionMatch(
      mission,
      profile,
      recommendationCountFor(profile.id, this.profile.recommendations())
    );
  });

  protected readonly missionList = computed<readonly Mission[]>(() => {
    const mission = this.mission();
    return mission ? [mission] : [];
  });

  protected readonly notFound = computed(
    () => !this.loading() && this.store.slug() !== null && this.mission() === null
  );
  protected readonly failed = computed(() => this.store.missionResource.error() !== undefined);

  protected readonly openSlots = computed(() => {
    const mission = this.mission();
    return mission ? Math.max(0, mission.slots.total - mission.slots.filled) : 0;
  });
  protected readonly filledPercent = computed(() => {
    const mission = this.mission();
    return mission ? Math.min(100, Math.round((mission.slots.filled / mission.slots.total) * 100)) : 0;
  });
  protected readonly dates = computed(() => {
    const mission = this.mission();
    return mission ? this.i18n.formatDateRange(mission.startDate, mission.endDate) : '';
  });
  protected readonly duration = computed(() => {
    const mission = this.mission();
    return mission ? durationLabel(mission.durationWeeks, this.i18n) : '';
  });
  protected readonly place = computed(() => {
    const mission = this.mission();
    const country = this.country();
    return mission ? `${mission.city}${country ? ', ' + this.i18n.loc(country.name) : ''}` : '';
  });
  protected readonly coords = computed(() => {
    const mission = this.mission();
    if (!mission) return '';
    const { lat, lng } = mission.coordinates;
    return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} / ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`;
  });
  protected readonly contract = computed(() => {
    const mission = this.mission();
    return mission ? this.i18n.loc(CONTRACT_LABELS[mission.contractType]) : '';
  });
  protected readonly roleLabels = computed(() => {
    const mission = this.mission();
    return mission ? mission.roles.map((role) => this.i18n.loc(ROLE_LABELS[role])) : [];
  });
  protected readonly applicationStatus = computed(() => {
    const application = this.application();
    return application ? this.i18n.loc(APPLICATION_STATUS_LABELS[application.status]) : '';
  });
  protected readonly applicationStatusClass = computed(() => {
    const application = this.application();
    return application ? `dm-status dm-status--${application.status}` : 'dm-status';
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const slug = params.get('slug');
      if (slug) this.store.load(slug);
      this.document.defaultView?.scrollTo(0, 0);
    });
  }

  protected orgFor(mission: Mission) {
    return this.orgById().get(mission.orgId) ?? null;
  }

  protected matchFor(mission: Mission): MissionMatch | null {
    const profile = this.profile.profile();
    if (!profile) return null;
    return computeMissionMatch(
      mission,
      profile,
      recommendationCountFor(profile.id, this.profile.recommendations())
    );
  }

  protected languageName(code: string): string {
    return LANGUAGE_NAMES[code] ? this.i18n.loc(LANGUAGE_NAMES[code]) : this.i18n.languageName(code);
  }

  protected levelName(level: keyof typeof LEVEL_LABELS): string {
    return this.i18n.loc(LEVEL_LABELS[level]);
  }

  protected statusLabel(status: MissionStatus): string {
    const key: TranslationKey =
      status === 'open' ? 'common.open' : status === 'closing' ? 'common.closingSoon' : 'common.filled';
    return this.i18n.t(key);
  }

  protected regionLabel(region: RegionId): string {
    return this.i18n.t(('region.' + region) as TranslationKey);
  }

  protected openApplication(): void {
    const mission = this.mission();
    if (!mission) return;
    if (this.applied()) {
      void this.router.navigate(['/postulaciones']);
      return;
    }
    void this.router.navigate(['/misiones', mission.slug, 'postular']);
  }

  protected async onSave(): Promise<void> {
    const mission = this.mission();
    if (!mission) return;
    await this.saveMission(mission);
  }

  protected async onSimilarSave(mission: Mission): Promise<void> {
    await this.saveMission(mission);
  }

  private async saveMission(mission: Mission): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      await this.router.navigate(['/entrar'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    try {
      const nowSaved = await this.saved.toggle(mission.id);
      this.toast.show(this.i18n.t(nowSaved ? 'toast.saved' : 'toast.unsaved'), nowSaved ? 'success' : 'info');
    } catch {
      this.toast.show(this.i18n.t('common.error'), 'error');
    }
  }

  protected async share(): Promise<void> {
    const mission = this.mission();
    if (!mission) return;
    const title = this.i18n.loc(mission.title);
    const url = this.document.defaultView?.location.href ?? '';
    const view = this.document.defaultView;
    if (view?.navigator.share) {
      try {
        await view.navigator.share({ title, text: this.i18n.loc(mission.summary), url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await view?.navigator.clipboard?.writeText(url);
      this.toast.show(this.i18n.t('toast.copied'));
    } catch {
      this.toast.show(this.i18n.t('common.error'), 'error');
    }
  }

  protected report(): void {
    this.toast.show(this.i18n.t('toast.reportSent'), 'info');
  }

  protected retry(): void {
    this.store.missionResource.reload();
    this.store.similarResource.reload();
  }
}
