import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { AuthStore, provideDoctorMundiData } from '@doctor-mundi/data-access';
import { provideLocalizedForms } from '@doctor-mundi/features/shared';
import { appRoutes } from './app.routes';
import { LocalizedTitleStrategy } from './localized-title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
    { provide: TitleStrategy, useClass: LocalizedTitleStrategy },
    ...provideDoctorMundiData({ useMocks: true }),
    provideLocalizedForms(),
    provideAppInitializer(() => inject(AuthStore).restore()),
  ],
};
