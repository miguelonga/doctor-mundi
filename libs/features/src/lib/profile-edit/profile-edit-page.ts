import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideArrowLeft,
  LucideCheck,
  LucideCircle,
  LucideSparkles,
} from '@lucide/angular';
import { Avatar, Button } from '@tahoe/ui';
import { Form as TahoeForm, FormConfig, FormModel } from '@tahoe/forms';
import {
  COUNTRIES,
  I18nService,
  LANGUAGE_NAMES,
  ProfileLanguage,
  ROLE_LABELS,
  RoleId,
  SPECIALTY_LABELS,
  SpecialtyId,
  TranslationKey,
} from '@doctor-mundi/core';
import { ProfileStore } from '@doctor-mundi/data-access';
import { DmLanguageSwitcher } from '@doctor-mundi/ui';
import { DmDateFields } from '../shared/date-fields.directive';
import { ToastStore } from '../shared/toast.store';

type Check = {
  key: 'basic' | 'roles' | 'languages' | 'availability' | 'documents';
  label: TranslationKey;
  done: boolean;
};

@Component({
  selector: 'dm-profile-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TahoeForm,
    Button,
    DmLanguageSwitcher,
    DmDateFields,
    Avatar,
    LucideArrowLeft,
    LucideCheck,
    LucideCircle,
    LucideSparkles,
  ],
  templateUrl: './profile-edit-page.html',
  styleUrl: './profile-edit-page.scss',
})
export class ProfileEditPage {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(ProfileStore);
  private readonly toast = inject(ToastStore);
  private readonly router = inject(Router);

  protected readonly profile = this.store.profile;
  protected readonly loading = this.store.loading;
  protected readonly form = viewChild(TahoeForm);
  protected readonly formValues = signal<FormModel | null>(null);
  protected readonly saving = signal(false);
  private pendingStep = 0;

  protected readonly roleOptions = computed(() =>
    (Object.keys(ROLE_LABELS) as RoleId[]).map((role) => ({
      value: role,
      label: this.i18n.loc(ROLE_LABELS[role]),
    }))
  );

  protected readonly specialtyOptions = computed(() =>
    (Object.keys(SPECIALTY_LABELS) as SpecialtyId[]).map((specialty) => ({
      value: specialty,
      label: this.i18n.loc(SPECIALTY_LABELS[specialty]),
    }))
  );

  protected readonly languageOptions = computed(() =>
    Object.keys(LANGUAGE_NAMES)
      .map((code) => ({ value: code, label: this.i18n.loc(LANGUAGE_NAMES[code]) }))
      .sort((a, b) => a.label.localeCompare(b.label, this.i18n.locale()))
  );

  protected readonly countryOptions = computed(() =>
    [...COUNTRIES]
      .map((country) => ({ value: country.code, label: this.i18n.loc(country.name) }))
      .sort((a, b) => a.label.localeCompare(b.label, this.i18n.locale()))
  );

  protected readonly model = computed<FormModel>(() => {
    const profile = this.profile();
    if (!profile) return {};
    const latest = this.formValues();
    if (latest) return latest;
    return {
      name: profile.name,
      headline: this.i18n.loc(profile.headline),
      bio: this.i18n.loc(profile.bio),
      city: profile.location.city,
      countryCode: profile.location.countryCode,
      roles: [...profile.roles],
      specialties: [...profile.specialties],
      languages: profile.languages.map((language) => language.code),
      availableFrom: profile.availability.from,
      availableTo: profile.availability.to,
    };
  });

  protected readonly config = computed<FormConfig>(() => ({
    columns: 1,
    submitLabel: this.i18n.t('common.save'),
    nextLabel: this.i18n.t('common.next'),
    backLabel: this.i18n.t('common.back'),
    steps: [
      {
        title: this.i18n.t('profile.personalData'),
        description: this.i18n.t('profile.editPersonalSub'),
        fields: [
          {
            key: 'name',
            type: 'text',
            label: this.i18n.t('common.name'),
            required: true,
            validators: [{ type: 'minLength', value: 2 }],
          },
          {
            key: 'headline',
            type: 'text',
            label: this.i18n.t('common.headline'),
            description: this.i18n.t('profile.headlineHint'),
            required: true,
          },
          {
            key: 'bio',
            type: 'textarea',
            label: this.i18n.t('common.bio'),
            description: this.i18n.t('profile.bioHint'),
            rows: 5,
            required: true,
            validators: [{ type: 'minLength', value: 40 }],
          },
          {
            key: 'city',
            type: 'text',
            label: this.i18n.t('profile.city'),
            required: true,
          },
          {
            key: 'countryCode',
            type: 'select',
            label: this.i18n.t('common.country'),
            required: true,
            options: this.countryOptions(),
          },
        ],
      },
      {
        title: this.i18n.t('profile.professionalData'),
        description: this.i18n.t('profile.editProfessionalSub'),
        fields: [
          {
            key: 'roles',
            type: 'multiselect',
            label: this.i18n.t('profile.roles'),
            description: this.i18n.t('profile.rolesHint'),
            required: true,
            options: this.roleOptions(),
            validators: [{ type: 'minLength', value: 1 }],
          },
          {
            key: 'specialties',
            type: 'multiselect',
            label: this.i18n.t('profile.specialties'),
            description: this.i18n.t('profile.specialtiesHint'),
            required: true,
            options: this.specialtyOptions(),
            validators: [{ type: 'minLength', value: 1 }],
          },
          {
            key: 'languages',
            type: 'multiselect',
            label: this.i18n.t('profile.languages'),
            description: this.i18n.t('profile.languagesHint'),
            required: true,
            options: this.languageOptions(),
            validators: [{ type: 'minLength', value: 1 }],
          },
        ],
      },
      {
        title: this.i18n.t('profile.availabilitySection'),
        description: this.i18n.t('profile.editAvailabilitySub'),
        fields: [
          {
            key: 'availableFrom',
            type: 'text',
            label: this.i18n.t('common.from'),
            placeholder: 'AAAA-MM-DD',
            required: true,
          },
          {
            key: 'availableTo',
            type: 'text',
            label: this.i18n.t('common.to'),
            placeholder: 'AAAA-MM-DD',
            required: true,
          },
        ],
      },
    ],
  }));

  protected readonly checks = computed<readonly Check[]>(() => {
    const profile = this.profile();
    const values = this.formValues();
    if (!profile) return [];
    const value = (key: string, fallback: unknown) => values?.[key] ?? fallback;
    const name = String(value('name', profile.name)).trim();
    const headline = String(value('headline', this.i18n.loc(profile.headline))).trim();
    const bio = String(value('bio', this.i18n.loc(profile.bio))).trim();
    const roles = (value('roles', profile.roles) as readonly string[]).length;
    const specialties = (value('specialties', profile.specialties) as readonly string[]).length;
    const languages = (value('languages', profile.languages.map((item) => item.code)) as readonly string[])
      .length;
    const from = String(value('availableFrom', profile.availability.from));
    const to = String(value('availableTo', profile.availability.to));
    return [
      {
        key: 'basic',
        label: 'profile.checkBasic',
        done: Boolean(name && headline && bio.length >= 40),
      },
      { key: 'roles', label: 'profile.checkRoles', done: roles > 0 && specialties > 0 },
      { key: 'languages', label: 'profile.checkLanguages', done: languages > 0 },
      { key: 'availability', label: 'profile.checkAvailability', done: Boolean(from && to) },
      {
        key: 'documents',
        label: 'profile.checkDocuments',
        done: profile.documents.every((document) => document.status === 'verified'),
      },
    ];
  });

  protected readonly completion = computed(() => {
    const checks = this.checks();
    const done = checks.filter((item) => item.done).length;
    return checks.length ? Math.round((done / checks.length) * 100) : 0;
  });

  constructor() {
    if (!this.profile()) this.store.reload();
  }

  protected onValueChange(values: FormModel): void {
    this.formValues.set(values);
  }

  protected onLanguageChange(): void {
    this.pendingStep = this.form()?.engine.stepIndex() ?? 0;
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

  protected async submit(values: FormModel): Promise<void> {
    const profile = this.profile();
    if (!profile || this.saving()) return;
    this.saving.set(true);
    try {
      const lang = this.i18n.lang();
      const selectedLanguages = (values['languages'] as readonly string[] | undefined) ?? [];
      const existing = new Map(profile.languages.map((language) => [language.code, language]));
      const languages: ProfileLanguage[] = selectedLanguages.map(
        (code) =>
          existing.get(code) ?? {
            code,
            level: 'intermediate',
          }
      );
      await this.store.update({
        name: String(values['name'] ?? profile.name).trim(),
        headline: { ...profile.headline, [lang]: String(values['headline'] ?? '').trim() },
        bio: { ...profile.bio, [lang]: String(values['bio'] ?? '').trim() },
        location: {
          city: String(values['city'] ?? profile.location.city).trim(),
          countryCode: String(values['countryCode'] ?? profile.location.countryCode),
        },
        roles: (values['roles'] as readonly RoleId[] | undefined) ?? profile.roles,
        specialties:
          (values['specialties'] as readonly SpecialtyId[] | undefined) ?? profile.specialties,
        languages,
        availability: {
          from: String(values['availableFrom'] ?? profile.availability.from),
          to: String(values['availableTo'] ?? profile.availability.to),
        },
      });
      this.toast.show(this.i18n.t('toast.profileSaved'), 'success');
      await this.router.navigate(['/perfil']);
    } catch {
      this.toast.show(this.i18n.t('common.error'), 'error');
    } finally {
      this.saving.set(false);
    }
  }
}
