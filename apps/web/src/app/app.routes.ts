import { Route } from '@angular/router';
import { authGuard, guestGuard } from '@doctor-mundi/data-access';

export const appRoutes: Route[] = [
  {
    path: '',
    title: 'seo.home',
    loadComponent: () =>
      import('@doctor-mundi/features/landing').then((module) => module.LandingPage),
  },
  {
    path: 'misiones',
    title: 'seo.missions',
    loadComponent: () =>
      import('@doctor-mundi/features/explore').then((module) => module.ExplorePage),
  },
  {
    path: 'misiones/:slug',
    title: 'seo.mission',
    loadComponent: () =>
      import('@doctor-mundi/features/mission-detail').then((module) => module.MissionDetailPage),
  },
  {
    path: 'misiones/:slug/postular',
    title: 'seo.apply',
    canActivate: [authGuard],
    data: { chrome: 'minimal' },
    loadComponent: () =>
      import('@doctor-mundi/features/apply').then((module) => module.ApplyPage),
  },
  {
    path: 'perfil',
    title: 'seo.profile',
    canActivate: [authGuard],
    loadComponent: () => import('@doctor-mundi/features/profile').then((module) => module.ProfilePage),
  },
  {
    path: 'perfil/editar',
    title: 'seo.profileEdit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@doctor-mundi/features/profile-edit').then((module) => module.ProfileEditPage),
  },
  {
    path: 'postulaciones',
    title: 'seo.applications',
    canActivate: [authGuard],
    loadComponent: () => import('@doctor-mundi/features/applications').then((module) => module.ApplicationsPage),
  },
  {
    path: 'deseos',
    title: 'seo.wishes',
    canActivate: [authGuard],
    loadComponent: () => import('@doctor-mundi/features/wishes').then((module) => module.WishesPage),
  },
  {
    path: 'entrar',
    title: 'seo.login',
    canActivate: [guestGuard],
    data: { chrome: 'minimal', authMode: 'login' },
    loadComponent: () => import('@doctor-mundi/features/auth').then((module) => module.AuthPage),
  },
  {
    path: 'crear-cuenta',
    title: 'seo.register',
    canActivate: [guestGuard],
    data: { chrome: 'minimal', authMode: 'register' },
    loadComponent: () => import('@doctor-mundi/features/auth').then((module) => module.AuthPage),
  },
  {
    path: 'como-funciona',
    title: 'seo.how',
    loadComponent: () =>
      import('@doctor-mundi/features/how-it-works').then((module) => module.HowItWorksPage),
  },
  {
    path: 'organizaciones',
    title: 'seo.orgs',
    loadComponent: () =>
      import('@doctor-mundi/features/organizations').then((module) => module.OrganizationsPage),
  },
  {
    path: 'organizaciones/:slug',
    title: 'seo.org',
    loadComponent: () =>
      import('@doctor-mundi/features/organization-detail').then(
        (module) => module.OrganizationDetailPage
      ),
  },
  {
    path: '**',
    title: 'seo.notFound',
    loadComponent: () =>
      import('@doctor-mundi/features/not-found').then((module) => module.NotFoundPage),
  },
];
