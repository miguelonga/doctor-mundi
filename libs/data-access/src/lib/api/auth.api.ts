import { AuthSession, LoginPayload, RegisterPayload } from '@doctor-mundi/core';

export abstract class AuthApi {
  abstract session(): Promise<AuthSession | null>;
  abstract login(payload: LoginPayload): Promise<AuthSession>;
  abstract register(payload: RegisterPayload): Promise<AuthSession>;
  abstract logout(): Promise<void>;
}
