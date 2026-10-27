import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthSession, LoginPayload, RegisterPayload, VolunteerProfile } from '@doctor-mundi/core';
import { AuthApi } from '../api/auth.api';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);

  readonly session = signal<AuthSession | null>(null);
  readonly ready = signal(false);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly user = computed(() => this.session());

  async restore(): Promise<void> {
    try {
      const session = await this.api.session();
      this.session.set(session);
    } catch {
      this.session.set(null);
    } finally {
      this.ready.set(true);
    }
  }

  async login(payload: LoginPayload): Promise<AuthSession> {
    const session = await this.api.login(payload);
    this.session.set(session);
    return session;
  }

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const session = await this.api.register(payload);
    this.session.set(session);
    return session;
  }

  async logout(): Promise<void> {
    await this.api.logout();
    this.session.set(null);
  }

  syncProfile(profile: VolunteerProfile): void {
    const session = this.session();
    if (!session) return;
    this.session.set({
      ...session,
      name: profile.name,
      avatar: profile.avatar,
    });
  }
}
