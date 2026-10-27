import { Injectable, computed, signal } from '@angular/core';
import {
  Application,
  ApplicationDraft,
  ApplicationStatus,
  AuthSession,
  ContractType,
  Country,
  FilterMeta,
  L,
  LandingStats,
  Mission,
  MissionFilters,
  Organization,
  Paged,
  ProfilePatch,
  Recommendation,
  RecommendationRequest,
  RegionId,
  RoleId,
  SpecialtyId,
  Urgency,
  VolunteerProfile,
  Wishlist,
  computeProfileScore,
  recommendationCountFor,
} from '@doctor-mundi/core';
import { COUNTRIES } from '@doctor-mundi/core';
import { ROLE_LABELS, SPECIALTY_LABELS } from '@doctor-mundi/core';
import { seedDatabase } from './seed';

const STORAGE_KEY = 'doctor-mundi.mock.v1';
const VERSION = 1;
const DAY = 86_400_000;

interface MockState {
  version: number;
  organizations: Organization[];
  missions: Mission[];
  profiles: VolunteerProfile[];
  recommendations: Recommendation[];
  applications: Application[];
  savedByUser: Record<string, string[]>;
  wishesByUser: Record<string, Wishlist>;
  session: AuthSession | null;
  credentials: Record<string, string>;
  emailToUser: Record<string, string>;
}

function iso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * DAY).toISOString().slice(0, 10);
}

function emptyWishes(): Wishlist {
  return {
    roles: [],
    regions: [],
    countries: [],
    contractTypes: [],
    availability: { from: iso(30), to: iso(180) },
    alerts: true,
  };
}

function includesLocalized(value: string, query: string): boolean {
  return value.toLocaleLowerCase().includes(query);
}

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

@Injectable({ providedIn: 'root' })
export class MockDb {
  readonly organizations = signal<readonly Organization[]>([]);
  readonly missions = signal<readonly Mission[]>([]);
  readonly profiles = signal<readonly VolunteerProfile[]>([]);
  readonly recommendations = signal<readonly Recommendation[]>([]);
  readonly applications = signal<readonly Application[]>([]);
  readonly savedByUser = signal<Readonly<Record<string, readonly string[]>>>({});
  readonly wishesByUser = signal<Readonly<Record<string, Wishlist>>>({});
  readonly session = signal<AuthSession | null>(null);
  private readonly credentials = signal<Readonly<Record<string, string>>>({});
  private readonly emailToUser = signal<Readonly<Record<string, string>>>({});

  readonly currentProfile = computed(() => {
    const session = this.session();
    if (!session) return null;
    return this.profiles().find((profile) => profile.id === session.userId) ?? null;
  });

  readonly currentRecommendations = computed(() => {
    const profile = this.currentProfile();
    return profile ? this.recommendations().filter((item) => item.profileId === profile.id) : [];
  });

  readonly currentApplications = computed(() => {
    const session = this.session();
    return session
      ? this.applications()
          .filter((application) => application.userId === session.userId)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : [];
  });

  readonly currentSavedIds = computed(() => {
    const session = this.session();
    return session ? this.savedByUser()[session.userId] ?? [] : [];
  });

  constructor() {
    this.load();
  }

  reset(): void {
    this.applySeed();
  }

  login(email: string, password: string): AuthSession {
    const normalized = email.trim().toLowerCase();
    const expected = this.credentials()[normalized];
    if (!expected || expected !== password) {
      throw new Error('INVALID_CREDENTIALS');
    }
    const userId = this.emailToUser()[normalized];
    const profile = this.profiles().find((item) => item.id === userId);
    if (!profile) throw new Error('INVALID_CREDENTIALS');
    const session: AuthSession = {
      userId: profile.id,
      email: normalized,
      name: profile.name,
      role: 'volunteer',
      avatar: profile.avatar,
    };
    this.session.set(session);
    this.persist();
    return session;
  }

  register(name: string, email: string, password: string): AuthSession {
    const normalized = email.trim().toLowerCase();
    if (this.credentials()[normalized]) throw new Error('EMAIL_TAKEN');
    const id = `me-${Date.now()}`;
    const profile: VolunteerProfile = {
      id,
      slug: id,
      name: name.trim(),
      avatar: '/images/avatar-default.webp',
      headline: L('Profesional sanitario/a', 'Health professional'),
      bio: L('', ''),
      location: { city: '', countryCode: 'ES' },
      roles: [],
      specialties: [],
      languages: [{ code: 'es', level: 'native' }],
      availability: { from: iso(30), to: iso(180) },
      verified: false,
      score: {
        total: 11,
        breakdown: { verification: 6, experience: 0, specialty: 0, languages: 5, recommendations: 0, missions: 0 },
      },
      experience: [],
      education: [],
      documents: [],
      wishes: emptyWishes(),
      stats: { missions: 0, countries: 0, hours: 0 },
      joinedAt: iso(0),
    };
    this.profiles.set([...this.profiles(), profile]);
    this.credentials.set({ ...this.credentials(), [normalized]: password });
    this.emailToUser.set({ ...this.emailToUser(), [normalized]: id });
    this.wishesByUser.set({ ...this.wishesByUser(), [id]: profile.wishes });
    this.savedByUser.set({ ...this.savedByUser(), [id]: [] });
    const session: AuthSession = {
      userId: id,
      email: normalized,
      name: profile.name,
      role: 'volunteer',
      avatar: profile.avatar,
    };
    this.session.set(session);
    this.persist();
    return session;
  }

  logout(): void {
    this.session.set(null);
    this.persist();
  }

  updateProfile(patch: ProfilePatch): VolunteerProfile {
    const current = this.currentProfile();
    if (!current) throw new Error('AUTH_REQUIRED');
    const merged: VolunteerProfile = {
      ...current,
      ...patch,
      location: patch.location ? { ...current.location, ...patch.location } : current.location,
      availability: patch.availability ? { ...patch.availability } : current.availability,
    };
    const count = recommendationCountFor(merged.id, this.recommendations());
    const updated = { ...merged, score: computeProfileScore(merged, count) };
    this.profiles.set(this.profiles().map((item) => (item.id === updated.id ? updated : item)));
    const session = this.session();
    if (session && patch.name) {
      this.session.set({ ...session, name: patch.name, avatar: updated.avatar });
    }
    this.persist();
    return updated;
  }

  updateWishes(wishes: Wishlist): Wishlist {
    const current = this.currentProfile();
    if (!current) throw new Error('AUTH_REQUIRED');
    const profile = { ...current, wishes };
    this.profiles.set(this.profiles().map((item) => (item.id === profile.id ? profile : item)));
    this.guessWishesByUser(wishes, profile.id);
    this.persist();
    return wishes;
  }

  private guessWishesByUser(wishes: Wishlist, userId: string): void {
    this.wishesByUser.set({ ...this.wishesByUser(), [userId]: wishes });
  }

  toggleSaved(missionId: string): boolean {
    const session = this.session();
    if (!session) throw new Error('AUTH_REQUIRED');
    const current = this.savedByUser()[session.userId] ?? [];
    const isSaved = current.includes(missionId);
    const next = isSaved ? current.filter((id) => id !== missionId) : [...current, missionId];
    this.savedByUser.set({ ...this.savedByUser(), [session.userId]: next });
    this.persist();
    return !isSaved;
  }

  isSaved(missionId: string): boolean {
    return this.currentSavedIds().includes(missionId);
  }

  createApplication(missionId: string, draft: ApplicationDraft): Application {
    const session = this.session();
    if (!session) throw new Error('AUTH_REQUIRED');
    const mission = this.missions().find((item) => item.id === missionId);
    if (!mission) throw new Error('MISSION_NOT_FOUND');
    const active = this.applications().some(
      (application) =>
        application.userId === session.userId &&
        application.missionId === missionId &&
        !['withdrawn', 'declined'].includes(application.status)
    );
    if (active) throw new Error('ALREADY_APPLIED');
    const now = new Date().toISOString();
    const application: Application = {
      id: `app-${Date.now()}`,
      missionId,
      userId: session.userId,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
      timeline: [{ status: 'submitted', date: now, note: L('Postulación recibida.', 'Application received.') }],
      answers: {
        availableFrom: draft.availableFrom,
        availableTo: draft.availableTo,
        role: draft.role,
        years: draft.years,
        license: draft.license,
        driving: draft.driving,
        health: draft.health ?? '',
        languages: draft.languages,
      },
      motivation: draft.motivation,
    };
    this.applications.set([...this.applications(), application]);
    this.persist();
    return application;
  }

  withdrawApplication(id: string): void {
    const session = this.session();
    if (!session) throw new Error('AUTH_REQUIRED');
    const now = new Date().toISOString();
    this.applications.set(
      this.applications().map((application) =>
        application.id === id && application.userId === session.userId
          ? {
              ...application,
              status: 'withdrawn' as ApplicationStatus,
              updatedAt: now,
              timeline: [
                ...application.timeline,
                {
                  status: 'withdrawn' as ApplicationStatus,
                  date: now,
                  note: L('Has retirado tu postulación.', 'You withdrew your application.'),
                },
              ],
            }
          : application
      )
    );
    this.persist();
  }

  hasApplied(missionId: string): boolean {
    const session = this.session();
    if (!session) return false;
    return this.applications().some(
      (application) =>
        application.userId === session.userId &&
        application.missionId === missionId &&
        !['withdrawn', 'declined'].includes(application.status)
    );
  }

  requestRecommendation(payload: RecommendationRequest): void {
    const profile = this.currentProfile();
    if (!profile) throw new Error('AUTH_REQUIRED');
    const recommendation: Recommendation = {
      id: `rec-${Date.now()}`,
      profileId: profile.id,
      authorName: payload.authorName,
      authorRole: L('Recomendación solicitada', 'Recommendation requested'),
      authorAvatar: '/images/avatar-default.webp',
      organization: payload.organization ?? '',
      relation: L('Solicitud enviada', 'Request sent'),
      rating: 0,
      quote: L('Pendiente de respuesta.', 'Pending response.'),
      date: iso(0),
      status: 'pending',
    };
    this.recommendations.set([recommendation, ...this.recommendations()]);
    this.persist();
  }

  listRecommendations(profileId: string): readonly Recommendation[] {
    return this.recommendations()
      .filter((recommendation) => recommendation.profileId === profileId)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'published' ? -1 : 1;
        return b.date.localeCompare(a.date);
      });
  }

  listMissions(filters: MissionFilters): Paged<Mission> {
    const filtered = this.missions().filter((mission) => this.matches(mission, filters));
    const sorted = [...filtered].sort((a, b) => this.compare(a, b, filters.sort));
    const total = sorted.length;
    const pageSize = Math.max(1, filters.pageSize);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, filters.page), totalPages);
    const data = sorted.slice((page - 1) * pageSize, page * pageSize);
    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        facets: this.facets(filtered),
      },
    };
  }

  getMission(slug: string): Mission | null {
    return this.missions().find((mission) => mission.slug === slug) ?? null;
  }

  getMissionById(id: string): Mission | null {
    return this.missions().find((mission) => mission.id === id) ?? null;
  }

  similarMissions(id: string, limit = 3): readonly Mission[] {
    const base = this.getMissionById(id);
    if (!base) return [];
    return this.missions()
      .filter((mission) => mission.id !== id && mission.status !== 'filled')
      .map((mission) => {
        let score = 0;
        if (mission.region === base.region) score += 3;
        if (mission.roles.some((role) => base.roles.includes(role))) score += 2;
        if (mission.specialties.some((specialty) => base.specialties.includes(specialty))) score += 1;
        return { mission, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.mission.startDate.localeCompare(b.mission.startDate))
      .slice(0, limit)
      .map((item) => item.mission);
  }

  featuredMissions(limit = 4): readonly Mission[] {
    return this.missions()
      .filter((mission) => mission.featured && mission.status !== 'filled')
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, limit);
  }

  missionsFor(orgId: string): readonly Mission[] {
    return this.missions()
      .filter((mission) => mission.orgId === orgId && mission.status !== 'filled')
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  getOrganization(slug: string): Organization | null {
    return this.organizations().find((organization) => organization.slug === slug) ?? null;
  }

  filterMeta(): FilterMeta {
    const missions = this.missions();
    const roles = unique(missions.flatMap((mission) => mission.roles));
    const countries = unique(missions.map((mission) => mission.countryCode)).sort((a, b) =>
      this.countryName(a).localeCompare(this.countryName(b))
    );
    const regions = unique(missions.map((mission) => mission.region));
    const languages = unique(missions.flatMap((mission) => mission.languages.map((item) => item.code))).sort();
    const urgencies: Urgency[] = ['critical', 'high', 'standard'];
    const contractTypes: ContractType[] = ['emergency', 'short', 'long', 'remote'];
    return {
      roles: roles.sort((a, b) => ROLE_LABELS[a].es.localeCompare(ROLE_LABELS[b].es)),
      countries,
      regions,
      languages,
      urgencies,
      contractTypes,
    };
  }

  landingStats(): LandingStats {
    const open = this.missions().filter((mission) => mission.status !== 'filled');
    return {
      openMissions: open.length,
      countries: unique(open.map((mission) => mission.countryCode)).length,
      volunteers: 2418,
      organizations: this.organizations().length,
    };
  }

  private matches(mission: Mission, filters: MissionFilters): boolean {
    const q = filters.q.trim().toLocaleLowerCase();
    if (q) {
      const org = this.organizations().find((item) => item.id === mission.orgId);
      const haystack = [
        mission.title.es,
        mission.title.en,
        mission.summary.es,
        mission.summary.en,
        mission.city,
        org?.name ?? '',
        ...mission.roles.flatMap((role) => [role, ROLE_LABELS[role].es, ROLE_LABELS[role].en]),
        ...mission.specialties.flatMap((specialty) => [
          specialty,
          SPECIALTY_LABELS[specialty].es,
          SPECIALTY_LABELS[specialty].en,
        ]),
      ]
        .join(' ')
        .toLocaleLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.role !== 'all' && !mission.roles.includes(filters.role)) return false;
    if (filters.country !== 'all' && mission.countryCode !== filters.country) return false;
    if (filters.region !== 'all' && mission.region !== filters.region) return false;
    if (filters.language !== 'all' && !mission.languages.some((item) => item.code === filters.language)) return false;
    if (filters.urgency !== 'all' && mission.urgency !== filters.urgency) return false;
    if (filters.contractType !== 'all' && mission.contractType !== filters.contractType) return false;
    if (filters.startFrom && mission.endDate < filters.startFrom) return false;
    if (filters.startTo && mission.startDate > filters.startTo) return false;
    if (filters.minDuration !== undefined && mission.durationWeeks < filters.minDuration) return false;
    if (filters.verified) {
      const org = this.organizations().find((item) => item.id === mission.orgId);
      if (!org?.verified) return false;
    }
    if (filters.remote && !mission.remote) return false;
    if (!filters.remote && filters.contractType === 'remote' && !mission.remote) return false;
    return true;
  }

  private compare(a: Mission, b: Mission, sort: MissionFilters['sort']): number {
    if (sort === 'startDate') return a.startDate.localeCompare(b.startDate);
    if (sort === 'duration') return a.durationWeeks - b.durationWeeks;
    if (sort === 'urgency') {
      const rank: Record<Urgency, number> = { critical: 3, high: 2, standard: 1 };
      return rank[b.urgency] - rank[a.urgency] || a.startDate.localeCompare(b.startDate);
    }
    const featured = Number(b.featured) - Number(a.featured);
    if (featured) return featured;
    const rank: Record<Urgency, number> = { critical: 3, high: 2, standard: 1 };
    return rank[b.urgency] - rank[a.urgency] || a.startDate.localeCompare(b.startDate);
  }

  private facets(missions: readonly Mission[]) {
    const roles: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const urgencies: Record<string, number> = {};
    for (const mission of missions) {
      for (const role of mission.roles) roles[role] = (roles[role] ?? 0) + 1;
      countries[mission.countryCode] = (countries[mission.countryCode] ?? 0) + 1;
      urgencies[mission.urgency] = (urgencies[mission.urgency] ?? 0) + 1;
    }
    return { roles, countries, urgencies };
  }

  private countryName(code: string): string {
    return COUNTRIES.find((country) => country.code === code)?.name.es ?? code;
  }

  private load(): void {
    try {
      const raw = this.window?.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const state = JSON.parse(raw) as MockState;
        if (state.version === VERSION) {
          this.applyState(state);
          return;
        }
      }
    } catch {
      // Corrupt or unavailable storage: fall back to the seed.
    }
    this.applySeed();
  }

  private applySeed(): void {
    const seed = seedDatabase();
    const state: MockState = {
      version: VERSION,
      organizations: [...seed.organizations],
      missions: [...seed.missions],
      profiles: [...seed.profiles],
      recommendations: [...seed.recommendations],
      applications: [...seed.applications],
      savedByUser: { ...seed.savedByUser } as Record<string, string[]>,
      wishesByUser: { ...seed.wishesByUser },
      session: seed.session,
      credentials: { ...seed.credentials },
      emailToUser: { ...seed.emailToUser },
    };
    this.applyState(state);
    this.persist();
  }

  private applyState(state: MockState): void {
    this.organizations.set(state.organizations);
    this.missions.set(state.missions);
    this.profiles.set(state.profiles);
    this.recommendations.set(state.recommendations);
    this.applications.set(state.applications);
    this.savedByUser.set(state.savedByUser);
    this.wishesByUser.set(state.wishesByUser);
    this.session.set(state.session);
    this.credentials.set(state.credentials);
    this.emailToUser.set(state.emailToUser);
  }

  private persist(): void {
    const state: MockState = {
      version: VERSION,
      organizations: [...this.organizations()],
      missions: [...this.missions()],
      profiles: [...this.profiles()],
      recommendations: [...this.recommendations()],
      applications: [...this.applications()],
      savedByUser: { ...this.savedByUser() } as Record<string, string[]>,
      wishesByUser: { ...this.wishesByUser() },
      session: this.session(),
      credentials: { ...this.credentials() },
      emailToUser: { ...this.emailToUser() },
    };
    try {
      this.window?.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: the in-memory state still works.
    }
  }

  private get window(): Window | null {
    return typeof window !== 'undefined' ? window : null;
  }
}
