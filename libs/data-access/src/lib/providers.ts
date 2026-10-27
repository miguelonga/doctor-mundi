import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationsApi } from './api/applications.api';
import { AuthApi } from './api/auth.api';
import { MetaApi } from './api/meta.api';
import { MissionsApi } from './api/missions.api';
import { OrganizationsApi } from './api/organizations.api';
import { ProfileApi } from './api/profile.api';
import { SavedApi } from './api/saved.api';
import { WishesApi } from './api/wishes.api';
import { HttpDoctorMundiApi } from './http/http-api';
import { MockDoctorMundiApi } from './mock/mock-api';
import { MockDb } from './mock/mock-db';

export interface DoctorMundiDataConfig {
  readonly useMocks?: boolean;
}

/**
 * Single switch between the local mock backend and the future HTTP API.
 *
 *   provideDoctorMundiData()                 // mock, default
 *   provideDoctorMundiData({ useMocks: false }) // real API at /api
 */
export function provideDoctorMundiData(
  config: DoctorMundiDataConfig = {}
): (Provider | EnvironmentProviders)[] {
  const useMocks = config.useMocks !== false;
  if (useMocks) {
    return [
      MockDb,
      MockDoctorMundiApi,
      { provide: MissionsApi, useExisting: MockDoctorMundiApi },
      { provide: ProfileApi, useExisting: MockDoctorMundiApi },
      { provide: OrganizationsApi, useExisting: MockDoctorMundiApi },
      { provide: ApplicationsApi, useExisting: MockDoctorMundiApi },
      { provide: SavedApi, useExisting: MockDoctorMundiApi },
      { provide: WishesApi, useExisting: MockDoctorMundiApi },
      { provide: AuthApi, useExisting: MockDoctorMundiApi },
      { provide: MetaApi, useExisting: MockDoctorMundiApi },
    ];
  }
  return [
    provideHttpClient(),
    HttpDoctorMundiApi,
    { provide: MissionsApi, useExisting: HttpDoctorMundiApi },
    { provide: ProfileApi, useExisting: HttpDoctorMundiApi },
    { provide: OrganizationsApi, useExisting: HttpDoctorMundiApi },
    { provide: ApplicationsApi, useExisting: HttpDoctorMundiApi },
    { provide: SavedApi, useExisting: HttpDoctorMundiApi },
    { provide: WishesApi, useExisting: HttpDoctorMundiApi },
    { provide: AuthApi, useExisting: HttpDoctorMundiApi },
    { provide: MetaApi, useExisting: HttpDoctorMundiApi },
  ];
}
