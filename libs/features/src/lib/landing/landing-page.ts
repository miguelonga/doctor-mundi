import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideActivity,
  LucideAmbulance,
  LucideArrowRight,
  LucideArrowUpRight,
  LucideBaby,
  LucideBadgeCheck,
  LucideBrain,
  LucideCheck,
  LucideCompass,
  LucideFileText,
  LucideHandHeart,
  LucideHeartPulse,
  LucideLanguages,
  LucideMicroscope,
  LucidePill,
  LucidePlus,
  LucideSearch,
  LucideSend,
  LucideShieldCheck,
  LucideStethoscope,
  LucideTruck,
  LucideUserRound,
  LucideUsers,
} from '@lucide/angular';
import { Button, Select } from '@tahoe/ui';
import {
  COUNTRY_BY_CODE,
  I18nService,
  Localized,
  MissionFilters,
  MissionMatch,
  ROLE_LABELS,
  RoleId,
  computeMissionMatch,
  recommendationCountFor,
} from '@doctor-mundi/core';
import {
  AuthStore,
  MetaStore,
  MissionsStore,
  OrganizationsStore,
  ProfileStore,
  SavedStore,
} from '@doctor-mundi/data-access';
import { DmMissionCard, DmOrganizationMark, DmWorldMap } from '@doctor-mundi/ui';
import { ToastStore } from '../shared/toast.store';

@Component({
  selector: 'dm-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    Select,
    DmMissionCard,
    DmOrganizationMark,
    DmWorldMap,
    LucideActivity,
    LucideAmbulance,
    LucideArrowRight,
    LucideArrowUpRight,
    LucideBaby,
    LucideBadgeCheck,
    LucideBrain,
    LucideCheck,
    LucideCompass,
    LucideFileText,
    LucideHandHeart,
    LucideHeartPulse,
    LucideLanguages,
    LucideMicroscope,
    LucidePill,
    LucidePlus,
    LucideSearch,
    LucideSend,
    LucideShieldCheck,
    LucideStethoscope,
    LucideTruck,
    LucideUserRound,
    LucideUsers,
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AuthStore);
  protected readonly missionsStore = inject(MissionsStore);
  protected readonly meta = inject(MetaStore);
  protected readonly organizations = inject(OrganizationsStore);
  protected readonly profile = inject(ProfileStore);
  protected readonly saved = inject(SavedStore);
  private readonly toast = inject(ToastStore);
  private readonly router = inject(Router);

  protected readonly role = signal('all');
  protected readonly country = signal('all');
  protected readonly when = signal('any');

  protected readonly stats = this.meta.stats;
  protected readonly mapMissions = this.missionsStore.mapMissions;

  protected readonly roleOptions = computed(() =>
    this.meta.filters().roles.map((id) => ({ id, label: ROLE_LABELS[id] }))
  );

  protected readonly countryOptions = computed(() => {
    const options: { code: string; label: Localized }[] = [];
    for (const code of this.meta.filters().countries) {
      const country = COUNTRY_BY_CODE.get(code);
      if (country) options.push({ code, label: country.name });
    }
    return options;
  });

  protected readonly organizationById = computed(
    () => new Map(this.organizations.organizations().map((organization) => [organization.id, organization]))
  );

  protected readonly trustOrganizations = computed(() => this.organizations.organizations().slice(0, 6));

  protected readonly featuredMissions = computed(() => {
    const featured = this.missionsStore.featured.value() ?? [];
    const fallback = this.missionsStore.missions();
    return (featured.length ? featured : fallback).slice(0, 3);
  });

  protected readonly matches = computed(() => {
    const profile = this.profile.profile();
    const recommendations = this.profile.recommendations();
    const map = new Map<string, MissionMatch>();
    if (!profile) return map;
    const recommendationCount = recommendationCountFor(profile.id, recommendations);
    for (const mission of this.featuredMissions()) {
      map.set(mission.id, computeMissionMatch(mission, profile, recommendationCount));
    }
    return map;
  });

  protected readonly topRoles = computed(() => {
    const facets = this.missionsStore.meta()?.facets?.roles ?? {};
    return (Object.entries(facets) as [RoleId, number][])
      .map(([id, count]) => ({ id, count, label: ROLE_LABELS[id] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  });

  protected roleLabel(id: RoleId) {
    return this.i18n.loc(ROLE_LABELS[id]);
  }

  protected search(): void {
    const days = this.when() === '30' ? 30 : this.when() === '90' ? 90 : this.when() === '180' ? 180 : 0;
    const startFrom = days
      ? new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
      : '';
    const patch: Partial<MissionFilters> = {
      q: '',
      role: this.role() as RoleId | 'all',
      country: this.country(),
      startFrom,
      page: 1,
    };
    this.missionsStore.setFilters(patch);
    this.router.navigate(['/misiones']);
  }

  protected goRole(role: RoleId): void {
    this.missionsStore.setFilters({ role, country: 'all', q: '', page: 1 });
    this.router.navigate(['/misiones']);
  }

  protected async onSave(mission: { id: string }): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      await this.router.navigate(['/entrar'], { queryParams: { returnUrl: '/' } });
      return;
    }
    try {
      const saved = await this.saved.toggle(mission.id);
      this.toast.show(this.i18n.t(saved ? 'common.saved' : 'common.remove'), 'success');
    } catch {
      this.toast.show(this.i18n.t('common.error'), 'error');
    }
  }
}
