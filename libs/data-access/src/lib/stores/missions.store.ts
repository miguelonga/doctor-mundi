import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { DEFAULT_FILTERS, MissionFilters } from '@doctor-mundi/core';
import { MissionsApi } from '../api/missions.api';

@Injectable({ providedIn: 'root' })
export class MissionsStore {
  private readonly api = inject(MissionsApi);

  readonly filters = signal<MissionFilters>({ ...DEFAULT_FILTERS });

  readonly result = resource({
    params: () => this.filters(),
    loader: ({ params }) => this.api.listMissions(params),
  });

  readonly featured = resource({
    loader: () => this.api.featuredMissions(4),
  });

  readonly mapResult = resource({
    loader: () => this.api.listMissions({ ...DEFAULT_FILTERS, pageSize: 100 }),
  });

  readonly filteredMapResult = resource({
    params: () => this.filters(),
    loader: ({ params }) => this.api.listMissions({ ...params, page: 1, pageSize: 100 }),
  });

  readonly missions = computed(() => this.result.value()?.data ?? []);
  readonly mapMissions = computed(() => this.mapResult.value()?.data ?? []);
  readonly filteredMapMissions = computed(() => this.filteredMapResult.value()?.data ?? []);
  readonly meta = computed(() => this.result.value()?.meta ?? null);
  readonly loading = this.result.isLoading;
  readonly failed = computed(() => this.result.error() !== undefined);

  setFilters(patch: Partial<MissionFilters>): void {
    this.filters.update((current) => ({
      ...current,
      ...patch,
      page: patch.page ?? 1,
    }));
  }

  setPage(page: number): void {
    this.filters.update((current) => ({ ...current, page }));
  }

  resetFilters(): void {
    this.filters.set({ ...DEFAULT_FILTERS, pageSize: this.filters().pageSize });
  }

  reload(): void {
    this.result.reload();
    this.featured.reload();
    this.mapResult.reload();
    this.filteredMapResult.reload();
  }
}
