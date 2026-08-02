import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Inject, Input, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';

export type ThemeMode = 'light' | 'system' | 'dark';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  @Input() cartCount = 0;
  @Output() cartOpen = new EventEmitter<void>();
  @Output() themeChange = new EventEmitter<ThemeMode>();

  menuOpen = false;
  themeMode: ThemeMode = 'system';
  private readonly systemTheme$ = new BehaviorSubject<boolean>(false);
  private readonly destroy$ = new Subject<void>();

  readonly themeModes: readonly { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Svetlo', icon: 'sun' },
    { value: 'system', label: 'Uređaj', icon: 'device' },
    { value: 'dark', label: 'Tamno', icon: 'moon' },
  ];

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
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  openCart(): void {
    this.cartOpen.emit();
  }

  setTheme(mode: ThemeMode): void {
    this.themeMode = mode;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('skin-theme', mode);
    }
    this.applyTheme(mode, this.systemTheme$.value);
    this.themeChange.emit(mode);
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
    const activeTheme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
    this.document.documentElement.setAttribute('data-theme', activeTheme);
    this.document.body.setAttribute('data-theme', activeTheme);
  }
}
