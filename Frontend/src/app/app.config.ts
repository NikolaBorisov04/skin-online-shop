import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideStore, provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { routes } from './app.routes';
import { HOME_FEATURE_KEY, homeReducer, HomeEffects } from './pages/home/home.component';
import { CONTACT_FEATURE_KEY, contactReducer, ContactEffects } from './pages/contact/contact.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),
    provideStore(),
    provideState(HOME_FEATURE_KEY, homeReducer),
    provideState(CONTACT_FEATURE_KEY, contactReducer),
    provideEffects(HomeEffects, ContactEffects),
  ]
};
