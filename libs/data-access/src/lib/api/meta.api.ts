import { FilterMeta, LandingStats } from '@doctor-mundi/core';

export abstract class MetaApi {
  abstract filters(): Promise<FilterMeta>;
  abstract stats(): Promise<LandingStats>;
}
