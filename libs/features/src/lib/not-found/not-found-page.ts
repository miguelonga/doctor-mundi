import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideArrowUpRight,
  LucideCompass,
  LucideMapPin,
} from '@lucide/angular';
import { Button } from '@tahoe/ui';
import { I18nService } from '@doctor-mundi/core';

@Component({
  selector: 'dm-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, LucideArrowRight, LucideArrowUpRight, LucideCompass, LucideMapPin],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
})
export class NotFoundPage {
  protected readonly i18n = inject(I18nService);
}
