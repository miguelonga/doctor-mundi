import { Injectable, computed, inject, resource } from '@angular/core';
import { Application, ApplicationDraft } from '@doctor-mundi/core';
import { ApplicationsApi } from '../api/applications.api';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class ApplicationsStore {
  private readonly api = inject(ApplicationsApi);
  private readonly auth = inject(AuthStore);

  readonly applicationsResource = resource({
    params: () => this.auth.session()?.userId ?? null,
    loader: ({ params }) => (params ? this.api.listApplications() : Promise.resolve([])),
  });

  readonly applications = computed(() => this.applicationsResource.value() ?? []);
  readonly activeCount = computed(
    () =>
      this.applications().filter(
        (application) => !['withdrawn', 'declined', 'accepted'].includes(application.status)
      ).length
  );

  async create(missionId: string, draft: ApplicationDraft): Promise<Application> {
    const application = await this.api.createApplication(missionId, draft);
    this.applicationsResource.reload();
    return application;
  }

  async withdraw(id: string): Promise<void> {
    await this.api.withdrawApplication(id);
    this.applicationsResource.reload();
  }

  async hasApplied(missionId: string): Promise<boolean> {
    return this.api.hasApplied(missionId);
  }

  reload(): void {
    this.applicationsResource.reload();
  }
}
