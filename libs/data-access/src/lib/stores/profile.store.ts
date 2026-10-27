import { Injectable, computed, inject, resource } from '@angular/core';
import {
  ProfilePatch,
  RecommendationRequest,
  VolunteerProfile,
} from '@doctor-mundi/core';
import { ProfileApi } from '../api/profile.api';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly api = inject(ProfileApi);
  private readonly auth = inject(AuthStore);

  readonly profileResource = resource({
    params: () => this.auth.session()?.userId ?? null,
    loader: async ({ params }) => {
      if (!params) return null;
      try {
        return await this.api.getMe();
      } catch {
        return null;
      }
    },
  });

  readonly recommendationsResource = resource({
    params: () => this.profileResource.value()?.id ?? null,
    loader: ({ params }) => (params ? this.api.recommendations(params) : Promise.resolve([])),
  });

  readonly profile = computed<VolunteerProfile | null>(() => this.profileResource.value() ?? null);
  readonly recommendations = computed(() => this.recommendationsResource.value() ?? []);
  readonly loading = this.profileResource.isLoading;

  async update(patch: ProfilePatch): Promise<VolunteerProfile> {
    const updated = await this.api.updateMe(patch);
    this.profileResource.reload();
    this.auth.syncProfile(updated);
    return updated;
  }

  async requestRecommendation(payload: RecommendationRequest): Promise<void> {
    await this.api.requestRecommendation(payload);
    this.recommendationsResource.reload();
  }

  reload(): void {
    this.profileResource.reload();
    this.recommendationsResource.reload();
  }
}
