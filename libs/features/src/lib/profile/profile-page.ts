import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideArrowUpRight,
  LucideBriefcase,
  LucideCalendarDays,
  LucideCheck,
  LucideFileText,
  LucideGraduationCap,
  LucideHeart,
  LucideMapPin,
  LucidePencil,
  LucidePlus,
  LucideShieldCheck,
  LucideSparkles,
  LucideX,
} from '@lucide/angular';
import { Avatar, Button } from '@tahoe/ui';
import {
  APPLICATION_STATUS_LABELS,
  Application,
  ApplicationStatus,
  CONTRACT_LABELS,
  COUNTRY_BY_CODE,
  DocumentItem,
  ExperienceItem,
  I18nService,
  LANGUAGE_NAMES,
  LEVEL_LABELS,
  ProfileLanguage,
  REGION_LABELS,
  ROLE_LABELS,
  RoleId,
  SPECIALTY_LABELS,
  SpecialtyId,
  TranslationKey,
  Wishlist,
} from '@doctor-mundi/core';
import {
  ApplicationsStore,
  AuthStore,
  MissionsStore,
  OrganizationsStore,
  ProfileStore,
  SavedStore,
  WishesStore,
} from '@doctor-mundi/data-access';
import { DmScoreRing } from '@doctor-mundi/ui';
import { ToastStore } from '../shared/toast.store';

type Tab =
  | 'summary'
  | 'experience'
  | 'recommendations'
  | 'wishes'
  | 'documents'
  | 'applications';

type TabDef = { id: Tab; label: TranslationKey };
type ScoreBar = { key: TranslationKey; value: number; max: number };
type Suggestion = { title: TranslationKey; body: TranslationKey; action: TranslationKey; tab: Tab };

const TAB_IDS: readonly Tab[] = [
  'summary',
  'experience',
  'recommendations',
  'wishes',
  'documents',
  'applications',
];

const STATUS_KEYS: Record<ApplicationStatus, TranslationKey> = {
  submitted: 'applications.statusSubmitted',
  screening: 'applications.statusScreening',
  interview: 'applications.statusInterview',
  offer: 'applications.statusOffer',
  accepted: 'applications.statusAccepted',
  declined: 'applications.statusDeclined',
  withdrawn: 'applications.statusWithdrawn',
};

@Component({
  selector: 'dm-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Avatar,
    Button,
    DmScoreRing,
    LucideArrowUpRight,
    LucideBriefcase,
    LucideCalendarDays,
    LucideCheck,
    LucideFileText,
    LucideGraduationCap,
    LucideHeart,
    LucideMapPin,
    LucidePencil,
    LucidePlus,
    LucideShieldCheck,
    LucideSparkles,
    LucideX,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ProfileStore);
  protected readonly wishesStore = inject(WishesStore);
  protected readonly applications = inject(ApplicationsStore);
  protected readonly saved = inject(SavedStore);
  protected readonly missionsStore = inject(MissionsStore);
  protected readonly organizations = inject(OrganizationsStore);
  protected readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly profile = this.store.profile;
  protected readonly loading = this.store.loading;
  protected readonly recommendations = this.store.recommendations;
  protected readonly tab = signal<Tab>('summary');

  protected readonly tabs: readonly TabDef[] = [
    { id: 'summary', label: 'profile.tabSummary' },
    { id: 'experience', label: 'profile.tabExperience' },
    { id: 'recommendations', label: 'profile.tabRecommendations' },
    { id: 'wishes', label: 'profile.tabWishes' },
    { id: 'documents', label: 'profile.tabDocuments' },
    { id: 'applications', label: 'profile.tabApplications' },
  ];

  protected readonly scoreBars = computed<readonly ScoreBar[]>(() => {
    const breakdown = this.profile()?.score.breakdown;
    return [
      { key: 'profile.breakdownVerification', value: breakdown?.verification ?? 0, max: 25 },
      { key: 'profile.breakdownExperience', value: breakdown?.experience ?? 0, max: 20 },
      { key: 'profile.breakdownSpecialty', value: breakdown?.specialty ?? 0, max: 15 },
      { key: 'profile.breakdownLanguages', value: breakdown?.languages ?? 0, max: 15 },
      { key: 'profile.breakdownRecommendations', value: breakdown?.recommendations ?? 0, max: 15 },
      { key: 'profile.breakdownMissions', value: breakdown?.missions ?? 0, max: 10 },
    ];
  });

  protected readonly publishedRecommendations = computed(
    () => this.recommendations().filter((item) => item.status === 'published').length
  );

  protected readonly wishlist = computed<Wishlist | null>(
    () => this.wishesStore.wishes() ?? this.profile()?.wishes ?? null
  );

  protected readonly activeApplications = computed(
    () => this.applications.applications().filter((item) => !['accepted', 'declined', 'withdrawn'].includes(item.status))
  );

  protected readonly recentApplications = computed(() =>
    [...this.applications.applications()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 3)
  );

  protected readonly suggestion = computed<Suggestion>(() => {
    const profile = this.profile();
    const pendingDocs = profile?.documents.filter((item) => item.status !== 'verified').length ?? 0;
    const recScore = profile?.score.breakdown.recommendations ?? 0;
    if (recScore < 15) {
      return {
        title: 'profile.suggestionRecommendation',
        body: 'profile.suggestionRecommendationBody',
        action: 'profile.goToRecommendations',
        tab: 'recommendations',
      };
    }
    if (pendingDocs > 0) {
      return {
        title: 'profile.suggestionDocuments',
        body: 'profile.suggestionDocumentsBody',
        action: 'profile.goToDocuments',
        tab: 'documents',
      };
    }
    return {
      title: 'profile.suggestionComplete',
      body: 'profile.suggestionCompleteBody',
      action: 'profile.goToWishes',
      tab: 'wishes',
    };
  });

  protected readonly requestOpen = signal(false);
  protected readonly requesting = signal(false);
  protected readonly requestError = signal<TranslationKey | null>(null);
  protected readonly requestDraft = signal({
    authorName: '',
    authorEmail: '',
    organization: '',
    message: '',
  });

  constructor() {
    const initial = this.route.snapshot.queryParamMap.get('tab');
    if (initial && TAB_IDS.includes(initial as Tab)) this.tab.set(initial as Tab);
  }

  protected selectTab(tab: Tab): void {
    this.tab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      replaceUrl: true,
    });
  }

  protected scorePercent(value: number, max: number): string {
    return `${Math.round((value / max) * 100)}%`;
  }

  protected countryName(code: string | undefined): string {
    if (!code) return '';
    const country = COUNTRY_BY_CODE.get(code);
    return country ? this.i18n.loc(country.name) : code;
  }

  protected roleLabel(role: RoleId): string {
    return this.i18n.loc(ROLE_LABELS[role]);
  }

  protected specialtyLabel(specialty: SpecialtyId): string {
    return this.i18n.loc(SPECIALTY_LABELS[specialty]);
  }

  protected languageName(language: ProfileLanguage): string {
    return this.i18n.loc(LANGUAGE_NAMES[language.code]) || language.code;
  }

  protected levelLabel(language: ProfileLanguage): string {
    return this.i18n.loc(LEVEL_LABELS[language.level]);
  }

  protected regionLabel(region: keyof typeof REGION_LABELS): string {
    return this.i18n.loc(REGION_LABELS[region]);
  }

  protected contractLabel(contract: keyof typeof CONTRACT_LABELS): string {
    return this.i18n.loc(CONTRACT_LABELS[contract]);
  }

  protected statusLabel(status: ApplicationStatus): string {
    return this.i18n.t(STATUS_KEYS[status]);
  }

  protected monthYear(value: string): string {
    return this.i18n.formatDate(value, { month: 'short', year: 'numeric' });
  }

  protected date(value: string): string {
    return this.i18n.formatDate(value);
  }

  protected experienceDates(item: ExperienceItem): string {
    const end = item.to === 'present' ? this.i18n.t('profile.present') : this.monthYear(item.to);
    return `${this.monthYear(item.from)} – ${end}`;
  }

  protected documentStatus(status: DocumentItem['status']): { label: TranslationKey; cls: string } {
    if (status === 'verified') return { label: 'profile.documentVerified', cls: 'is-verified' };
    if (status === 'pending') return { label: 'profile.documentPending', cls: 'is-pending' };
    return { label: 'profile.documentExpired', cls: 'is-expired' };
  }

  protected applicationMission(application: Application) {
    return this.missionsStore.mapMissions().find((mission) => mission.id === application.missionId);
  }

  protected orgName(orgId: string | undefined): string {
    if (!orgId) return '';
    return this.organizations.organizations().find((org) => org.id === orgId)?.name ?? '';
  }

  protected openRecommendationRequest(): void {
    this.requestError.set(null);
    this.requestOpen.set(true);
  }

  protected closeRecommendationRequest(): void {
    if (this.requesting()) return;
    this.requestOpen.set(false);
  }

  protected updateRequest(field: keyof ReturnType<typeof this.requestDraft>, value: string): void {
    this.requestDraft.update((draft) => ({ ...draft, [field]: value }));
    if (this.requestError()) this.requestError.set(null);
  }

  protected async submitRecommendationRequest(): Promise<void> {
    const draft = this.requestDraft();
    if (!draft.authorName.trim() || !draft.authorEmail.trim() || !draft.message.trim()) {
      this.requestError.set('profile.requestRequired');
      return;
    }
    this.requesting.set(true);
    try {
      await this.store.requestRecommendation({
        authorName: draft.authorName.trim(),
        authorEmail: draft.authorEmail.trim(),
        organization: draft.organization.trim() || undefined,
        message: draft.message.trim(),
      });
      this.requestOpen.set(false);
      this.requestDraft.set({ authorName: '', authorEmail: '', organization: '', message: '' });
      this.toast.show(this.i18n.t('toast.recommendationRequested'), 'success');
    } catch {
      this.toast.show(this.i18n.t('common.error'), 'error');
    } finally {
      this.requesting.set(false);
    }
  }

  protected uploadDocument(): void {
    this.toast.show(this.i18n.t('common.comingSoon'), 'info');
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeRecommendationRequest();
  }
}
