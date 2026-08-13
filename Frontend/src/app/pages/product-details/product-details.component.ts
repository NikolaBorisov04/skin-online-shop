import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, Subject, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { MockProductsService, Product, ProductVariant } from '../products/products.component';

export type ProductTab = 'description' | 'specs' | 'shipping' | 'care';

@Component({
  selector: 'skin-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(MockProductsService);
  private readonly store = inject(Store);
  private readonly destroy$ = new Subject<void>();

  readonly product$ = new BehaviorSubject<Product | null>(null);
  readonly loading$ = new BehaviorSubject<boolean>(true);
  readonly error$ = new BehaviorSubject<string | null>(null);

  readonly selectedImage$ = new BehaviorSubject<string>('');
  readonly quantity$ = new BehaviorSubject<number>(1);
  readonly activeTab$ = new BehaviorSubject<ProductTab>('description');

  readonly isAdding$ = new BehaviorSubject<boolean>(false);
  readonly isAdded$ = new BehaviorSubject<boolean>(false);
  readonly toastMessage$ = new BehaviorSubject<string | null>(null);

  private touchStartX = 0;

  readonly relatedProducts$: Observable<Product[]> = combineLatest([
    this.product$,
    this.productsService.fetchProducts(),
  ]).pipe(
    map(([current, all]) => {
      if (!current) return [];
      return all
        .filter((p) => p.id !== current.id && (p.category === current.category || p.brand === current.brand))
        .slice(0, 4);
    })
  );

  constructor(destroyRef: DestroyRef) {
    destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        switchMap((id) => {
          this.loading$.next(true);
          this.error$.next(null);
          this.quantity$.next(1);
          this.isAdded$.next(false);
          this.isAdding$.next(false);

          if (!id) {
            return of(null);
          }
          return this.productsService.fetchProductById(id);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (product) => {
          this.loading$.next(false);
          if (product) {
            this.product$.next(product);
            this.selectedImage$.next(product.gallery?.[0] || product.image);
          } else {
            this.product$.next(null);
            this.error$.next('Proizvod sa traženim identifikatorom nije pronađen.');
          }
        },
        error: () => {
          this.loading$.next(false);
          this.error$.next('Došlo je do greške prilikom učitavanja detalja o proizvodu.');
        },
      });
  }

  selectImage(img: string): void {
    this.selectedImage$.next(img);
  }

  prevImage(product: Product): void {
    const gallery = product.gallery && product.gallery.length ? product.gallery : [product.image];
    if (gallery.length <= 1) return;
    const currentIndex = gallery.indexOf(this.selectedImage$.value);
    const prevIndex = currentIndex <= 0 ? gallery.length - 1 : currentIndex - 1;
    this.selectedImage$.next(gallery[prevIndex]);
  }

  nextImage(product: Product): void {
    const gallery = product.gallery && product.gallery.length ? product.gallery : [product.image];
    if (gallery.length <= 1) return;
    const currentIndex = gallery.indexOf(this.selectedImage$.value);
    const nextIndex = currentIndex < 0 || currentIndex >= gallery.length - 1 ? 0 : currentIndex + 1;
    this.selectedImage$.next(gallery[nextIndex]);
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length > 0) {
      this.touchStartX = event.touches[0].clientX;
    }
  }

  onTouchEnd(event: TouchEvent, product: Product): void {
    if (event.changedTouches.length > 0) {
      const touchEndX = event.changedTouches[0].clientX;
      const deltaX = this.touchStartX - touchEndX;

      if (Math.abs(deltaX) > 40) {
        if (deltaX > 0) {
          this.nextImage(product);
        } else {
          this.prevImage(product);
        }
      }
    }
  }

  increaseQuantity(): void {
    this.quantity$.next(this.quantity$.value + 1);
  }

  decreaseQuantity(): void {
    if (this.quantity$.value > 1) {
      this.quantity$.next(this.quantity$.value - 1);
    }
  }

  setTab(tab: ProductTab): void {
    this.activeTab$.next(tab);
  }

  addToCart(product: Product): void {
    if (this.isAdding$.value || this.isAdded$.value) return;

    const qty = this.quantity$.value;
    this.isAdding$.next(true);

    window.setTimeout(() => {
      this.isAdding$.next(false);
      this.isAdded$.next(true);

      this.store.dispatch({
        type: '[Cart] Add Product',
        product,
        quantity: qty,
      });

      this.showToast(`Dodato ${qty}x "${product.name}" u vašu korpu.`);

      window.setTimeout(() => {
        this.isAdded$.next(false);
      }, 2400);
    }, 450);
  }

  navigateToVariant(variant: ProductVariant): void {
    const scrollPosition = window.scrollY;
    void this.router.navigate(['/proizvodi', variant.id]).then(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPosition, behavior: 'instant' });
      });
    });
  }

  navigateToProduct(product: Product): void {
    void this.router.navigate(['/proizvodi', product.id]);
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private showToast(message: string): void {
    this.toastMessage$.next(message);
    window.setTimeout(() => {
      if (this.toastMessage$.value === message) {
        this.toastMessage$.next(null);
      }
    }, 3500);
  }
}
