import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowUpRight,
  LucideBadgeCheck,
  LucideMapPin,
  LucideSearch,
  LucideShieldCheck,
} from '@lucide/angular';
import { Button, Checkbox, Input } from '@tahoe/ui';
import { COUNTRY_BY_CODE, I18nService } from '@doctor-mundi/core';
import { MissionsStore, OrganizationsStore } from '@doctor-mundi/data-access';
import { DmOrganizationMark } from '@doctor-mundi/ui';

@Component({
  selector: 'dm-organizations-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    Checkbox,
    Input,
    DmOrganizationMark,
    LucideArrowUpRight,
    LucideBadgeCheck,
    LucideMapPin,
    LucideSearch,
    LucideShieldCheck,
  ],
  templateUrl: './organizations-page.html',
  styleUrl: './organizations-page.scss',
})
export class OrganizationsPage {
  protected readonly i18n = inject(I18nService);
  protected readonly organizations = inject(OrganizationsStore);
  protected readonly missionsStore = inject(MissionsStore);

  protected readonly search = signal('');
  protected readonly verifiedOnly = signal(false);
  protected readonly loading = this.organizations.loading;
  protected readonly all = this.organizations.organizations;

  protected readonly filtered = computed(() => {
    const query = this.search().trim().toLocaleLowerCase(this.i18n.locale());
    const verified = this.verifiedOnly();
    return this.all()
      .filter((org) => {
        if (verified && !org.verified) return false;
        if (!query) return true;
        const haystack = [
          org.name,
          this.i18n.loc(org.description),
          ...org.focusAreas.map((focus) => this.i18n.loc(focus)),
        ]
          .join(' ')
          .toLocaleLowerCase(this.i18n.locale());
        return haystack.includes(query);
      })
      .sort((a, b) => {
        if (a.verified !== b.verified) return a.verified ? -1 : 1;
        const aCount = this.missionCount(a.id);
        const bCount = this.missionCount(b.id);
        return bCount - aCount || a.name.localeCompare(b.name, this.i18n.locale());
      });
  });

  protected readonly verifiedCount = computed(() => this.all().filter((org) => org.verified).length);

  protected missionCount(orgId: string): number {
    return this.missionsStore.mapMissions().filter((mission) => mission.orgId === orgId && mission.status !== 'filled')
      .length;
  }

  protected countryName(code: string): string {
    const country = COUNTRY_BY_CODE.get(code);
    return country ? this.i18n.loc(country.name) : code;
  }

  protected reset(): void {
    this.search.set('');
    this.verifiedOnly.set(false);
  }
}
