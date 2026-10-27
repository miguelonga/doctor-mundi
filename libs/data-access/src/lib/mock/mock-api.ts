import { Injectable, inject } from '@angular/core';
import {
  Application,
  ApplicationDraft,
  AuthSession,
  FilterMeta,
  LandingStats,
  LoginPayload,
  Mission,
  MissionFilters,
  Organization,
  Paged,
  ProfilePatch,
  Recommendation,
  RecommendationRequest,
  RegisterPayload,
  VolunteerProfile,
  Wishlist,
} from '@doctor-mundi/core';
import { ApplicationsApi } from '../api/applications.api';
import { AuthApi } from '../api/auth.api';
import { MetaApi } from '../api/meta.api';
import { MissionsApi } from '../api/missions.api';
import { OrganizationsApi } from '../api/organizations.api';
import { ProfileApi } from '../api/profile.api';
import { SavedApi } from '../api/saved.api';
import { WishesApi } from '../api/wishes.api';
import { MockDb } from './mock-db';

@Injectable()
export class MockDoctorMundiApi
  implements MissionsApi, ProfileApi, OrganizationsApi, ApplicationsApi, SavedApi, WishesApi, AuthApi, MetaApi
{
  private readonly db = inject(MockDb);

  async listMissions(filters: MissionFilters): Promise<Paged<Mission>> {
    return this.db.listMissions(filters);
  }

  async getMission(slug: string): Promise<Mission | null> {
    return this.db.getMission(slug);
  }

  async getMissionById(id: string): Promise<Mission | null> {
    return this.db.getMissionById(id);
  }

  async similarMissions(id: string, limit?: number): Promise<readonly Mission[]> {
    return this.db.similarMissions(id, limit);
  }

  async featuredMissions(limit?: number): Promise<readonly Mission[]> {
    return this.db.featuredMissions(limit);
  }

  async getMe(): Promise<VolunteerProfile> {
    const profile = this.db.currentProfile();
    if (!profile) throw new Error('AUTH_REQUIRED');
    return profile;
  }

  async updateMe(patch: ProfilePatch): Promise<VolunteerProfile> {
    return this.db.updateProfile(patch);
  }

  async getProfileById(id: string): Promise<VolunteerProfile | null> {
    return this.db.profiles().find((profile) => profile.id === id) ?? null;
  }

  async recommendations(profileId?: string): Promise<readonly Recommendation[]> {
    const id = profileId ?? this.db.currentProfile()?.id;
    if (!id) return [];
    return this.db.listRecommendations(id);
  }

  async requestRecommendation(payload: RecommendationRequest): Promise<void> {
    this.db.requestRecommendation(payload);
  }

  async listOrganizations(): Promise<readonly Organization[]> {
    return this.db.organizations();
  }

  async getOrganization(slug: string): Promise<Organization | null> {
    return this.db.getOrganization(slug);
  }

  async missionsForOrganization(orgId: string): Promise<readonly Mission[]> {
    return this.db.missionsFor(orgId);
  }

  async listApplications(): Promise<readonly Application[]> {
    return this.db.currentApplications();
  }

  async createApplication(missionId: string, draft: ApplicationDraft): Promise<Application> {
    return this.db.createApplication(missionId, draft);
  }

  async withdrawApplication(id: string): Promise<void> {
    this.db.withdrawApplication(id);
  }

  async hasApplied(missionId: string): Promise<boolean> {
    return this.db.hasApplied(missionId);
  }

  async listSavedIds(): Promise<readonly string[]> {
    return this.db.currentSavedIds();
  }

  async toggleSaved(missionId: string): Promise<boolean> {
    return this.db.toggleSaved(missionId);
  }

  async isSaved(missionId: string): Promise<boolean> {
    return this.db.isSaved(missionId);
  }

  async getWishes(): Promise<Wishlist> {
    const profile = this.db.currentProfile();
    if (!profile) throw new Error('AUTH_REQUIRED');
    return this.db.wishesByUser()[profile.id] ?? profile.wishes;
  }

  async updateWishes(wishes: Wishlist): Promise<Wishlist> {
    return this.db.updateWishes(wishes);
  }

  async session(): Promise<AuthSession | null> {
    return this.db.session();
  }

  async login(payload: LoginPayload): Promise<AuthSession> {
    return this.db.login(payload.email, payload.password);
  }

  async register(payload: RegisterPayload): Promise<AuthSession> {
    return this.db.register(payload.name, payload.email, payload.password);
  }

  async logout(): Promise<void> {
    this.db.logout();
  }

  async filters(): Promise<FilterMeta> {
    return this.db.filterMeta();
  }

  async stats(): Promise<LandingStats> {
    return this.db.landingStats();
  }

  reset(): void {
    this.db.reset();
  }
}
