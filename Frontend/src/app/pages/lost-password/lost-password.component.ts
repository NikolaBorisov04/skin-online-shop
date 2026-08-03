import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export type LostPasswordStep = 'request' | 'verify' | 'reset' | 'success';

@Component({
  selector: 'skin-lost-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lost-password.component.html',
  styleUrl: './lost-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LostPasswordComponent implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  step: LostPasswordStep = 'request';
  email = '';
  code = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;

  cooldownTimer = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  isLoading = false;
  errorMessage = '';

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  get isEmailValid(): boolean {
    return this.email.trim().length > 0 && this.email.includes('@');
  }

  get isCodeValid(): boolean {
    return this.code.trim().length >= 4;
  }

  get isResetFormValid(): boolean {
    return (
      this.newPassword.length >= 6 &&
      this.newPassword === this.confirmPassword
    );
  }

  onRequestCode(): void {
    if (!this.isEmailValid) return;

    this.isLoading = true;
    this.errorMessage = '';

    // TODO [Backend Integration - NestJS Auth]:
    // Pozvati backend endpoint POST /api/auth/forgot-password { email: this.email }
    // Backend proverava da li korisnik postoji u bazii šalje verifikacioni mail.
    setTimeout(() => {
      this.isLoading = false;
      this.step = 'verify';
      this.startCooldown(60);
    }, 600);
  }

  onVerifyCode(): void {
    if (!this.isCodeValid) return;

    this.isLoading = true;
    this.errorMessage = '';

    // TODO [Backend Integration - NestJS Auth]:
    // Pozvati backend endpoint POST /api/auth/verify-reset-code { email: this.email, code: this.code }
    setTimeout(() => {
      this.isLoading = false;
      this.step = 'reset';
    }, 600);
  }

  onResendCode(): void {
    if (this.cooldownTimer > 0) return;

    this.isLoading = true;
    this.errorMessage = '';

    // TODO [Backend Integration - NestJS Auth]:
    // Ponovno slanje verifikacionog koda na imejl POST /api/auth/forgot-password
    setTimeout(() => {
      this.isLoading = false;
      this.startCooldown(60);
    }, 600);
  }

  onResetPassword(): void {
    if (!this.isResetFormValid) return;

    this.isLoading = true;
    this.errorMessage = '';

    // TODO [Backend Integration - NestJS Auth]:
    // Pozvati backend endpoint POST /api/auth/reset-password { email, code, newPassword }
    // Backend hešira novu lozinku pomoću bcrypt-a.
    setTimeout(() => {
      this.isLoading = false;
      this.step = 'success';
    }, 600);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goBackToEmail(): void {
    this.clearTimer();
    this.step = 'request';
  }

  private startCooldown(seconds: number): void {
    this.clearTimer();
    this.cooldownTimer = seconds;
    this.timerInterval = setInterval(() => {
      this.cooldownTimer--;
      if (this.cooldownTimer <= 0) {
        this.clearTimer();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
