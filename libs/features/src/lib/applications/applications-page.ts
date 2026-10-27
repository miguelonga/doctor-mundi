import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideArrowUpRight,
  LucideCalendarDays,
  LucideCheck,
  LucideClock3,
  LucideInfo,
  LucideMapPin,
  LucideMessageSquare,
  LucideX,
} from '@lucide/angular';
import { Button } from '@tahoe/ui';
import {
  Application,
  ApplicationStatus,
  COUNTRY_BY_CODE,
  Organization,
  I18nService,
  Mission,
  TranslationKey,
} from '@doctor-mundi/core';
import {
  ApplicationsStore,
  MissionsStore,
  OrganizationsStore,
} from '@doctor-mundi/data-access';
import { ToastStore } from '../shared/toast.store';

type Filter = 'all' | 'active' | 'closed';
type ApplicationRow = {
  application: Application;
  mission: Mission | undefined;
  organization: Organization | undefined;
  nextStep: TranslationKey;
  note: string | null;
};

const STATUS_KEYS: Record<ApplicationStatus, TranslationKey> = {
  submitted: 'applications.statusSubmitted',
  screening: 'applications.statusScreening',
  interview: 'applications.statusInterview',
  offer: 'applications.statusOffer',
  accepted: 'applications.statusAccepted',
  declined: 'applications.statusDeclined',
  withdrawn: 'applications.statusWithdrawn',
};

const NEXT_STEP_KEYS: Record<ApplicationStatus, TranslationKey> = {
  submitted: 'applications.nextSubmitted',
  screening: 'applications.nextScreening',
  interview: 'applications.nextInterview',
  offer: 'applications.nextOffer',
  accepted: 'applications.nextAccepted',
  declined: 'applications.nextDeclined',
  withdrawn: 'applications.nextWithdrawn',
};

const ACTIVE_STATUSES: readonly ApplicationStatus[] = ['submitted', 'screening', 'interview', 'offer'];
const CLOSED_STATUSES: readonly ApplicationStatus[] = ['accepted', 'declined', 'withdrawn'];

@Component({
  selector: 'dm-applications-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    LucideArrowRight,
    LucideArrowUpRight,
    LucideCalendarDays,
    LucideCheck,
    LucideClock3,
        LucideInfo,
    LucideMapPin,
    LucideMessageSquare,
    LucideX,
  ],
  templateUrl: './applications-page.html',
  styleUrl: './applications-page.scss',
})
export class ApplicationsPage {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ApplicationsStore);
  protected readonly missionsStore = inject(MissionsStore);
  protected readonly organizations = inject(OrganizationsStore);
  private readonly toast = inject(ToastStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly applications = this.store.applications;
  protected readonly loading = this.store.applicationsResource.isLoading;
  protected readonly filter = signal<Filter>('all');
  protected readonly withdrawTarget = signal<Application | null>(null);
  protected readonly withdrawing = signal(false);

  protected readonly counts = computed(() => {
    const list = this.applications();
    return {
      all: list.length,
      active: list.filter((item) => ACTIVE_STATUSES.includes(item.status)).length,
      closed: list.filter((item) => CLOSED_STATUSES.includes(item.status)).length,
      interview: list.filter((item) => ['interview', 'offer'].includes(item.status)).length,
    };
  });

  protected readonly rows = computed<readonly ApplicationRow[]>(() => {
    const filter = this.filter();
    const missions = this.missionsStore.mapMissions();
    const organizations = this.organizations.organizations();
    return [...this.applications()]
      .filter((application) => {
        if (filter === 'active') return ACTIVE_STATUSES.includes(application.status);
        if (filter === 'closed') return CLOSED_STATUSES.includes(application.status);
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((application) => {
        const mission = missions.find((item) => item.id === application.missionId);
        const organization = mission
          ? organizations.find((item) => item.id === mission.orgId)
          : undefined;
        const current = application.timeline.find((entry) => entry.status === application.status);
        return {
          application,
          mission,
          organization,
          nextStep: NEXT_STEP_KEYS[application.status],
          note: current?.note ? this.i18n.loc(current.note) : null,
        };
      });
  });

  constructor() {
    const initial = this.route.snapshot.queryParamMap.get('estado');
    if (initial === 'active' || initial === 'closed') this.filter.set(initial);
  }

  protected selectFilter(filter: Filter): void {
    this.filter.set(filter);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { estado: filter === 'all' ? null : filter },
      replaceUrl: true,
    });
  }

  protected statusLabel(status: ApplicationStatus): string {
    return this.i18n.t(STATUS_KEYS[status]);
  }

  protected statusClass(status: ApplicationStatus): string {
    return `dm-app-status dm-app-status--${status}`;
  }

  protected date(value: string): string {
    return this.i18n.formatDate(value);
  }

  protected countryName(code: string | undefined): string {
    if (!code) return '';
    const country = COUNTRY_BY_CODE.get(code);
    return country ? this.i18n.loc(country.name) : code;
  }

  protected canWithdraw(application: Application): boolean {
    return ACTIVE_STATUSES.includes(application.status);
  }

  protected openWithdraw(application: Application): void {
    this.withdrawTarget.set(application);
  }

  protected closeWithdraw(): void {
    if (this.withdrawing()) return;
    this.withdrawTarget.set(null);
  }

  protected async withdraw(): Promise<void> {
    const target = this.withdrawTarget();
    if (!target || this.withdrawing()) return;
    this.withdrawing.set(true);
    try {
      await this.store.withdraw(target.id);
      this.withdrawTarget.set(null);
      this.toast.show(this.i18n.t('toast.applicationWithdrawn'), 'success');
    } catch {
      this.toast.show(this.i18n.t('applications.withdrawError'), 'error');
    } finally {
      this.withdrawing.set(false);
    }
  }

  protected missionTitle(row: ApplicationRow): string {
    return row.mission
      ? this.i18n.loc(row.mission.title)
      : this.i18n.t('applications.missionMissing');
  }

  protected orgName(row: ApplicationRow): string {
    return row.organization?.name ?? '';
  }

  protected applicationNote(application: Application): string | null {
    const current = application.timeline.find((entry) => entry.status === application.status);
    return current?.note ? this.i18n.loc(current.note) : null;
  }

  protected nextIcon(status: ApplicationStatus): 'clock' | 'calendar' | 'message' | 'check' | 'info' {
    if (status === 'submitted' || status === 'screening') return 'clock';
    if (status === 'interview' || status === 'offer') return 'calendar';
    if (status === 'accepted') return 'check';
    if (status === 'declined' || status === 'withdrawn') return 'info';
    return 'message';
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeWithdraw();
  }
}
