import { Application, ApplicationDraft } from '@doctor-mundi/core';

export abstract class ApplicationsApi {
  abstract listApplications(): Promise<readonly Application[]>;
  abstract createApplication(missionId: string, draft: ApplicationDraft): Promise<Application>;
  abstract withdrawApplication(id: string): Promise<void>;
  abstract hasApplied(missionId: string): Promise<boolean>;
}
