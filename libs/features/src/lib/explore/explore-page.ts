import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideFunnel,
  LucideList,
  LucideMap,
  LucideMapPin,
  LucideRotateCcw,
  LucideSearch,
  LucideX,
} from '@lucide/angular';
import { Button, Checkbox, Input, Select } from '@tahoe/ui';
import {
  CONTRACT_LABELS,
  COUNTRY_BY_CODE,
  I18nService,
  LANGUAGE_NAMES,
  Mission,
  MissionFilters,
  MissionMatch,
  MissionSort,
  REGION_LABELS,
  RegionId,
  ROLE_LABELS,
  RoleId,
  URGENCY_LABELS,
  Urgency,
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
import { DmMissionCard, DmWorldMap } from '@doctor-mundi/ui';
import { ToastStore } from '../shared/toast.store';

type ViewMode = 'map' | 'list';

const FILTER_QUERY_KEYS = [
  'q',
  'role',
  'country',
  'region',
  'language',
  'urgency',
  'contract',
  'from',
  'to',
  'minDuration',
  'verified',
  'remote',
  'sort',
  'page',
] as const;

@Component({
  selector: 'dm-explore-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    Button,
    Checkbox,
    Input,
    Select,
    DmMissionCard,
    DmWorldMap,
    LucideChevronLeft,
    LucideChevronRight,
    LucideFunnel,
    LucideList,
    LucideMap,
    LucideMapPin,
    LucideRotateCcw,
    LucideSearch,
    LucideX,
  ],
  templateUrl: './explore-page.html',
  styleUrl: './explore-page.scss',
})
export class ExplorePage {
  protected readonly i18n = inject(I18nService);
  protected readonly missionsStore = inject(MissionsStore);
  protected readonly meta = inject(MetaStore);
  protected readonly organizations = inject(OrganizationsStore);
  protected readonly profile = inject(ProfileStore);
  protected readonly saved = inject(SavedStore);
  protected readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  protected readonly filters = this.missionsStore.filters;
  protected readonly metaInfo = this.missionsStore.meta;
  protected readonly loading = this.missionsStore.loading;
  protected readonly failed = this.missionsStore.failed;
  protected readonly mapMissions = this.missionsStore.filteredMapMissions;

  protected readonly view = signal<ViewMode>('map');
  protected readonly filtersOpen = signal(false);
  protected readonly qDraft = signal(this.filters().q);
  private queryTimer: ReturnType<typeof setTimeout> | undefined;
  private ownNavigation = false;

  protected readonly activeFilterCount = computed(() => {
    const f = this.filters();
    let count = 0;
    if (f.q) count += 1;
    if (f.role !== 'all') count += 1;
    if (f.country !== 'all') count += 1;
    if (f.region !== 'all') count += 1;
    if (f.language !== 'all') count += 1;
    if (f.urgency !== 'all') count += 1;
    if (f.contractType !== 'all') count += 1;
    if (f.startFrom) count += 1;
    if (f.startTo) count += 1;
    if (f.minDuration !== undefined) count += 1;
    if (f.verified) count += 1;
    if (f.remote) count += 1;
    return count;
  });

  protected readonly total = computed(() => this.metaInfo()?.total ?? 0);
  protected readonly countriesCount = computed(() => {
    const facet = this.metaInfo()?.facets?.countries;
    if (facet && Object.keys(facet).length) return Object.keys(facet).length;
    return new Set(this.mapMissions().map((mission) => mission.countryCode)).size;
  });
  protected readonly pages = computed(() => {
    const total = this.metaInfo()?.totalPages ?? 1;
    return Array.from({ length: total }, (_, index) => index + 1);
  });

  protected readonly roleOptions = computed(() =>
    this.meta.filters().roles.map((id) => ({ value: id, label: this.i18n.loc(ROLE_LABELS[id]) }))
  );
  protected readonly countryOptions = computed(() =>
    this.meta
      .filters()
      .countries.map((code) => ({
        value: code,
        label: this.i18n.loc(COUNTRY_BY_CODE.get(code)?.name) || code,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, this.i18n.locale()))
  );
  protected readonly regionOptions = computed(() =>
    this.meta.filters().regions.map((id) => ({ value: id, label: this.i18n.loc(REGION_LABELS[id]) }))
  );
  protected readonly languageOptions = computed(() =>
    this.meta.filters().languages.map((code) => ({
      value: code,
      label: LANGUAGE_NAMES[code] ? this.i18n.loc(LANGUAGE_NAMES[code]) : this.i18n.languageName(code),
    }))
  );
  protected readonly urgencyOptions = computed(() =>
    this.meta.filters().urgencies.map((id) => ({ value: id, label: this.i18n.loc(URGENCY_LABELS[id]) }))
  );
  protected readonly contractOptions = computed(() =>
    this.meta
      .filters()
      .contractTypes.map((id) => ({ value: id, label: this.i18n.loc(CONTRACT_LABELS[id]) }))
  );

  protected readonly orgById = computed(
    () => new Map(this.organizations.organizations().map((org) => [org.id, org]))
  );

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      if (this.ownNavigation) return;
      this.applyQueryParams(params);
    });

    effect(() => {
      const open = this.filtersOpen();
      const body = this.document.body;
      if (!body) return;
      body.style.overflow = open ? 'hidden' : '';
    });
  }

  @HostListener('document:keydown.escape')
  protected closeFilters(): void {
    this.filtersOpen.set(false);
  }

  protected organizationFor(mission: Mission) {
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

  protected setQuery(value: string): void {
    this.qDraft.set(value);
    if (this.queryTimer) clearTimeout(this.queryTimer);
    this.queryTimer = setTimeout(() => this.updateFilters({ q: value }), 260);
  }

  protected updateFilters(patch: Partial<MissionFilters>): void {
    this.missionsStore.setFilters(patch);
    if (patch.q !== undefined) this.qDraft.set(patch.q);
    this.syncQuery();
  }

  protected setRole(value: string): void {
    this.updateFilters({ role: value === 'all' ? 'all' : (value as RoleId) });
  }

  protected setRegion(value: string): void {
    this.updateFilters({ region: value === 'all' ? 'all' : (value as RegionId) });
  }

  protected setUrgency(value: string): void {
    this.updateFilters({ urgency: value === 'all' ? 'all' : (value as Urgency) });
  }

  protected setDuration(value: string): void {
    this.updateFilters({ minDuration: value === 'all' ? undefined : Number(value) });
  }

  protected setSort(value: string): void {
    this.updateFilters({ sort: value as MissionSort });
  }

  protected setStartFrom(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateFilters({ startFrom: value || undefined });
  }

  protected setStartTo(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateFilters({ startTo: value || undefined });
  }

  protected setView(view: ViewMode): void {
    this.view.set(view);
    this.syncQuery();
  }

  protected setPage(page: number): void {
    const totalPages = this.metaInfo()?.totalPages ?? 1;
    if (page < 1 || page > totalPages || page === this.filters().page) return;
    this.missionsStore.setPage(page);
    this.syncQuery();
  }

  protected resetFilters(): void {
    this.missionsStore.resetFilters();
    this.qDraft.set('');
    this.syncQuery();
  }

  protected applyMobileFilters(): void {
    this.filtersOpen.set(false);
  }

  protected retry(): void {
    this.missionsStore.reload();
  }

  protected async onSave(mission: Mission): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      await this.router.navigate(['/entrar'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }
    try {
      const nowSaved = await this.saved.toggle(mission.id);
      this.toast.show(
        this.i18n.t(nowSaved ? 'toast.saved' : 'toast.unsaved'),
        nowSaved ? 'success' : 'info'
      );
    } catch {
      this.toast.show(this.i18n.t('common.error'), 'error');
    }
  }

  private applyQueryParams(params: import('@angular/router').ParamMap): void {
    const view = params.get('view');
    if (view === 'list' || view === 'map') this.view.set(view);

    const hasFilters = FILTER_QUERY_KEYS.some((key) => params.has(key));
    if (!hasFilters) return;

    const page = Number(params.get('page') ?? 1);
    const patch: Partial<MissionFilters> = {
      q: params.get('q') ?? '',
      role: (params.get('role') as RoleId | 'all' | null) ?? 'all',
      country: params.get('country') ?? 'all',
      region: (params.get('region') as MissionFilters['region'] | null) ?? 'all',
      language: params.get('language') ?? 'all',
      urgency: (params.get('urgency') as MissionFilters['urgency'] | null) ?? 'all',
      contractType: (params.get('contract') as MissionFilters['contractType'] | null) ?? 'all',
      startFrom: params.get('from') ?? undefined,
      startTo: params.get('to') ?? undefined,
      minDuration: params.has('minDuration') ? Number(params.get('minDuration')) : undefined,
      verified: params.get('verified') === '1',
      remote: params.get('remote') === '1',
      sort: (params.get('sort') as MissionFilters['sort'] | null) ?? 'relevance',
      page: Number.isFinite(page) && page > 0 ? page : 1,
    };
    this.qDraft.set(patch.q ?? '');
    this.missionsStore.setFilters(patch);
  }

  private syncQuery(): void {
    const f = this.filters();
    const params: Record<string, string | number | null> = {
      view: this.view(),
      q: f.q || null,
      role: f.role === 'all' ? null : f.role,
      country: f.country === 'all' ? null : f.country,
      region: f.region === 'all' ? null : f.region,
      language: f.language === 'all' ? null : f.language,
      urgency: f.urgency === 'all' ? null : f.urgency,
      contract: f.contractType === 'all' ? null : f.contractType,
      from: f.startFrom || null,
      to: f.startTo || null,
      minDuration: f.minDuration ?? null,
      verified: f.verified ? 1 : null,
      remote: f.remote ? 1 : null,
      sort: f.sort === 'relevance' ? null : f.sort,
      page: f.page > 1 ? f.page : null,
    };
    this.ownNavigation = true;
    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: params,
        replaceUrl: true,
      })
      .finally(() => {
        setTimeout(() => {
          this.ownNavigation = false;
        });
      });
  }
}
