import { ChangeDetectionStrategy, Component, DestroyRef, Injectable, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, catchError, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EntityState, createEntityAdapter } from '@ngrx/entity';
import { Store, createActionGroup, createFeatureSelector, createReducer, createSelector, emptyProps, on, props } from '@ngrx/store';

export type Brand = 'Manual Co' | 'Prince' | 'Falco';
export type Category = 'Torbe' | 'Novčanici' | 'Kaiševi' | 'Poslovni program';

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
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

const INITIAL_CART_ITEMS: readonly CartItem[] = [
  {
    id: 'cart-1',
    quantity: 1,
    product: {
      id: 'm-01',
      name: 'Luna kožna torba',
      brand: 'Manual Co',
      category: 'Torbe',
      price: 24990,
      oldPrice: 27990,
      color: 'Konjak',
      badge: 'Bestseller',
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85',
    },
  },
  {
    id: 'cart-2',
    quantity: 1,
    product: {
      id: 'p-01',
      name: 'Heritage novčanik',
      brand: 'Prince',
      category: 'Novčanici',
      price: 8990,
      color: 'Crna',
      badge: 'Novo',
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=85',
    },
  },
];

@Injectable({ providedIn: 'root' })
export class MockCartService {
  fetchCartItems(): Observable<CartItem[]> {
    const items = INITIAL_CART_ITEMS.map((item) => ({ ...item, product: { ...item.product } }));
    return of(items);
  }
}

export const cartAdapter = createEntityAdapter<CartItem>();
export interface CartState extends EntityState<CartItem> {
  loading: boolean;
  error: string | null;
}
export const CART_FEATURE_KEY = 'skinCart';
export const initialCartState: CartState = cartAdapter.setAll(
  [...INITIAL_CART_ITEMS],
  cartAdapter.getInitialState({ loading: false, error: null })
);

export const CartActions = createActionGroup({
  source: 'Skin Cart',
  events: {
    'Load Cart': emptyProps(),
    'Load Cart Success': props<{ items: CartItem[] }>(),
    'Load Cart Failure': props<{ error: string }>(),
    'Update Quantity': props<{ id: string; quantity: number }>(),
    'Remove Item': props<{ id: string }>(),
    'Clear Cart': emptyProps(),
  },
});

export const cartReducer = createReducer(
  initialCartState,
  on(CartActions.loadCart, (state) => ({ ...state, loading: true, error: null })),
  on(CartActions.loadCartSuccess, (state, { items }) => cartAdapter.setAll(items, { ...state, loading: false })),
  on(CartActions.loadCartFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(CartActions.updateQuantity, (state, { id, quantity }) => {
    const existing = state.entities[id];
    if (!existing) return state;
    if (quantity <= 0) {
      return cartAdapter.removeOne(id, state);
    }
    return cartAdapter.updateOne({ id, changes: { quantity } }, state);
  }),
  on(CartActions.removeItem, (state, { id }) => cartAdapter.removeOne(id, state)),
  on(CartActions.clearCart, (state) => cartAdapter.removeAll(state))
);

const selectCartState = createFeatureSelector<CartState>(CART_FEATURE_KEY);
const cartEntitySelectors = cartAdapter.getSelectors();
export const selectAllCartItems = createSelector(
  selectCartState,
  (state) => (state ? cartEntitySelectors.selectAll(state) : cartEntitySelectors.selectAll(initialCartState))
);
export const selectCartLoading = createSelector(
  selectCartState,
  (state) => (state ? state.loading : false)
);
export const selectCartError = createSelector(
  selectCartState,
  (state) => (state ? state.error : null)
);

@Injectable()
export class CartEffects {
  private readonly actions$ = inject(Actions);
  private readonly cartService = inject(MockCartService);

  readonly loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.loadCart),
      switchMap(() =>
        this.cartService.fetchCartItems().pipe(
          map((items) => CartActions.loadCartSuccess({ items })),
          catchError((error: unknown) =>
            of(
              CartActions.loadCartFailure({
                error: error instanceof Error ? error.message : 'Došlo je do greške pri učitavanju korpe.',
              })
            )
          )
        )
      )
    )
  );
}

export interface CartViewModel {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
}

const FREE_SHIPPING_THRESHOLD = 10000;
const SHIPPING_COST = 490;

@Component({
  selector: 'skin-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  private readonly localCart$ = new BehaviorSubject<CartItem[]>([...INITIAL_CART_ITEMS]);

  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;

  readonly vm$: Observable<CartViewModel> = combineLatest([
    this.localCart$,
    this.store.select(selectCartLoading).pipe(catchError(() => of(false))),
    this.store.select(selectCartError).pipe(catchError(() => of(null))),
  ]).pipe(
    map(([items, loading, error]) => {
      const validItems = items.filter((item) => item.product && item.quantity > 0);

      const itemCount = validItems.reduce((acc, item) => acc + item.quantity, 0);

      const itemPrices: number[] = [];
      validItems.forEach((item) => {
        itemPrices.push(item.product.price * item.quantity);
      });

      const subtotal = itemPrices.reduce((sum, price) => sum + price, 0);
      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
      const total = subtotal + shipping;

      return {
        items: validItems,
        loading,
        error,
        itemCount,
        subtotal,
        shipping,
        total,
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
    try {
      this.store.dispatch(CartActions.loadCart());
      this.store
        .select(selectAllCartItems)
        .pipe(takeUntil(this.destroy$))
        .subscribe((items) => {
          if (items) {
            this.localCart$.next(items);
          }
        });
    } catch {
      // Fallback to local state if feature store is uninitialized
    }
  }

  increaseQuantity(item: CartItem): void {
    const updated = this.localCart$.value.map((i) =>
      i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
    );
    this.localCart$.next(updated);
    this.store.dispatch(CartActions.updateQuantity({ id: item.id, quantity: item.quantity + 1 }));
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      const updated = this.localCart$.value.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
      );
      this.localCart$.next(updated);
      this.store.dispatch(CartActions.updateQuantity({ id: item.id, quantity: item.quantity - 1 }));
    } else {
      this.removeItem(item.id);
    }
  }

  removeItem(id: string): void {
    const updated = this.localCart$.value.filter((i) => i.id !== id);
    this.localCart$.next(updated);
    this.store.dispatch(CartActions.removeItem({ id }));
  }

  clearCart(): void {
    this.localCart$.next([]);
    this.store.dispatch(CartActions.clearCart());
  }

  proceedToCheckout(): void {
    void this.router.navigate(['/porudzbina']);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  trackByItemId(_: number, item: CartItem): string {
    return item.id;
  }
}
