import { Injectable, computed, inject, resource } from '@angular/core';
import { SavedApi } from '../api/saved.api';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class SavedStore {
  private readonly api = inject(SavedApi);
  private readonly auth = inject(AuthStore);

  readonly idsResource = resource({
    params: () => this.auth.session()?.userId ?? null,
    loader: ({ params }) => (params ? this.api.listSavedIds() : Promise.resolve([])),
  });

  readonly ids = computed(() => this.idsResource.value() ?? []);
  readonly count = computed(() => this.ids().length);

  isSaved(missionId: string): boolean {
    return this.ids().includes(missionId);
  }

  async toggle(missionId: string): Promise<boolean> {
    if (!this.auth.isAuthenticated()) throw new Error('AUTH_REQUIRED');
    const saved = await this.api.toggleSaved(missionId);
    this.idsResource.reload();
    return saved;
  }
}
