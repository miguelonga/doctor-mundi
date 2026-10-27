import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideArrowLeft,
  LucideBadgeCheck,
  LucideMapPin,
  LucideX,
} from '@lucide/angular';
import { Button } from '@tahoe/ui';
import { Form as TahoeForm, FormConfig, FormModel } from '@tahoe/forms';
import { I18nService, TranslationKey } from '@doctor-mundi/core';
import { AuthStore, MetaStore } from '@doctor-mundi/data-access';
import { DmLanguageSwitcher, DmLogo } from '@doctor-mundi/ui';
import { ToastStore } from '../shared/toast.store';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'dm-auth-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TahoeForm,
    Button,
    DmLanguageSwitcher,
    DmLogo,
    LucideArrowLeft,
      LucideBadgeCheck,
    LucideMapPin,
    LucideX,
  ],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPage {
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AuthStore);
  protected readonly meta = inject(MetaStore);
  private readonly toast = inject(ToastStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly mode = signal<AuthMode>('login');
  protected readonly formValues = signal<FormModel | null>(null);
  protected readonly submitting = signal(false);
  protected readonly error = signal<TranslationKey | null>(null);
  protected readonly returnUrl = signal<string | null>(null);

  protected readonly model = computed(() => this.formValues() ?? {});
  protected readonly isRegister = computed(() => this.mode() === 'login' ? false : true);
  protected readonly stats = this.meta.stats;

  protected readonly config = computed<FormConfig>(() => {
    const register = this.mode() === 'register';
    return {
      columns: 1,
      submitLabel: this.i18n.t(register ? 'auth.registerButton' : 'auth.loginButton'),
      fields: register
        ? [
            {
              key: 'name',
              type: 'text',
              label: this.i18n.t('common.name'),
              placeholder: this.i18n.t('auth.namePlaceholder'),
              required: true,
              validators: [{ type: 'minLength', value: 2 }],
            },
            {
              key: 'email',
              type: 'email',
              label: this.i18n.t('common.email'),
              placeholder: this.i18n.t('auth.emailPlaceholder'),
              required: true,
            },
            {
              key: 'password',
              type: 'password',
              label: this.i18n.t('common.password'),
              placeholder: this.i18n.t('auth.passwordPlaceholder'),
              required: true,
              validators: [{ type: 'minLength', value: 8 }],
            },
            {
              key: 'terms',
              type: 'checkbox',
              label: this.i18n.t('auth.terms'),
              required: true,
            },
          ]
        : [
            {
              key: 'email',
              type: 'email',
              label: this.i18n.t('common.email'),
              placeholder: this.i18n.t('auth.emailPlaceholder'),
              required: true,
            },
            {
              key: 'password',
              type: 'password',
              label: this.i18n.t('common.password'),
              placeholder: this.i18n.t('auth.passwordPlaceholder'),
              required: true,
              validators: [{ type: 'minLength', value: 8 }],
            },
          ],
    };
  });

  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((data) => {
      const mode = data['authMode'];
      if (mode === 'login' || mode === 'register') {
        this.mode.set(mode);
        this.formValues.set(null);
        this.error.set(null);
      }
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      this.returnUrl.set(returnUrl && returnUrl.startsWith('/') ? returnUrl : null);
    });
  }

  protected onValueChange(values: FormModel): void {
    this.formValues.set(values);
    if (this.error()) this.error.set(null);
  }

  protected async submit(values: FormModel): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    try {
      if (this.mode() === 'login') {
        const session = await this.auth.login({
          email: String(values['email'] ?? '').trim(),
          password: String(values['password'] ?? ''),
        });
        this.toast.show(this.i18n.t('auth.welcome', { name: session.name }), 'success');
      } else {
        await this.auth.register({
          name: String(values['name'] ?? '').trim(),
          email: String(values['email'] ?? '').trim(),
          password: String(values['password'] ?? ''),
        });
        this.toast.show(this.i18n.t('auth.registeredToast'), 'success');
      }
      await this.router.navigateByUrl(this.destination());
    } catch {
      this.error.set(this.mode() === 'login' ? 'auth.invalid' : 'auth.registerError');
    } finally {
      this.submitting.set(false);
    }
  }

  protected async loginAsDemo(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    try {
      const session = await this.auth.login({ email: 'demo@doctormundi.org', password: 'demo1234' });
      this.toast.show(this.i18n.t('auth.welcome', { name: session.name }), 'success');
      await this.router.navigateByUrl(this.destination());
    } catch {
      this.error.set('auth.invalid');
    } finally {
      this.submitting.set(false);
    }
  }

  protected forgot(): void {
    this.toast.show(this.i18n.t('auth.resetSent'), 'info');
  }

  protected switchHref(target: AuthMode): string {
    return target === 'login' ? '/entrar' : '/crear-cuenta';
  }

  protected switchQuery(): { returnUrl: string } | Record<string, never> {
    const returnUrl = this.returnUrl();
    return returnUrl ? { returnUrl } : {};
  }

  protected destination(): string {
    return this.returnUrl() ?? '/perfil';
  }
}
