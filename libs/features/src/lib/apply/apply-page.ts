import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideArrowLeft,
  LucideArrowUpRight,
  LucideBadgeCheck,
  LucideCalendarDays,
  LucideCircleCheck,
  LucideClock3,
  LucideMapPin,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { Button } from '@tahoe/ui';
import { Form as TahoeForm, FormConfig, FormModel } from '@tahoe/forms';
import {
  APPLICATION_STATUS_LABELS,
  COUNTRY_BY_CODE,
  I18nService,
  LANGUAGE_NAMES,
  ROLE_LABELS,
  RoleId,
  durationLabel,
} from '@doctor-mundi/core';
import {
  ApplicationsStore,
  AuthStore,
  MetaStore,
  MissionDetailStore,
  OrganizationsStore,
  ProfileStore,
} from '@doctor-mundi/data-access';
import { DmLanguageSwitcher, DmLogo, DmOrganizationMark, DmUrgencyTag } from '@doctor-mundi/ui';
import { DmDateFields } from '../shared/date-fields.directive';
import { ToastStore } from '../shared/toast.store';

@Component({
  selector: 'dm-apply-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Button,
    TahoeForm,
    DmDateFields,
    DmLanguageSwitcher,
    DmLogo,
    DmOrganizationMark,
    DmUrgencyTag,
    LucideArrowLeft,
    LucideArrowUpRight,
    LucideBadgeCheck,
    LucideCalendarDays,
      LucideCircleCheck,
    LucideClock3,
    LucideMapPin,
    LucideUsers,
    LucideX,
  ],
  templateUrl: './apply-page.html',
  styleUrl: './apply-page.scss',
})
export class ApplyPage {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(MissionDetailStore);
  protected readonly organizations = inject(OrganizationsStore);
  protected readonly profile = inject(ProfileStore);
  protected readonly applications = inject(ApplicationsStore);
  protected readonly auth = inject(AuthStore);
  private readonly meta = inject(MetaStore);
  private readonly toast = inject(ToastStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly mission = this.store.mission;
  protected readonly loading = this.store.loading;
  protected readonly submitting = signal(false);
  protected readonly success = signal(false);
  protected readonly formValues = signal<FormModel | null>(null);
  protected readonly form = viewChild(TahoeForm);
  private pendingStep = 0;

  protected readonly organization = computed(() => {
    const mission = this.mission();
    if (!mission) return null;
    return this.organizations.organizations().find((org) => org.id === mission.orgId) ?? null;
  });

  protected readonly country = computed(() => {
    const mission = this.mission();
    return mission ? (COUNTRY_BY_CODE.get(mission.countryCode) ?? null) : null;
  });

  protected readonly dates = computed(() => {
    const mission = this.mission();
    return mission ? this.i18n.formatDateRange(mission.startDate, mission.endDate) : '';
  });

  protected readonly duration = computed(() => {
    const mission = this.mission();
    return mission ? durationLabel(mission.durationWeeks, this.i18n) : '';
  });

  protected readonly place = computed(() => {
    const mission = this.mission();
    const country = this.country();
    return mission ? `${mission.city}${country ? ', ' + this.i18n.loc(country.name) : ''}` : '';
  });

  protected readonly application = computed(() => {
    const mission = this.mission();
    if (!mission) return null;
    return (
      this.applications
        .applications()
        .find((item) => item.missionId === mission.id && item.status !== 'withdrawn') ?? null
    );
  });

  protected readonly alreadyApplied = computed(() => !!this.application());
  protected readonly applicationStatus = computed(() => {
    const application = this.application();
    return application ? this.i18n.loc(APPLICATION_STATUS_LABELS[application.status]) : '';
  });

  protected readonly roleOptions = computed(() => {
    const mission = this.mission();
    return (mission?.roles ?? []).map((role) => ({
      value: role,
      label: this.i18n.loc(ROLE_LABELS[role]),
    }));
  });

  protected readonly languageOptions = computed(() => {
    const mission = this.mission();
    const profile = this.profile.profile();
    const codes = new Set<string>([
      ...this.meta.filters().languages,
      ...(mission?.languages.map((language) => language.code) ?? []),
      ...(profile?.languages.map((language) => language.code) ?? []),
    ]);
    return [...codes]
      .map((code) => ({
        value: code,
        label: LANGUAGE_NAMES[code] ? this.i18n.loc(LANGUAGE_NAMES[code]) : this.i18n.languageName(code),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, this.i18n.locale()));
  });

  protected readonly model = computed<FormModel>(() => {
    const current = this.formValues();
    if (current) return current;

    const profile = this.profile.profile();
    const mission = this.mission();
    const preferredRole =
      profile?.roles.find((role) => mission?.roles.includes(role)) ?? mission?.roles[0] ?? 'doctor';
    return {
      availableFrom: profile?.availability.from ?? mission?.startDate ?? '',
      availableTo: profile?.availability.to ?? mission?.endDate ?? '',
      confirmDates: false,
      role: preferredRole,
      years: this.profileYears(),
      license: '',
      driving: false,
      languages: profile?.languages.map((language) => language.code) ?? [],
      health: '',
      motivation: '',
      consent: false,
    };
  });

  protected readonly config = computed<FormConfig>(() => {
    const mission = this.mission();
    const profile = this.profile.profile();
    const title = mission ? this.i18n.loc(mission.title) : '';
    const org = this.organization()?.name ?? '';
    // Read the language so a language switch updates the form labels while the
    // latest values are preserved through the current model.
    this.i18n.lang();
    return {
      title: this.i18n.t('apply.title'),
      description: this.i18n.t('apply.subtitle', { mission: title, org }),
      submitLabel: this.i18n.t('apply.submit'),
      steps: [
        {
          title: this.i18n.t('apply.stepAvailability'),
          fields: [
            {
              key: 'availableFrom',
              type: 'text',
              label: this.i18n.t('apply.availableFrom'),
              placeholder: 'AAAA-MM-DD',
              required: true,
            },
            {
              key: 'availableTo',
              type: 'text',
              label: this.i18n.t('apply.availableTo'),
              placeholder: 'AAAA-MM-DD',
              required: true,
            },
            {
              key: 'confirmDates',
              type: 'checkbox',
              label: this.i18n.t('apply.confirmDates'),
              required: true,
              colSpan: 2,
            },
          ],
        },
        {
          title: this.i18n.t('apply.stepExperience'),
          fields: [
            {
              key: 'role',
              type: 'select',
              label: this.i18n.t('apply.role'),
              required: true,
              options: this.roleOptions(),
            },
            {
              key: 'years',
              type: 'number',
              label: this.i18n.t('apply.yearsExperience'),
              required: true,
              min: 0,
              max: 60,
              step: 1,
            },
            {
              key: 'license',
              type: 'text',
              label: this.i18n.t('apply.license'),
              description: this.i18n.t('apply.licenseHint'),
            },
            {
              key: 'driving',
              type: 'checkbox',
              label: this.i18n.t('apply.driving'),
            },
          ],
        },
        {
          title: this.i18n.t('apply.stepLanguages'),
          fields: [
            {
              key: 'languages',
              type: 'multiselect',
              label: this.i18n.t('apply.languages'),
              required: true,
              colSpan: 2,
              options: this.languageOptions(),
            },
            {
              key: 'health',
              type: 'textarea',
              label: this.i18n.t('apply.health'),
              description: this.i18n.t('apply.healthHint'),
              rows: 4,
              colSpan: 2,
            },
          ],
        },
        {
          title: this.i18n.t('apply.stepMotivation'),
          fields: [
            {
              key: 'motivation',
              type: 'textarea',
              label: this.i18n.t('apply.motivation'),
              description: this.i18n.t('apply.motivationHint'),
              rows: 6,
              required: true,
              colSpan: 2,
              validators: [{ type: 'minLength', value: 40 }],
            },
            {
              key: 'consent',
              type: 'checkbox',
              label: this.i18n.t('apply.consent'),
              required: true,
              colSpan: 2,
            },
          ],
        },
        {
          title: this.i18n.t('apply.stepReview'),
          fields: [{ key: 'review', type: 'summary', colSpan: 2 }],
        },
      ],
    };
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const slug = params.get('slug');
      if (slug) this.store.load(slug);
    });
  }

  protected onValueChange(values: FormModel): void {
    this.formValues.set(values);
  }

  protected onLanguageChange(): void {
    this.pendingStep = this.form()?.engine.stepIndex() ?? 0;
    // The form reloads its config (and resets to step 1) when labels change.
    // Replay navigation once the reload has landed so values and progress stay.
    setTimeout(() => this.restoreStep(), 80);
  }

  private restoreStep(): void {
    const form = this.form();
    const target = this.pendingStep;
    this.pendingStep = 0;
    if (!form || target <= 0) return;
    const engine = form.engine;
    let guard = 0;
    while (engine.stepIndex() < target && !engine.isLastStep() && guard < 10) {
      guard += 1;
      if (!engine.next()) break;
    }
  }

  protected onInvalidSubmit(): void {
    this.toast.show(this.i18n.t('apply.requiredFields'), 'error');
  }

  protected async submit(values: FormModel): Promise<void> {
    const mission = this.mission();
    const profile = this.profile.profile();
    if (!mission || !profile || this.submitting()) return;

    const selectedLanguages = Array.isArray(values['languages'])
      ? (values['languages'] as string[])
      : [];
    const role = (values['role'] as RoleId | undefined) ?? mission.roles[0];

    this.submitting.set(true);
    try {
      await this.applications.create(mission.id, {
        availableFrom: String(values['availableFrom'] ?? profile.availability.from),
        availableTo: String(values['availableTo'] ?? profile.availability.to),
        role,
        years: Number(values['years'] ?? 0),
        license: String(values['license'] ?? ''),
        driving: values['driving'] === true,
        health: values['health'] ? String(values['health']) : undefined,
        languages: selectedLanguages.map((code) => ({
          code,
          level: profile.languages.find((language) => language.code === code)?.level ?? 'intermediate',
        })),
        motivation: String(values['motivation'] ?? ''),
        consent: values['consent'] === true,
      });
      this.success.set(true);
      this.toast.show(this.i18n.t('toast.applicationSent'), 'success');
      window.scrollTo(0, 0);
    } catch {
      this.toast.show(this.i18n.t('common.error'), 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  private profileYears(): number {
    const experience = this.profile.profile()?.experience ?? [];
    const years = experience.reduce((total, item) => {
      const from = new Date(item.from).getTime();
      const to = item.to === 'present' ? Date.now() : new Date(item.to).getTime();
      if (Number.isNaN(from) || Number.isNaN(to)) return total;
      return total + Math.max(0, (to - from) / (86_400_000 * 365));
    }, 0);
    return Math.max(1, Math.round(years));
  }
}
