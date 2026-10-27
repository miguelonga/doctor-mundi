import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideClipboardList, LucideCompass, LucideHeart, LucideUserRound } from '@lucide/angular';
import { I18nService } from '@doctor-mundi/core';
import { ApplicationsStore } from '@doctor-mundi/data-access';

@Component({
  selector: 'dm-mobile-tabbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideClipboardList, LucideCompass, LucideHeart, LucideUserRound],
  templateUrl: './mobile-tabbar.html',
  styleUrl: './mobile-tabbar.scss',
})
export class MobileTabbar {
  protected readonly i18n = inject(I18nService);
  protected readonly applications = inject(ApplicationsStore);
}
