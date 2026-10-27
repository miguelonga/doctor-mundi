import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX } from '@lucide/angular';
import { I18nService } from '@doctor-mundi/core';
import { ToastStore } from './toast.store';

@Component({
  selector: 'dm-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX],
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.scss',
})
export class ToastHost {
  protected readonly toasts = inject(ToastStore);
  protected readonly i18n = inject(I18nService);
}
