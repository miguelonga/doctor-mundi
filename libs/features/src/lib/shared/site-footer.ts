import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideArrowRight, LucideMail } from '@lucide/angular';
import { Button, Input } from '@tahoe/ui';
import { I18nService } from '@doctor-mundi/core';
import { DmLogo } from '@doctor-mundi/ui';
import { ToastStore } from './toast.store';

@Component({
  selector: 'dm-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, Button, Input, DmLogo, LucideArrowRight, LucideMail],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  protected readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastStore);
  protected readonly email = signal('');
  protected readonly subscribed = signal(false);
  protected readonly year = new Date().getFullYear();

  protected subscribe(): void {
    if (!this.email().includes('@')) {
      this.toast.show(this.i18n.t('common.email'), 'error');
      return;
    }
    this.subscribed.set(true);
    this.toast.show(this.i18n.t('common.subscribed'), 'success');
    this.email.set('');
  }
}
