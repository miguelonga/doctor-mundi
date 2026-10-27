import { inject, Provider } from '@angular/core';
import {
  TAHOE_FORMS_I18N,
  TahoeFormsI18n,
  ValidationMessage,
  ValidatorType,
} from '@tahoe/forms';
import { I18nService } from '@doctor-mundi/core';

class LocalizedFormsI18n implements TahoeFormsI18n {
  constructor(private readonly i18n: I18nService) {}

  get next(): string {
    return this.i18n.t('form.next');
  }

  get back(): string {
    return this.i18n.t('form.back');
  }

  get submit(): string {
    return this.i18n.t('form.submit');
  }

  get summaryEmpty(): string {
    return this.i18n.t('form.summaryEmpty');
  }

  get emptyForm(): string {
    return this.i18n.t('form.empty');
  }

  get booleanTrue(): string {
    return this.i18n.t('form.yes');
  }

  get booleanFalse(): string {
    return this.i18n.t('form.no');
  }

  get emptyValue(): string {
    return this.i18n.t('form.emptyValue');
  }

  get validation(): Record<ValidatorType, ValidationMessage> {
    return {
      required: () => this.i18n.t('form.required'),
      min: (value) => this.i18n.t('form.min', { value: value ?? '' }),
      max: (value) => this.i18n.t('form.max', { value: value ?? '' }),
      minLength: (value) => this.i18n.t('form.minLength', { value: value ?? '' }),
      maxLength: (value) => this.i18n.t('form.maxLength', { value: value ?? '' }),
      pattern: () => this.i18n.t('form.pattern'),
      email: () => this.i18n.t('form.email'),
    };
  }

  stepIndicator(current: number, total: number): string {
    return this.i18n.t('form.step', { current, total });
  }

  stepTitle(index: number): string {
    return this.i18n.t('form.stepTitle', { index: index + 1 });
  }

  progressLabel(percent: number): string {
    return this.i18n.t('form.progress', { percent });
  }
}

/**
 * Tahoe Forms chrome, validation messages and summary labels follow the
 * language switcher instead of being frozen at bootstrap.
 */
export function provideLocalizedForms(): Provider {
  return {
    provide: TAHOE_FORMS_I18N,
    useFactory: () => new LocalizedFormsI18n(inject(I18nService)),
  };
}
