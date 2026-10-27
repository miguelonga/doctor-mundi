import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideArrowLeft,
  LucideArrowUpRight,
  LucideBadgeCheck,
  LucideGlobe,
  LucideMapPin,
  LucideShieldCheck,
} from '@lucide/angular';
import { Button } from '@tahoe/ui';
import {
  COUNTRY_BY_CODE,
  I18nService,
  Mission,
  MissionMatch,
  computeMissionMatch,
  recommendationCountFor,
} from '@doctor-mundi/core';
import {
  AuthStore,
  MissionsStore,
  OrganizationsStore,
  ProfileStore,
  SavedStore,
} from '@doctor-mundi/data-access';
import { DmMissionCard, DmOrganizationMark, DmWorldMap } from '@doctor-mundi/ui';
import { ToastStore } from '../shared/toast.store';

@Component({
  selector: 'dm-organization-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    DmMissionCard,
    DmOrganizationMark,
    DmWorldMap,
    LucideArrowLeft,
    LucideArrowUpRight,
    LucideBadgeCheck,
      LucideGlobe,
    LucideMapPin,
    LucideShieldCheck,
  ],
  templateUrl: './organization-detail-page.html',
  styleUrl: './organization-detail-page.scss',
})
export class OrganizationDetailPage {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(OrganizationsStore);
  protected readonly missionsStore = inject(MissionsStore);
  protected readonly profile = inject(ProfileStore);
  protected readonly saved = inject(SavedStore);
  protected readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly organization = this.store.organization;
  protected readonly loading = this.store.loading;
  protected readonly allMissions = this.store.missions;
  protected readonly failed = computed(() => this.store.organizationResource.error() !== undefined);
  protected readonly notFound = computed(
    () => !this.loading() && this.store.slug() !== null && this.organization() === null
  );

  protected readonly openMissions = computed(() =>
    this.allMissions()
      .filter((mission) => mission.status !== 'filled')
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
  );

  protected readonly country = computed(() => {
    const org = this.organization();
    return org ? (COUNTRY_BY_CODE.get(org.countryCode) ?? null) : null;
  });

  protected readonly mapMissions = computed<readonly Mission[]>(() => this.openMissions());

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const slug = params.get('slug');
      if (slug) this.store.load(slug);
      (this.route.snapshot.data['title'] as string | undefined) ?? undefined;
      window.scrollTo(0, 0);
    });
  }

  protected countryName(code: string): string {
    const country = COUNTRY_BY_CODE.get(code);
    return country ? this.i18n.loc(country.name) : code;
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

  protected async onSave(mission: Mission): Promise<void> {
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

  protected retry(): void {
    this.store.organizationResource.reload();
    this.store.missionsResource.reload();
  }
}
