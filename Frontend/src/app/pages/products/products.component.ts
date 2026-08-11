import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Injectable, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, catchError, combineLatest, debounceTime, distinctUntilChanged, map, of, switchMap, takeUntil } from 'rxjs';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { Store, createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';

export type Brand = 'Manual Co' | 'Prince' | 'Falco';
export type Category = 'Torbe' | 'Novčanici' | 'Kaiševi' | 'Poslovni program';
export type SortOption = 'default' | 'bestseller' | 'newest' | 'price-asc' | 'price-desc';

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
  { id: 'm-03', name: 'Monogram vikend torba', brand: 'Manual Co', category: 'Torbe', price: 38990, color: 'Tamno braon', badge: 'Premium', featured: true, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85' },
  { id: 'p-03', name: 'Executive muški kaiš', brand: 'Prince', category: 'Kaiševi', price: 6990, color: 'Crna', featured: false, image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1200&q=85' },
  { id: 'f-03', name: 'Modernist ženski novčanik', brand: 'Falco', category: 'Novčanici', price: 9490, oldPrice: 11490, color: 'Crvena', badge: 'Popust', featured: true, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=85' },
  { id: 'm-04', name: 'Saffiano futrola za pasoš', brand: 'Manual Co', category: 'Poslovni program', price: 4990, color: 'Crna', badge: 'Kolekcija', featured: false, image: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=1200&q=85' },
  { id: 'p-04', name: 'Prestige muški novčanik', brand: 'Prince', category: 'Novčanici', price: 10490, color: 'Tamno braon', featured: true, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=85' },
  { id: 'f-04', name: 'Urban kožni ruksak', brand: 'Falco', category: 'Torbe', price: 28990, color: 'Crna', badge: 'Novo', featured: true, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85' },
];

@Injectable({ providedIn: 'root' })
export class MockProductsService {
  fetchProducts(): Observable<Product[]> {
    return of([...MOCK_PRODUCTS]);
  }
}

export const productsAdapter = createEntityAdapter<Product>();
export interface ProductsState extends EntityState<Product> { loading: boolean; error: string | null; }
export const PRODUCTS_FEATURE_KEY = 'skinProducts';
export const initialProductsState: ProductsState = productsAdapter.getInitialState({ loading: false, error: null });

export const ProductsActions = createActionGroup({
  source: 'Skin Products',
  events: {
    'Load Products': emptyProps(),
    'Load Products Success': props<{ products: Product[] }>(),
    'Load Products Failure': props<{ error: string }>(),
  },
});

export const productsReducer = createReducer(
  initialProductsState,
  on(ProductsActions.loadProducts, (state) => ({ ...state, loading: true, error: null })),
  on(ProductsActions.loadProductsSuccess, (state, { products }) => productsAdapter.setAll(products, { ...state, loading: false })),
  on(ProductsActions.loadProductsFailure, (state, { error }) => ({ ...state, loading: false, error }))
);

const selectProductsState = createFeatureSelector<ProductsState>(PRODUCTS_FEATURE_KEY);
const entitySelectors = productsAdapter.getSelectors();
export const selectAllProducts = createSelector(selectProductsState, entitySelectors.selectAll);
export const selectProductsLoading = createSelector(selectProductsState, (state) => state.loading);
export const selectProductsError = createSelector(selectProductsState, (state) => state.error);

@Injectable()
export class ProductsEffects {
  private readonly actions$ = inject(Actions);
  private readonly service = inject(MockProductsService);

  readonly loadProducts$ = createEffect(() => this.actions$.pipe(
    ofType(ProductsActions.loadProducts),
    switchMap(() => this.service.fetchProducts().pipe(
      map((products) => ProductsActions.loadProductsSuccess({ products })),
      catchError((error: unknown) => of(ProductsActions.loadProductsFailure({
        error: error instanceof Error ? error.message : 'Došlo je do greške pri učitavanju kataloga.',
      })))
    ))
  ));
}

export interface ProductsViewModel {
  products: Product[];
  loading: boolean;
  error: string | null;
  resultCount: number;
  totalValue: number;
}

@Component({
  selector: 'skin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  private readonly search$ = new BehaviorSubject('');
  private readonly brand$ = new BehaviorSubject<Brand | 'Svi'>('Svi');
  private readonly category$ = new BehaviorSubject<Category | 'Sve'>('Sve');
  private readonly color$ = new BehaviorSubject<string>('Sve boje');
  private readonly sort$ = new BehaviorSubject<SortOption>('default');

  @Output() addToCart = new EventEmitter<Product>();

  readonly brands: readonly (Brand | 'Svi')[] = ['Svi', 'Manual Co', 'Prince', 'Falco'];
  readonly categories: readonly (Category | 'Sve')[] = ['Sve', 'Torbe', 'Novčanici', 'Kaiševi', 'Poslovni program'];
  readonly colors: readonly string[] = ['Sve boje', 'Konjak', 'Crna', 'Tamno braon', 'Bordo', 'Crvena'];
  readonly sortOptions: readonly { value: SortOption; label: string }[] = [
    { value: 'default', label: 'Preporučeno' },
    { value: 'bestseller', label: 'Najprodavanije (Bestseller)' },
    { value: 'newest', label: 'Najnovije u ponudi' },
    { value: 'price-asc', label: 'Cena: Od najniže' },
    { value: 'price-desc', label: 'Cena: Od najviše' },
  ];

  search = '';
  selectedBrand: Brand | 'Svi' = 'Svi';
  selectedCategory: Category | 'Sve' = 'Sve';
  selectedColor = 'Sve boje';
  selectedSort: SortOption = 'default';
  addedProductId: string | null = null;

  readonly vm$: Observable<ProductsViewModel> = combineLatest([
    this.store.select(selectAllProducts),
    this.store.select(selectProductsLoading),
    this.store.select(selectProductsError),
    this.search$.pipe(debounceTime(180), distinctUntilChanged()),
    this.brand$,
    this.category$,
    this.color$,
    this.sort$,
  ]).pipe(
    map(([products, loading, error, search, brand, category, color, sort]) => {
      const normalized = search.trim().toLocaleLowerCase('sr');

      let filtered = products
        .filter((p) => brand === 'Svi' || p.brand === brand)
        .filter((p) => category === 'Sve' || p.category === category)
        .filter((p) => color === 'Sve boje' || p.color === color)
        .filter((p) => !normalized || [p.name, p.brand, p.category, p.color].some((v) => v.toLocaleLowerCase('sr').includes(normalized)));

      filtered = [...filtered].sort((a, b) => {
        if (sort === 'bestseller') return (b.badge === 'Bestseller' ? 1 : 0) - (a.badge === 'Bestseller' ? 1 : 0);
        if (sort === 'newest') return (b.badge === 'Novo' ? 1 : 0) - (a.badge === 'Novo' ? 1 : 0);
        if (sort === 'price-asc') return a.price - b.price;
        if (sort === 'price-desc') return b.price - a.price;
        return 0;
      });

      return {
        products: filtered,
        loading,
        error,
        resultCount: filtered.length,
        totalValue: filtered.reduce((sum, p) => sum + p.price, 0),
      };
    })
  );

  constructor(destroyRef: DestroyRef) {
    destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  ngOnInit(): void {
    this.store.dispatch(ProductsActions.loadProducts());

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const brandParam = params['brand'] as string | undefined;
      if (brandParam) {
        const normalizedParam = brandParam.trim().toLocaleLowerCase('sr');
        if (normalizedParam === 'skin') {
          this.selectedBrand = 'Svi';
          this.brand$.next('Svi');
        } else {
          const matchedBrand = this.brands.find(
            (b) => b.toLocaleLowerCase('sr') === normalizedParam
          );
          if (matchedBrand) {
            this.selectedBrand = matchedBrand;
            this.brand$.next(matchedBrand);
          }
        }
      }

      const categoryParam = params['category'] as string | undefined;
      if (categoryParam) {
        const normalizedCat = categoryParam.trim().toLocaleLowerCase('sr');
        const matchedCat = this.categories.find(
          (c) => c.toLocaleLowerCase('sr') === normalizedCat
        );
        if (matchedCat) {
          this.selectedCategory = matchedCat;
          this.category$.next(matchedCat);
        }
      }
    });
  }

  onSearch(value: string): void { this.search = value; this.search$.next(value); }

  selectBrand(brand: Brand | 'Svi'): void {
    this.selectedBrand = brand;
    this.brand$.next(brand);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { brand: brand === 'Svi' ? null : brand },
      queryParamsHandling: 'merge',
    });
  }

  selectCategory(category: Category | 'Sve'): void {
    this.selectedCategory = category;
    this.category$.next(category);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category === 'Sve' ? null : category },
      queryParamsHandling: 'merge',
    });
  }

  selectColor(color: string): void {
    this.selectedColor = color;
    this.color$.next(color);
  }

  selectSort(sort: SortOption): void {
    this.selectedSort = sort;
    this.sort$.next(sort);
  }

  resetFilters(): void {
    this.search = '';
    this.selectedBrand = 'Svi';
    this.selectedCategory = 'Sve';
    this.selectedColor = 'Sve boje';
    this.selectedSort = 'default';
    this.search$.next('');
    this.brand$.next('Svi');
    this.category$.next('Sve');
    this.color$.next('Sve boje');
    this.sort$.next('default');
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  quickAdd(product: Product): void {
    this.addedProductId = product.id;
    this.addToCart.emit(product);
    window.setTimeout(() => (this.addedProductId = null), 1200);
  }

  navigateToProduct(product: Product): void {
    void this.router.navigate(['/proizvodi', product.id]);
  }

  retry(): void {
    this.store.dispatch(ProductsActions.loadProducts());
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('sr-RS', { style: 'currency', currency: 'RSD', maximumFractionDigits: 0 }).format(value);
  }

  trackProduct(_: number, product: Product): string { return product.id; }
}
