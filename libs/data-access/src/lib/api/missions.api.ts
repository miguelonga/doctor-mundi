import { Mission, MissionFilters, Paged } from '@doctor-mundi/core';

export abstract class MissionsApi {
  abstract listMissions(filters: MissionFilters): Promise<Paged<Mission>>;
  abstract getMission(slug: string): Promise<Mission | null>;
  abstract getMissionById(id: string): Promise<Mission | null>;
  abstract similarMissions(id: string, limit?: number): Promise<readonly Mission[]>;
  abstract featuredMissions(limit?: number): Promise<readonly Mission[]>;
}
