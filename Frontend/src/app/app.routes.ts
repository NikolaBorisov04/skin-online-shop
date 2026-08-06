import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
  },
  { path: 'o-nama', redirectTo: 'about', pathMatch: 'full' },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent),
  },
  { path: 'korpa', redirectTo: 'cart', pathMatch: 'full' },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
  },
  { path: 'kontakt', redirectTo: 'contact', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  { path: 'prijava', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  { path: 'registracija', redirectTo: 'register', pathMatch: 'full' },
  {
    path: 'lost-password',
    loadComponent: () => import('./pages/lost-password/lost-password.component').then((m) => m.LostPasswordComponent),
  },
  { path: 'zaboravljena-lozinka', redirectTo: 'lost-password', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
