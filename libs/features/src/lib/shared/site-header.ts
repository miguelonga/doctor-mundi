import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideChevronDown,
  LucideHeart,
  LucideLogOut,
  LucideMenu,
  LucideMoon,
  LucideSun,
  LucideX,
} from '@lucide/angular';
import { Avatar } from '@tahoe/ui';
import { I18nService } from '@doctor-mundi/core';
import { ApplicationsStore, AuthStore, MockDb, SavedStore } from '@doctor-mundi/data-access';
import { DmLanguageSwitcher, DmLogo } from '@doctor-mundi/ui';
import { ThemeService } from './theme.service';
import { ToastStore } from './toast.store';

@Component({
  selector: 'dm-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    Avatar,
    DmLogo,
    DmLanguageSwitcher,
    LucideChevronDown,
    LucideHeart,
    LucideLogOut,
    LucideMenu,
    LucideMoon,
    LucideSun,
    LucideX,
  ],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AuthStore);
  protected readonly saved = inject(SavedStore);
  protected readonly applications = inject(ApplicationsStore);
  protected readonly theme = inject(ThemeService);
  protected readonly toast = inject(ToastStore);
  protected readonly mockDb = inject(MockDb, { optional: true });
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected readonly userOpen = signal(false);

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.dm-user')) this.userOpen.set(false);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
    this.userOpen.set(false);
  }

  protected toggleTheme(): void {
    this.theme.toggle();
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    this.closeMenu();
    this.toast.show(this.i18n.t('nav.logout'), 'info');
    await this.router.navigate(['/']);
  }

  protected resetDemo(): void {
    this.mockDb?.reset();
    this.closeMenu();
    const win = this.documentWindow();
    if (win) win.location.assign('/');
  }

  private documentWindow(): Window | null {
    return typeof window !== 'undefined' ? window : null;
  }
}
