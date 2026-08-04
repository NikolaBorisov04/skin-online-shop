import {
  ChangeDetectionStrategy,
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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
export type ContactTopic = 'Proizvod' | 'Porudžbina' | 'Zamena i povrat' | 'Saradnja' | 'Ostalo';

export interface ContactDetails {
  address: string;
  city: string;
  email: string;
  phone: string;
  phoneHref: string;
  workingHours: readonly string[];
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  topic: ContactTopic;
  orderNumber: string;
  message: string;
  consent: boolean;
  createdAt: string;
}

export interface ContactChannel {
  label: string;
  value: string;
  href: string;
  note: string;
  icon: 'pin' | 'mail' | 'phone';
}

export const DEFAULT_CONTACT: ContactDetails = {
  address: 'Dušanova 96',
  city: '18000 Niš, Srbija',
  email: 'prodaja@skin.rs',
  phone: '+381 18 555 096',
  phoneHref: '+38118555096',
  workingHours: ['Ponedeljak–petak · 09–20h', 'Subota · 10–16h', 'Nedelja · zatvoreno'],
};

@Injectable({ providedIn: 'root' })
export class MockContactService {
  sendMessage(message: ContactMessage): Observable<ContactMessage> {
    const requiredValues = [message.fullName, message.email, message.topic, message.message];
    const normalized: string[] = [];
    requiredValues.forEach((value) => normalized.push(String(value).trim()));

    if (normalized.filter(Boolean).length !== requiredValues.length) {
      return new Observable((subscriber) => subscriber.error(new Error('Popunite sva obavezna polja.')));
    }

    const payload = encodeURIComponent(JSON.stringify(message));
    const request: Promise<Response> = fetch(`data:application/json;charset=utf-8,${payload}`);

    return new Observable<ContactMessage>((subscriber) => {
      request
        .then((response) => response.ok
          ? response.json() as Promise<ContactMessage>
          : Promise.reject(new Error('Poruka trenutno ne može biti poslata.')))
        .then((savedMessage) => {
          subscriber.next(savedMessage);
          subscriber.complete();
        })
        .catch((error: unknown) => subscriber.error(error));
    });
  }
}

export const contactAdapter = createEntityAdapter<ContactMessage>();
export interface ContactState extends EntityState<ContactMessage> {
  sending: boolean;
  sent: boolean;
  error: string | null;
}

export const CONTACT_FEATURE_KEY = 'skinContact';
export const initialContactState: ContactState = contactAdapter.getInitialState({
  sending: false,
  sent: false,
  error: null,
});

export const ContactActions = createActionGroup({
  source: 'Skin Contact',
  events: {
    'Submit Message': props<{ message: ContactMessage }>(),
    'Submit Message Success': props<{ message: ContactMessage }>(),
    'Submit Message Failure': props<{ error: string }>(),
    'Reset Form State': emptyProps(),
  },
});

export const contactReducer = createReducer(
  initialContactState,
  on(ContactActions.submitMessage, (state) => ({ ...state, sending: true, sent: false, error: null })),
  on(ContactActions.submitMessageSuccess, (state, { message }) =>
    contactAdapter.addOne(message, { ...state, sending: false, sent: true })),
  on(ContactActions.submitMessageFailure, (state, { error }) => ({ ...state, sending: false, error })),
  on(ContactActions.resetFormState, (state) => ({ ...state, sent: false, error: null })),
);

const selectContactState = createFeatureSelector<ContactState>(CONTACT_FEATURE_KEY);
export const selectContactSending = createSelector(selectContactState, (state) => state.sending);
export const selectContactSent = createSelector(selectContactState, (state) => state.sent);
export const selectContactError = createSelector(selectContactState, (state) => state.error);
export const selectContactMessages = createSelector(selectContactState, contactAdapter.getSelectors().selectAll);

@Injectable()
export class ContactEffects {
  private readonly actions$ = inject(Actions);
  private readonly contactService = inject(MockContactService);

  readonly submitMessage$ = createEffect(() => this.actions$.pipe(
    ofType(ContactActions.submitMessage),
    switchMap(({ message }) => this.contactService.sendMessage(message).pipe(
      map((savedMessage) => ContactActions.submitMessageSuccess({ message: savedMessage })),
      catchError((error: unknown) => of(ContactActions.submitMessageFailure({
        error: error instanceof Error ? error.message : 'Došlo je do greške. Pokušajte ponovo.',
      }))),
    )),
  ));
}

interface ContactViewModel {
  sending: boolean;
  sent: boolean;
  error: string | null;
}

@Component({
  selector: 'skin-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  private readonly systemTheme$ = new BehaviorSubject(false);
  private readonly formInteraction$ = new Subject<'changed' | 'submitted'>();

  @Input() contact: ContactDetails = DEFAULT_CONTACT;
  @Input() initialTopic: ContactTopic = 'Proizvod';
  @Output() messageSent = new EventEmitter<ContactMessage>();
  @Output() themeChange = new EventEmitter<ThemeMode>();

  @HostBinding('attr.data-theme') activeTheme: 'light' | 'dark' = 'light';
  @HostBinding('class.menu-open') menuOpen = false;

  readonly topics: readonly ContactTopic[] = ['Proizvod', 'Porudžbina', 'Zamena i povrat', 'Saradnja', 'Ostalo'];
  readonly themeModes: readonly { value: ThemeMode; label: string; icon: 'sun' | 'device' | 'moon' }[] = [
    { value: 'light', label: 'Svetlo', icon: 'sun' },
    { value: 'system', label: 'Uređaj', icon: 'device' },
    { value: 'dark', label: 'Tamno', icon: 'moon' },
  ];

  readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    topic: ['Proizvod' as ContactTopic, Validators.required],
    orderNumber: [''],
    message: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(1000)]],
    consent: [false, Validators.requiredTrue],
  });

  readonly vm$: Observable<ContactViewModel> = combineLatest([
    this.store.select(selectContactSending),
    this.store.select(selectContactSent),
    this.store.select(selectContactError),
  ]).pipe(map(([sending, sent, error]) => ({ sending, sent, error })));

  themeMode: ThemeMode = 'system';
  submitted = false;
  private lastSubmittedMessage: ContactMessage | null = null;

  get channels(): readonly ContactChannel[] {
    return [
      {
        label: 'Posetite nas',
        value: `${this.contact.address}, ${this.contact.city}`,
        href: 'https://www.openstreetmap.org/search?query=Du%C5%A1anova%2096%2C%20Ni%C5%A1',
        note: 'Prikaži putanju',
        icon: 'pin' as const,
      },
      { label: 'Pišite nam', value: this.contact.email, href: `mailto:${this.contact.email}`, note: 'Odgovaramo u toku dana', icon: 'mail' as const },
      { label: 'Pozovite nas', value: this.contact.phone, href: `tel:${this.contact.phoneHref}`, note: 'Pomoć pri brzoj kupovini', icon: 'phone' as const },
    ].map((channel) => ({ ...channel }));
  }

  get messageLength(): number {
    return this.form.controls.message.value.length;
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
    this.form.controls.topic.setValue(this.initialTopic);
    this.setupTheme();

    merge(this.form.valueChanges.pipe(map(() => 'changed' as const)), this.formInteraction$)
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event === 'changed' && this.submitted) this.store.dispatch(ContactActions.resetFormState());
      });

    this.store.select(selectContactSent)
      .pipe(takeUntil(this.destroy$))
      .subscribe((sent) => {
        if (!sent || !this.lastSubmittedMessage) return;
        this.messageSent.emit(this.lastSubmittedMessage);
        this.lastSubmittedMessage = null;
        this.scrollToForm();
      });
  }

  submit(): void {
    this.submitted = true;
    this.formInteraction$.next('submitted');
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.lastSubmittedMessage = this.createMessage();
    this.store.dispatch(ContactActions.submitMessage({ message: this.lastSubmittedMessage }));
  }

  resetContactForm(): void {
    this.form.reset({ topic: this.initialTopic, consent: false });
    this.submitted = false;
    this.store.dispatch(ContactActions.resetFormState());
  }

  fieldInvalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted);
  }

  setTheme(mode: ThemeMode): void {
    this.themeMode = mode;
    if (isPlatformBrowser(this.platformId)) localStorage.setItem('skin-theme', mode);
    this.applyTheme(mode, this.systemTheme$.value);
    this.themeChange.emit(mode);
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }
  continueShopping(): void { void this.router.navigate(['/proizvodi']); }

  private createMessage(): ContactMessage {
    const raw = this.form.getRawValue();
    const values = [raw.fullName, raw.email, raw.phone, raw.orderNumber, raw.message];
    const cleaned = values.reduce<string[]>((result, value) => [...result, value.trim()], []);

    return {
      id: globalThis.crypto?.randomUUID?.() ?? `contact-${Date.now()}`,
      fullName: cleaned[0],
      email: cleaned[1],
      phone: cleaned[2],
      topic: raw.topic,
      orderNumber: cleaned[3],
      message: cleaned[4],
      consent: raw.consent,
      createdAt: new Date().toISOString(),
    };
  }

  private scrollToForm(): void {
    this.document.getElementById('kontakt-forma')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    this.store.select(selectContactMessages).pipe(take(1), takeUntil(this.destroy$)).subscribe();
  }

  private applyTheme(mode: ThemeMode, systemDark: boolean): void {
    this.activeTheme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
  }
}

/*
Host registracija:
provideStore(), provideState(CONTACT_FEATURE_KEY, contactReducer), provideEffects(ContactEffects)
Ruta: { path: 'kontakt', component: ContactComponent }
Demo kontakt podatke promenite kroz [contact] Input kada povežete pravi backend/CMS.
*/
