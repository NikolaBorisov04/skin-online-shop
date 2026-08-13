import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  DestroyRef,
  inject,
  NgZone,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { fromEvent, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'skin-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './404.component.html',
  styleUrl: './404.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  @ViewChild('stageElement') stageElement?: ElementRef<HTMLDivElement>;
  @ViewChild('particlesCanvas') particlesCanvas?: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const destroy$ = new Subject<void>();
    this.destroyRef.onDestroy(() => {
      destroy$.next();
      destroy$.complete();
    });

    this.ngZone.runOutsideAngular(() => {
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      let targetAngle = 0;
      let currentAngle = 0;

      const mouseMove$ = fromEvent<MouseEvent>(window, 'mousemove').pipe(
        map((e) => {
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;

          const x = (e.clientX - cx) / cx;
          const y = (e.clientY - cy) / cy;

          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

          return { x, y, angleDeg };
        }),
        takeUntil(destroy$)
      );

      mouseMove$.subscribe((pos) => {
        targetX = pos.x;
        targetY = pos.y;
        targetAngle = pos.angleDeg;
      });

      let animId: number;
      const animate = () => {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        let diff = (targetAngle - currentAngle) % 360;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;
        currentAngle += diff * 0.1;

        if (this.stageElement?.nativeElement) {
          const el = this.stageElement.nativeElement;
          const rotX = -currentY * 20;
          const rotY = currentX * 20;
          const shiftX = currentX * 24;
          const shiftY = currentY * 24;
          const glareX = -currentX * 30;
          const glareY = -currentY * 30;

          el.style.setProperty('--rot-x', `${rotX.toFixed(2)}deg`);
          el.style.setProperty('--rot-y', `${rotY.toFixed(2)}deg`);
          el.style.setProperty('--shift-x', `${shiftX.toFixed(2)}px`);
          el.style.setProperty('--shift-y', `${shiftY.toFixed(2)}px`);
          el.style.setProperty('--glare-x', `${glareX.toFixed(2)}px`);
          el.style.setProperty('--glare-y', `${glareY.toFixed(2)}px`);
          el.style.setProperty('--needle-rot', `${currentAngle.toFixed(2)}deg`);
        }

        animId = requestAnimationFrame(animate);
      };

      // Pozadina particle animacija
      let particlesAnimId: number;
      const canvasEl = this.particlesCanvas?.nativeElement;

      if (canvasEl) {
        const ctx = canvasEl.getContext('2d');

        const resizeCanvas = () => {
          canvasEl.width = canvasEl.offsetWidth || window.innerWidth;
          canvasEl.height = canvasEl.offsetHeight || window.innerHeight;
        };
        resizeCanvas();

        const resizeSub = fromEvent(window, 'resize')
          .pipe(takeUntil(destroy$))
          .subscribe(() => resizeCanvas());

        const particleColors = ['#e65c00', '#ff7700', '#ff9900', '#ff3300', '#d45500', '#ffaa33'];
        const particlesCount = 55;

        interface EmberParticle {
          x: number;
          y: number;
          radius: number;
          color: string;
          speedY: number;
          speedX: number;
          oscillationSpeed: number;
          oscillationAmplitude: number;
          angle: number;
          opacity: number;
          maxOpacity: number;
          pulseSpeed: number;
        }

        const particles: EmberParticle[] = Array.from({ length: particlesCount }, () => ({
          x: Math.random() * (canvasEl.width || window.innerWidth),
          y: Math.random() * (canvasEl.height || window.innerHeight),
          radius: Math.random() * 2.8 + 1.2,
          color: particleColors[Math.floor(Math.random() * particleColors.length)],
          speedY: -(Math.random() * 0.45 + 0.2),
          speedX: (Math.random() - 0.5) * 0.25,
          oscillationSpeed: Math.random() * 0.025 + 0.01,
          oscillationAmplitude: Math.random() * 1.5 + 0.4,
          angle: Math.random() * Math.PI * 2,
          opacity: Math.random() * 0.7 + 0.3,
          maxOpacity: Math.random() * 0.85 + 0.35,
          pulseSpeed: Math.random() * 0.02 + 0.008,
        }));

        const renderParticles = () => {
          if (!ctx) return;
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

          for (const p of particles) {
            p.y += p.speedY;
            p.angle += p.oscillationSpeed;
            p.x += Math.sin(p.angle) * p.oscillationAmplitude + p.speedX;

            p.opacity += Math.sin(p.angle * 2) * p.pulseSpeed;
            const currentOpacity = Math.max(0.1, Math.min(p.maxOpacity, p.opacity));

            if (p.y < -10) {
              p.y = canvasEl.height + 10;
              p.x = Math.random() * canvasEl.width;
            }
            if (p.x < -10) p.x = canvasEl.width + 10;
            if (p.x > canvasEl.width + 10) p.x = -10;

            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = currentOpacity;
            ctx.shadowBlur = p.radius * 4;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.restore();
          }

          particlesAnimId = requestAnimationFrame(renderParticles);
        };

        particlesAnimId = requestAnimationFrame(renderParticles);

        this.destroyRef.onDestroy(() => {
          cancelAnimationFrame(particlesAnimId);
          resizeSub.unsubscribe();
        });
      }

      animId = requestAnimationFrame(animate);

      this.destroyRef.onDestroy(() => {
        cancelAnimationFrame(animId);
      });
    });
  }
}
