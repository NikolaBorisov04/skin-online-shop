import { ChangeDetectionStrategy, Component, Injectable, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { createReducer } from '@ngrx/store';

export type Brand = 'Manual Co' | 'Prince' | 'Falco';

export const HOME_FEATURE_KEY = 'skinHome';
export const homeReducer = createReducer({});

@Injectable()
export class HomeEffects {}

@Component({
  selector: 'skin-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly router = inject(Router);

  navigateToBrand(brand: Brand | string): void {
    void this.router.navigate(['/products'], { queryParams: { brand } });
  }
}

/*
Host registracija (Angular application config):
provideStore(), provideState(HOME_FEATURE_KEY, homeReducer), provideEffects(HomeEffects)
Ruta: { path: '', component: HomeComponent }
Potrebni paketi: @ngrx/store, @ngrx/effects, @ngrx/entity i rxjs.
*/
