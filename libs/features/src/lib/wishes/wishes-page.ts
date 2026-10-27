import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideBell,
  LucideCheck,
  LucideHeart,
  LucideMapPin,
  LucideSave,
  LucideSearch,
  LucideSparkles,
} from '@lucide/angular';
import { Button, Checkbox, Input } from '@tahoe/ui';
import {
  CONTRACT_LABELS,
  COUNTRIES,
  ContractType,
  COUNTRY_BY_CODE,
  I18nService,
  Mission,
  MissionMatch,
  REGION_LABELS,
  RegionId,
  ROLE_LABELS,
  RoleId,
  TranslationKey,
  Wishlist,
  computeMissionMatch,
  recommendationCountFor,
} from '@doctor-mundi/core';
import {
  AuthStore,
  MissionsStore,
  OrganizationsStore,
  ProfileStore,
  SavedStore,
  WishesStore,
} from '@doctor-mundi/data-access';
import { DmMissionCard } from '@doctor-mundi/ui';
import { ToastStore } from '../shared/toast.store';

type MatchReason = { label: string };

const cloneWishes = (wishes: Wishlist): Wishlist => ({
  roles: [...wishes.roles],
  regions: [...wishes.regions],
  countries: [...wishes.countries],
  contractTypes: [...wishes.contractTypes],
  availability: { ...wishes.availability },
  alerts: wishes.alerts,
});

@Component({
  selector: 'dm-wishes-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    Checkbox,
    Input,
    DmMissionCard,
    LucideBell,
    LucideCheck,
    LucideHeart,
    LucideMapPin,
    LucideSave,
    LucideSearch,
    LucideSparkles,
  ],
  templateUrl: './wishes-page.html',
  styleUrl: './wishes-page.scss',
})
export class WishesPage {
  protected readonly i18n = inject(I18nService);
  protected readonly wishesStore = inject(WishesStore);
  protected readonly saved = inject(SavedStore);
  protected readonly missionsStore = inject(MissionsStore);
  protected readonly organizations = inject(OrganizationsStore);
  protected readonly profile = inject(ProfileStore);
  protected readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastStore);
  private readonly router = inject(Router);

  protected readonly roleOptions = (Object.keys(ROLE_LABELS) as RoleId[]).map((role) => role);
  protected readonly regionOptions = (Object.keys(REGION_LABELS) as RegionId[]).map((region) => region);
  protected readonly contractOptions = (Object.keys(CONTRACT_LABELS) as ContractType[]).map(
    (contract) => contract
  );

  protected readonly serverWishes = this.wishesStore.wishes;
  protected readonly loading = this.wishesStore.wishesResource.isLoading;
  protected readonly draft = signal<Wishlist | null>(null);
  protected readonly dirty = signal(false);
  protected readonly saving = signal(false);
  protected readonly countryQuery = signal('');

  protected readonly countryOptions = computed(() => {
    const query = this.countryQuery().trim().toLocaleLowerCase(this.i18n.locale());
    return COUNTRIES.filter((country) => {
      if (!query) return true;
      return this.i18n
        .loc(country.name)
        .toLocaleLowerCase(this.i18n.locale())
        .includes(query);
    }).map((country) => ({ code: country.code, name: this.i18n.loc(country.name) }));
  });

  protected readonly dateInvalid = computed(() => {
    const wishes = this.draft();
    if (!wishes) return false;
    return wishes.availability.from > wishes.availability.to;
  });

  protected readonly activeWishes = computed<Wishlist | null>(() => this.draft() ?? this.serverWishes());

  protected readonly recommended = computed<readonly Mission[]>(() => {
    const wishes = this.activeWishes();
    if (!wishes) return [];
    return this.missionsStore
      .mapMissions()
      .filter((mission) => mission.status !== 'filled')
      .map((mission) => ({ mission, score: this.wishScore(mission, wishes) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.mission.startDate.localeCompare(b.mission.startDate))
      .slice(0, 4)
      .map((entry) => entry.mission);
  });

  protected readonly savedMissions = computed<readonly Mission[]>(() => {
    const ids = this.saved.ids();
    return ids
      .map((id) => this.missionsStore.mapMissions().find((mission) => mission.id === id))
      .filter((mission): mission is Mission => Boolean(mission));
  });

  constructor() {
    effect(() => {
      const wishes = this.serverWishes();
      if (!wishes || this.draft()) return;
      this.draft.set(cloneWishes(wishes));
    });
  }

  protected toggleRole(role: RoleId): void {
    this.update((wishes) => ({
      ...wishes,
      roles: wishes.roles.includes(role)
        ? wishes.roles.filter((item) => item !== role)
        : [...wishes.roles, role],
    }));
  }

  protected toggleRegion(region: RegionId): void {
    this.update((wishes) => ({
      ...wishes,
      regions: wishes.regions.includes(region)
        ? wishes.regions.filter((item) => item !== region)
        : [...wishes.regions, region],
    }));
  }

  protected toggleCountry(code: string): void {
    this.update((wishes) => ({
      ...wishes,
      countries: wishes.countries.includes(code)
        ? wishes.countries.filter((item) => item !== code)
        : [...wishes.countries, code],
    }));
  }

  protected toggleContract(contract: ContractType): void {
    this.update((wishes) => ({
      ...wishes,
      contractTypes: wishes.contractTypes.includes(contract)
        ? wishes.contractTypes.filter((item) => item !== contract)
        : [...wishes.contractTypes, contract],
    }));
  }

  protected setDate(field: 'from' | 'to', value: string): void {
    this.update((wishes) => ({
      ...wishes,
      availability: { ...wishes.availability, [field]: value },
    }));
  }

  protected setAlerts(value: boolean): void {
    this.update((wishes) => ({ ...wishes, alerts: value }));
  }

  protected clearSelection(): void {
    this.update((wishes) => ({
      ...wishes,
      roles: [],
      regions: [],
      countries: [],
      contractTypes: [],
    }));
  }

  protected roleName(role: RoleId): string {
    return this.i18n.loc(ROLE_LABELS[role]);
  }

  protected regionName(region: RegionId): string {
    return this.i18n.loc(REGION_LABELS[region]);
  }

  protected contractName(contract: ContractType): string {
    return this.i18n.loc(CONTRACT_LABELS[contract]);
  }

  protected countryName(code: string): string {
    const country = COUNTRY_BY_CODE.get(code);
    return country ? this.i18n.loc(country.name) : code;
  }

  protected organizationFor(mission: Mission) {
    return this.organizations.organizations().find((org) => org.id === mission.orgId) ?? null;
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

  protected reasonFor(mission: Mission): TranslationKey | null {
    const wishes = this.activeWishes();
    if (!wishes) return null;
    if (mission.countryCode && wishes.countries.includes(mission.countryCode)) {
      return 'wishes.matchReasonCountry';
    }
    if (wishes.roles.some((role) => mission.roles.includes(role))) return 'wishes.matchReasonRole';
    if (wishes.regions.includes(mission.region)) return 'wishes.matchReasonRegion';
    if (wishes.contractTypes.includes(mission.contractType)) return 'wishes.matchReasonContract';
    return null;
  }

  protected reasonText(mission: Mission): string {
    const key = this.reasonFor(mission);
    if (!key) return '';
    return this.i18n.t(key, { role: this.reasonRole(mission) });
  }

  private reasonRole(mission: Mission): string {
    const wishes = this.activeWishes();
    const role = mission.roles.find((item) => wishes?.roles.includes(item) ?? false) ?? mission.roles[0];
    return role ? this.roleName(role) : '';
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

  protected async save(): Promise<void> {
    const wishes = this.draft();
    if (!wishes || this.saving() || this.dateInvalid()) return;
    this.saving.set(true);
    try {
      await this.wishesStore.update(wishes);
      this.dirty.set(false);
      this.toast.show(this.i18n.t('toast.wishesSaved'), 'success');
    } catch {
      this.toast.show(this.i18n.t('common.error'), 'error');
    } finally {
      this.saving.set(false);
    }
  }

  private update(change: (wishes: Wishlist) => Wishlist): void {
    const wishes = this.draft();
    if (!wishes) return;
    this.draft.set(change(wishes));
    this.dirty.set(true);
  }

  private wishScore(mission: Mission, wishes: Wishlist): number {
    let score = 0;
    if (wishes.roles.some((role) => mission.roles.includes(role))) score += 4;
    if (wishes.regions.includes(mission.region)) score += 3;
    if (wishes.countries.includes(mission.countryCode)) score += 4;
    if (wishes.contractTypes.includes(mission.contractType)) score += 2;
    const overlaps =
      mission.startDate <= wishes.availability.to && mission.endDate >= wishes.availability.from;
    if (overlaps) score += 2;
    return score;
  }
}
