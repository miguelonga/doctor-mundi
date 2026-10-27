import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { OrganizationsApi } from '../api/organizations.api';

@Injectable({ providedIn: 'root' })
export class OrganizationsStore {
  private readonly api = inject(OrganizationsApi);

  readonly listResource = resource({
    loader: () => this.api.listOrganizations(),
  });

  readonly organizations = computed(() => this.listResource.value() ?? []);
  readonly loading = this.listResource.isLoading;

  readonly slug = signal<string | null>(null);
  readonly organizationResource = resource({
    params: () => this.slug(),
    loader: ({ params }) => (params ? this.api.getOrganization(params) : Promise.resolve(null)),
  });

  readonly organization = computed(() => this.organizationResource.value() ?? null);

  readonly missionsResource = resource({
    params: () => this.organization()?.id ?? null,
    loader: ({ params }) => (params ? this.api.missionsForOrganization(params) : Promise.resolve([])),
  });

  readonly missions = computed(() => this.missionsResource.value() ?? []);

  load(slug: string): void {
    this.slug.set(slug);
  }
}
