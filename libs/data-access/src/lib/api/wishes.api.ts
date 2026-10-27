import { Wishlist } from '@doctor-mundi/core';

export abstract class WishesApi {
  abstract getWishes(): Promise<Wishlist>;
  abstract updateWishes(wishes: Wishlist): Promise<Wishlist>;
}
