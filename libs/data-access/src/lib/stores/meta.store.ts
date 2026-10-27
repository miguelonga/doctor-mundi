import { Injectable, computed, inject, resource } from '@angular/core';
import { FilterMeta, LandingStats } from '@doctor-mundi/core';
import { MetaApi } from '../api/meta.api';

const EMPTY_FILTERS: FilterMeta = {
  roles: [],
  countries: [],
  regions: [],
  languages: [],
  urgencies: [],
  contractTypes: [],
};

const EMPTY_STATS: LandingStats = {
  openMissions: 0,
  countries: 0,
  volunteers: 0,
  organizations: 0,
};

@Injectable({ providedIn: 'root' })
export class MetaStore {
  private readonly api = inject(MetaApi);

  readonly filtersResource = resource({
    loader: () => this.api.filters(),
  });

  readonly statsResource = resource({
    loader: () => this.api.stats(),
  });

  readonly filters = computed(() => this.filtersResource.value() ?? EMPTY_FILTERS);
  readonly stats = computed(() => this.statsResource.value() ?? EMPTY_STATS);
}
