import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, EventEmitter, HostBinding, Inject, Injectable, Input, OnInit, Output, PLATFORM_ID, inject,} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, catchError, combineLatest, debounceTime, distinctUntilChanged, map, merge, of, switchMap, take, takeUntil, zip} from 'rxjs';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { Store, createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';

export type Brand = 'Manual Co' | 'Prince' | 'Falco';
export type Category = 'Torbe' | 'Novčanici' | 'Kaiševi' | 'Poslovni program';
export type ThemeMode = 'light' | 'system' | 'dark';

export interface Product {
  id: string;
  name: string;
  brand: Brand;
  category: Category;
  price: number;
  oldPrice?: number;
  image: string;
  color: string;
  badge?: string;
  featured: boolean;
}

export interface CartLine {
  product: Product;
  quantity: number;
}

const MOCK_PRODUCTS: readonly Product[] = [
  { id: 'm-01', name: 'Luna kožna torba', brand: 'Manual Co', category: 'Torbe', price: 24990, oldPrice: 27990, color: 'Konjak', badge: 'Bestseller', featured: true, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85' },
  { id: 'p-01', name: 'Heritage novčanik', brand: 'Prince', category: 'Novčanici', price: 8990, color: 'Crna', badge: 'Novo', featured: true, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=85' },
  { id: 'f-01', name: 'Linea poslovna torba', brand: 'Falco', category: 'Poslovni program', price: 31990, color: 'Tamno braon', featured: true, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85' },
  { id: 'm-02', name: 'Atelier kožni kaiš', brand: 'Manual Co', category: 'Kaiševi', price: 7490, color: 'Konjak', featured: false, image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1200&q=85' },
  { id: 'p-02', name: 'Royal mini torba', brand: 'Prince', category: 'Torbe', price: 18990, color: 'Bordo', badge: 'Limited', featured: true, image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1200&q=85' },
  { id: 'f-02', name: 'Classico card holder', brand: 'Falco', category: 'Novčanici', price: 5990, color: 'Crna', featured: false, image: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=1200&q=85' },
];

@Injectable({ providedIn: 'root' })
export class MockCatalogService {
  fetchProducts(): Observable<Product[]> {
    const payload = encodeURIComponent(JSON.stringify(MOCK_PRODUCTS));
    const request: Promise<Response> = fetch(`data:application/json;charset=utf-8,${payload}`);

    return new Observable<Product[]>((subscriber) => {
      request
        .then((response) => response.ok ? response.json() as Promise<Product[]> : Promise.reject(new Error('Katalog nije dostupan.')))
        .then((products) => {
          subscriber.next(products);
          subscriber.complete();
        })
        .catch((error: unknown) => subscriber.error(error));
    });
  }
}

export const homeAdapter = createEntityAdapter<Product>();
export interface HomeState extends EntityState<Product> { loading: boolean; error: string | null; }
export const HOME_FEATURE_KEY = 'skinHome';
export const initialHomeState: HomeState = homeAdapter.getInitialState({ loading: false, error: null });

export const HomeActions = createActionGroup({
  source: 'Skin Home',
  events: {
    'Load Products': emptyProps(),
    'Load Products Success': props<{ products: Product[] }>(),
    'Load Products Failure': props<{ error: string }>(),
  },
});

export const homeReducer = createReducer(
  initialHomeState,
  on(HomeActions.loadProducts, (state) => ({ ...state, loading: true, error: null })),
  on(HomeActions.loadProductsSuccess, (state, { products }) => homeAdapter.setAll(products, { ...state, loading: false })),
  on(HomeActions.loadProductsFailure, (state, { error }) => ({ ...state, loading: false, error }))
);

const selectHomeState = createFeatureSelector<HomeState>(HOME_FEATURE_KEY);
const entitySelectors = homeAdapter.getSelectors();
export const selectProducts = createSelector(selectHomeState, entitySelectors.selectAll);
export const selectLoading = createSelector(selectHomeState, (state) => state.loading);
export const selectError = createSelector(selectHomeState, (state) => state.error);

@Injectable()
export class HomeEffects {
  private readonly actions$ = inject(Actions);
  private readonly catalog = inject(MockCatalogService);

  readonly loadProducts$ = createEffect(() => this.actions$.pipe(
    ofType(HomeActions.loadProducts),
    switchMap(() => this.catalog.fetchProducts().pipe(
      map((products) => HomeActions.loadProductsSuccess({ products })),
      catchError((error: unknown) => of(HomeActions.loadProductsFailure({
        error: error instanceof Error ? error.message : 'Došlo je do greške pri učitavanju.',
      })))
    ))
  ));
}

interface ViewModel {
  products: Product[];
  loading: boolean;
  error: string | null;
  resultCount: number;
  totalValue: number;
}

@Component({
  selector: 'skin-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new BehaviorSubject('');
  private readonly brand$ = new BehaviorSubject<Brand | 'Svi'>('Svi');
  private readonly category$ = new BehaviorSubject<Category | 'Sve'>('Sve');
  private readonly systemTheme$ = new BehaviorSubject(false);

  @Input() initialBrand: Brand | 'Svi' = 'Svi';
  @Input() cart: readonly CartLine[] = [];
  @Output() addToCart = new EventEmitter<Product>();
  @Output() cartOpen = new EventEmitter<void>();
  @Output() themeChange = new EventEmitter<ThemeMode>();

  @HostBinding('attr.data-theme') activeTheme: 'light' | 'dark' = 'light';
  @HostBinding('class.menu-open') menuOpen = false;

  readonly brands: readonly (Brand | 'Svi')[] = ['Svi', 'Manual Co', 'Prince', 'Falco'];
  readonly categories: readonly (Category | 'Sve')[] = ['Sve', 'Torbe', 'Novčanici', 'Kaiševi', 'Poslovni program'];
  readonly themeModes: readonly { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Svetlo', icon: 'sun' },
    { value: 'system', label: 'Uređaj', icon: 'device' },
    { value: 'dark', label: 'Tamno', icon: 'moon' },
  ];

  search = '';
  selectedBrand: Brand | 'Svi' = 'Svi';
  selectedCategory: Category | 'Sve' = 'Sve';
  themeMode: ThemeMode = 'system';
  favorites = new Set<string>();
  addedProductId: string | null = null;

  readonly cartCount = () => this.cart.reduce((count, line) => count + line.quantity, 0);

  readonly vm$: Observable<ViewModel> = combineLatest([
    this.store.select(selectProducts),
    this.store.select(selectLoading),
    this.store.select(selectError),
    this.search$.pipe(debounceTime(180), distinctUntilChanged()),
    this.brand$,
    this.category$,
  ]).pipe(
    map(([products, loading, error, search, brand, category]) => {
      const normalized = search.trim().toLocaleLowerCase('sr');
      const filtered = products
        .filter((product) => brand === 'Svi' || product.brand === brand)
        .filter((product) => category === 'Sve' || product.category === category)
        .filter((product) => !normalized || [product.name, product.brand, product.category].some((value) => value.toLocaleLowerCase('sr').includes(normalized)));
      const brandInventory: Partial<Record<Brand, number>> = {};
      filtered.forEach((product) => {
        brandInventory[product.brand] = (brandInventory[product.brand] ?? 0) + 1;
      });

      return {
        products: filtered,
        loading,
        error,
        resultCount: Object.values(brandInventory).reduce((sum, count) => sum + count, 0),
        totalValue: filtered.reduce((sum, product) => sum + product.price, 0),
      };
    })
  );

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly elementRef: ElementRef<HTMLElement>,
    destroyRef: DestroyRef,
  ) {
    destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  ngOnInit(): void {
    this.selectedBrand = this.initialBrand;
    this.brand$.next(this.initialBrand);
    this.setupTheme();

    zip(of(true), this.store.select(selectProducts).pipe(take(1)))
      .pipe(takeUntil(this.destroy$))
      .subscribe(([, products]) => {
        if (!products.length) this.store.dispatch(HomeActions.loadProducts());
      });

    merge(this.brand$, this.category$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.addedProductId = null);
  }

  onSearch(value: string): void { this.search = value; this.search$.next(value); }
  selectBrand(brand: Brand | 'Svi'): void { this.selectedBrand = brand; this.brand$.next(brand); }
  selectCategory(category: Category | 'Sve'): void { this.selectedCategory = category; this.category$.next(category); }

  quickAdd(product: Product): void {
    this.addedProductId = product.id;
    this.addToCart.emit(product);
    window.setTimeout(() => this.addedProductId = null, 1200);
  }

  toggleFavorite(productId: string): void {
    const updated = new Set(this.favorites);
    updated.has(productId) ? updated.delete(productId) : updated.add(productId);
    this.favorites = updated;
  }

  openCart(): void { this.cartOpen.emit(); }
  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }
  browseCategory(category: Category): void { this.selectCategory(category); this.scrollToProducts(); }
  navigateToProduct(product: Product): void { void this.router.navigate(['/proizvodi', product.id]); }
  retry(): void { this.store.dispatch(HomeActions.loadProducts()); }

  setTheme(mode: ThemeMode): void {
    this.themeMode = mode;
    if (isPlatformBrowser(this.platformId)) localStorage.setItem('skin-theme', mode);
    this.applyTheme(mode, this.systemTheme$.value);
    this.themeChange.emit(mode);
  }

  trackProduct(_: number, product: Product): string { return product.id; }
  formatPrice(value: number): string { return new Intl.NumberFormat('sr-RS', { style: 'currency', currency: 'RSD', maximumFractionDigits: 0 }).format(value); }

  scrollToProducts(): void {
    this.document.getElementById('izdvajamo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private setupTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const saved = localStorage.getItem('skin-theme');
    this.themeMode = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    this.systemTheme$.next(media.matches);
    this.applyTheme(this.themeMode, media.matches);

    const listener = (event: MediaQueryListEvent) => this.systemTheme$.next(event.matches);
    media.addEventListener('change', listener);
    this.systemTheme$.pipe(takeUntil(this.destroy$)).subscribe((dark) => {
      if (this.themeMode === 'system') this.applyTheme('system', dark);
    });
  }

  private applyTheme(mode: ThemeMode, systemDark: boolean): void {
    this.activeTheme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
    this.elementRef.nativeElement.style.colorScheme = this.activeTheme;
  }
}

/*
Host registracija (Angular application config):
provideStore(), provideState(HOME_FEATURE_KEY, homeReducer), provideEffects(HomeEffects)
Ruta: { path: '', component: HomeComponent }
Potrebni paketi: @ngrx/store, @ngrx/effects, @ngrx/entity i rxjs.
*/
