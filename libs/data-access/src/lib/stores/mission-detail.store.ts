import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { MissionsApi } from '../api/missions.api';

@Injectable({ providedIn: 'root' })
export class MissionDetailStore {
  private readonly api = inject(MissionsApi);
  readonly slug = signal<string | null>(null);

  readonly missionResource = resource({
    params: () => this.slug(),
    loader: ({ params }) => (params ? this.api.getMission(params) : Promise.resolve(null)),
  });

  readonly mission = computed(() => this.missionResource.value() ?? null);
  readonly loading = this.missionResource.isLoading;

  readonly similarResource = resource({
    params: () => this.mission()?.id ?? null,
    loader: ({ params }) => (params ? this.api.similarMissions(params, 3) : Promise.resolve([])),
  });

  readonly similar = computed(() => this.similarResource.value() ?? []);

  load(slug: string): void {
    this.slug.set(slug);
  }
}
