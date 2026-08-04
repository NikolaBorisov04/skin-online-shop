import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  HostBinding,
  Inject,
  Injectable,
  Input,
  OnInit,
  Output,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  combineLatest,
  map,
  merge,
  of,
  switchMap,
  take,
  takeUntil,
  zip,
} from 'rxjs';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EntityState, createEntityAdapter } from '@ngrx/entity';
import {
  Store,
  createActionGroup,
  createFeatureSelector,
  createReducer,
  createSelector,
  emptyProps,
  on,
  props,
} from '@ngrx/store';

export type ThemeMode = 'light' | 'system' | 'dark';

export interface ContactInfo {
  id: string;
  label: string;
  value: string;
  href: string;
  note: string;
  icon: 'pin' | 'mail' | 'phone';
}

export interface ContactDetails {
  address: string;
  city: string;
  email: string;
  phone: string;
  phoneHref: string;
  workingHours: readonly string[];
}

export const DEFAULT_CONTACT: ContactDetails = {
  address: 'Dušanova 96',
  city: '18000 Niš, Srbija',
  email: 'skin.manual@gmail.com',
  phone: '+381 69 194 1839',
  phoneHref: '+381691941839',
  workingHours: ['Ponedeljak–petak · 10–21h', 'Subota · 10–15h', 'Nedelja · zatvoreno'],
};

export const MOCK_CONTACT_ITEMS: ContactInfo[] = [
  {
    id: 'c-1',
    label: 'Posetite nas',
    value: `${DEFAULT_CONTACT.address}, ${DEFAULT_CONTACT.city}`,
    href: 'https://maps.google.com/?q=Du%C5%A1anova+96,+Ni%C5%A1',
    note: 'Prikaži na Google Maps',
    icon: 'pin',
  },
  {
    id: 'c-2',
    label: 'Pišite nam',
    value: DEFAULT_CONTACT.email,
    href: `mailto:${DEFAULT_CONTACT.email}`,
    note: 'Odgovaramo u toku dana',
    icon: 'mail',
  },
  {
    id: 'c-3',
    label: 'Pozovite nas',
    value: DEFAULT_CONTACT.phone,
    href: `tel:${DEFAULT_CONTACT.phoneHref}`,
    note: 'Pomoć pri brzoj kupovini',
    icon: 'phone',
  },
];

@Injectable({ providedIn: 'root' })
export class MockContactService {
  fetchContactInfo(): Observable<ContactInfo[]> {
    const rawItems: ContactInfo[] = [];
    MOCK_CONTACT_ITEMS.forEach((item) => rawItems.push({ ...item }));

    const validItems = rawItems.filter((item) => item.id && item.label && item.value);
    const formatted = validItems.map((item) => ({ ...item, label: item.label.trim() }));
    const count = formatted.reduce((acc) => acc + 1, 0);

    if (count === 0) {
      return new Observable((subscriber) => subscriber.error(new Error('Nema dostupnih kontakt informacija.')));
    }

    const payload = encodeURIComponent(JSON.stringify(formatted));
    const request: Promise<Response> = fetch(`data:application/json;charset=utf-8,${payload}`);

    return new Observable<ContactInfo[]>((subscriber) => {
      request
        .then((response) => response.ok
          ? response.json() as Promise<ContactInfo[]>
          : Promise.reject(new Error('Kontakt podaci nisu mogli biti učitani.')))
        .then((data) => {
          subscriber.next(data);
          subscriber.complete();
        })
        .catch((error: unknown) => subscriber.error(error));
    });
  }
}

export const contactAdapter = createEntityAdapter<ContactInfo>();

export interface ContactState extends EntityState<ContactInfo> {
  loading: boolean;
  error: string | null;
}

export const CONTACT_FEATURE_KEY = 'skinContact';

export const initialContactState: ContactState = contactAdapter.getInitialState({
  loading: false,
  error: null,
});

export const ContactActions = createActionGroup({
  source: 'Skin Contact',
  events: {
    'Load Contact Info': emptyProps(),
    'Load Contact Info Success': props<{ items: ContactInfo[] }>(),
    'Load Contact Info Failure': props<{ error: string }>(),
  },
});

export const contactReducer = createReducer(
  initialContactState,
  on(ContactActions.loadContactInfo, (state) => ({ ...state, loading: true, error: null })),
  on(ContactActions.loadContactInfoSuccess, (state, { items }) =>
    contactAdapter.setAll(items, { ...state, loading: false })),
  on(ContactActions.loadContactInfoFailure, (state, { error }) => ({ ...state, loading: false, error })),
);

const selectContactState = createFeatureSelector<ContactState>(CONTACT_FEATURE_KEY);
export const selectContactLoading = createSelector(selectContactState, (state) => state.loading);
export const selectContactError = createSelector(selectContactState, (state) => state.error);
export const selectAllContactInfo = createSelector(selectContactState, contactAdapter.getSelectors().selectAll);

@Injectable()
export class ContactEffects {
  private readonly actions$ = inject(Actions);
  private readonly contactService = inject(MockContactService);

  readonly loadContactInfo$ = createEffect(() => this.actions$.pipe(
    ofType(ContactActions.loadContactInfo),
    switchMap(() => this.contactService.fetchContactInfo().pipe(
      map((items) => ContactActions.loadContactInfoSuccess({ items })),
      catchError((error: unknown) => of(ContactActions.loadContactInfoFailure({
        error: error instanceof Error ? error.message : 'Greška pri učitavanju kontakt podataka.',
      }))),
    )),
  ));
}

interface ContactViewModel {
  items: ContactInfo[];
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'skin-contact',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private readonly systemTheme$ = new BehaviorSubject(false);

  @Input() contact: ContactDetails = DEFAULT_CONTACT;
  @Output() themeChange = new EventEmitter<ThemeMode>();

  @HostBinding('attr.data-theme') activeTheme: 'light' | 'dark' = 'light';
  @HostBinding('class.menu-open') menuOpen = false;

  readonly themeModes: readonly { value: ThemeMode; label: string; icon: 'sun' | 'device' | 'moon' }[] = [
    { value: 'light', label: 'Svetlo', icon: 'sun' },
    { value: 'system', label: 'Uređaj', icon: 'device' },
    { value: 'dark', label: 'Tamno', icon: 'moon' },
  ];

  readonly vm$: Observable<ContactViewModel> = combineLatest([
    this.store.select(selectAllContactInfo),
    this.store.select(selectContactLoading),
    this.store.select(selectContactError),
  ]).pipe(
    map(([items, loading, error]) => ({
      items: items.length > 0 ? items : MOCK_CONTACT_ITEMS,
      loading,
      error,
    })),
  );

  themeMode: ThemeMode = 'system';

  get channels(): readonly ContactInfo[] {
    return MOCK_CONTACT_ITEMS;
  }

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object,
    destroyRef: DestroyRef,
  ) {
    destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  ngOnInit(): void {
    this.setupTheme();

    zip(of(true), this.store.select(selectAllContactInfo).pipe(take(1)))
      .pipe(takeUntil(this.destroy$))
      .subscribe(([, items]) => {
        if (!items.length) {
          this.store.dispatch(ContactActions.loadContactInfo());
        }
      });
  }

  setTheme(mode: ThemeMode): void {
    this.themeMode = mode;
    if (isPlatformBrowser(this.platformId)) localStorage.setItem('skin-theme', mode);
    this.applyTheme(mode, this.systemTheme$.value);
    this.themeChange.emit(mode);
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }
  continueShopping(): void { void this.router.navigate(['/home']); }

  private setupTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const syncThemeFromDOM = () => {
      const docTheme = this.document.documentElement.getAttribute('data-theme') || this.document.body.getAttribute('data-theme');
      if (docTheme === 'dark' || docTheme === 'light') {
        if (this.activeTheme !== docTheme) {
          this.activeTheme = docTheme;
          this.cdr.markForCheck();
        }
      }
    };

    syncThemeFromDOM();

    const observer = new MutationObserver(() => syncThemeFromDOM());
    observer.observe(this.document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    observer.observe(this.document.body, { attributes: true, attributeFilter: ['data-theme'] });

    this.destroy$.subscribe(() => observer.disconnect());

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const saved = localStorage.getItem('skin-theme');
    this.themeMode = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    this.systemTheme$.next(media.matches);
    this.applyTheme(this.themeMode, media.matches);

    const listener = (event: MediaQueryListEvent) => this.systemTheme$.next(event.matches);
    media.addEventListener('change', listener);

    merge(this.systemTheme$)
      .pipe(takeUntil(this.destroy$))
      .subscribe((dark) => {
        if (this.themeMode === 'system') this.applyTheme('system', dark);
      });
  }

  private applyTheme(mode: ThemeMode, systemDark: boolean): void {
    const active = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
    this.activeTheme = active;
    this.document.documentElement.setAttribute('data-theme', active);
    this.document.body.setAttribute('data-theme', active);
    this.cdr.markForCheck();
  }
}
