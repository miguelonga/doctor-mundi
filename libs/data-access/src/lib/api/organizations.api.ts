import { Mission, Organization } from '@doctor-mundi/core';

export abstract class OrganizationsApi {
  abstract listOrganizations(): Promise<readonly Organization[]>;
  abstract getOrganization(slug: string): Promise<Organization | null>;
  abstract missionsForOrganization(orgId: string): Promise<readonly Mission[]>;
}
