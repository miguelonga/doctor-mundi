import { Injectable, computed, inject, resource } from '@angular/core';
import { Wishlist } from '@doctor-mundi/core';
import { WishesApi } from '../api/wishes.api';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class WishesStore {
  private readonly api = inject(WishesApi);
  private readonly auth = inject(AuthStore);

  readonly wishesResource = resource({
    params: () => this.auth.session()?.userId ?? null,
    loader: async ({ params }) => {
      if (!params) return null;
      try {
        return await this.api.getWishes();
      } catch {
        return null;
      }
    },
  });

  readonly wishes = computed<Wishlist | null>(() => this.wishesResource.value() ?? null);

  async update(wishes: Wishlist): Promise<Wishlist> {
    const updated = await this.api.updateWishes(wishes);
    this.wishesResource.reload();
    return updated;
  }
}
