import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
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

/**
 * Ready-to-use HTTP client for a future Doctor Mundi API.
 *
 * Every method mirrors the mock contract one-to-one, so switching is a single
 * provider flag. Endpoints are intentionally conventional; adapt the paths to
 * the final backend without touching any feature code.
 */
@Injectable()
export class HttpDoctorMundiApi
  implements MissionsApi, ProfileApi, OrganizationsApi, ApplicationsApi, SavedApi, WishesApi, AuthApi, MetaApi
{
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  async listMissions(filters: MissionFilters): Promise<Paged<Mission>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '' || value === 'all') continue;
      params = params.set(key, String(value));
    }
    return firstValueFrom(this.http.get<Paged<Mission>>(`${this.base}/missions`, { params }));
  }

  async getMission(slug: string): Promise<Mission | null> {
    return firstValueFrom(
      this.http.get<Mission | null>(`${this.base}/missions/${encodeURIComponent(slug)}`)
    );
  }

  async getMissionById(id: string): Promise<Mission | null> {
    return firstValueFrom(this.http.get<Mission | null>(`${this.base}/missions/id/${id}`));
  }

  async similarMissions(id: string, limit = 3): Promise<readonly Mission[]> {
    return firstValueFrom(
      this.http.get<readonly Mission[]>(`${this.base}/missions/${id}/similar`, {
        params: new HttpParams().set('limit', limit),
      })
    );
  }

  async featuredMissions(limit = 4): Promise<readonly Mission[]> {
    return firstValueFrom(
      this.http.get<readonly Mission[]>(`${this.base}/missions/featured`, {
        params: new HttpParams().set('limit', limit),
      })
    );
  }

  async getMe(): Promise<VolunteerProfile> {
    return firstValueFrom(this.http.get<VolunteerProfile>(`${this.base}/me`));
  }

  async updateMe(patch: ProfilePatch): Promise<VolunteerProfile> {
    return firstValueFrom(this.http.patch<VolunteerProfile>(`${this.base}/me`, patch));
  }

  async getProfileById(id: string): Promise<VolunteerProfile | null> {
    return firstValueFrom(this.http.get<VolunteerProfile | null>(`${this.base}/profiles/${id}`));
  }

  async recommendations(profileId?: string): Promise<readonly Recommendation[]> {
    const path = profileId
      ? `${this.base}/profiles/${profileId}/recommendations`
      : `${this.base}/me/recommendations`;
    return firstValueFrom(this.http.get<readonly Recommendation[]>(path));
  }

  async requestRecommendation(payload: RecommendationRequest): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.base}/recommendations`, payload));
  }

  async listOrganizations(): Promise<readonly Organization[]> {
    return firstValueFrom(this.http.get<readonly Organization[]>(`${this.base}/organizations`));
  }

  async getOrganization(slug: string): Promise<Organization | null> {
    return firstValueFrom(
      this.http.get<Organization | null>(`${this.base}/organizations/${encodeURIComponent(slug)}`)
    );
  }

  async missionsForOrganization(orgId: string): Promise<readonly Mission[]> {
    return firstValueFrom(this.http.get<readonly Mission[]>(`${this.base}/organizations/${orgId}/missions`));
  }

  async listApplications(): Promise<readonly Application[]> {
    return firstValueFrom(this.http.get<readonly Application[]>(`${this.base}/me/applications`));
  }

  async createApplication(missionId: string, draft: ApplicationDraft): Promise<Application> {
    return firstValueFrom(
      this.http.post<Application>(`${this.base}/missions/${missionId}/applications`, draft)
    );
  }

  async withdrawApplication(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.base}/applications/${id}`));
  }

  async hasApplied(missionId: string): Promise<boolean> {
    return firstValueFrom(this.http.get<boolean>(`${this.base}/missions/${missionId}/application`));
  }

  async listSavedIds(): Promise<readonly string[]> {
    return firstValueFrom(this.http.get<readonly string[]>(`${this.base}/me/saved`));
  }

  async toggleSaved(missionId: string): Promise<boolean> {
    return firstValueFrom(this.http.post<boolean>(`${this.base}/me/saved/${missionId}`, {}));
  }

  async isSaved(missionId: string): Promise<boolean> {
    return firstValueFrom(this.http.get<boolean>(`${this.base}/me/saved/${missionId}`));
  }

  async getWishes(): Promise<Wishlist> {
    return firstValueFrom(this.http.get<Wishlist>(`${this.base}/me/wishes`));
  }

  async updateWishes(wishes: Wishlist): Promise<Wishlist> {
    return firstValueFrom(this.http.put<Wishlist>(`${this.base}/me/wishes`, wishes));
  }

  async session(): Promise<AuthSession | null> {
    return firstValueFrom(this.http.get<AuthSession | null>(`${this.base}/auth/session`));
  }

  async login(payload: LoginPayload): Promise<AuthSession> {
    return firstValueFrom(this.http.post<AuthSession>(`${this.base}/auth/login`, payload));
  }

  async register(payload: RegisterPayload): Promise<AuthSession> {
    return firstValueFrom(this.http.post<AuthSession>(`${this.base}/auth/register`, payload));
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.base}/auth/logout`, {}));
  }

  async filters(): Promise<FilterMeta> {
    return firstValueFrom(this.http.get<FilterMeta>(`${this.base}/meta/filters`));
  }

  async stats(): Promise<LandingStats> {
    return firstValueFrom(this.http.get<LandingStats>(`${this.base}/meta/stats`));
  }
}
