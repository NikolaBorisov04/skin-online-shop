import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'skin-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  fullName = '';
  email = '';
  phone = '';
  country = 'Srbija';
  city = '';
  address = '';
  postalCode = '';
  password = '';
  confirmPassword = '';
  showPassword = false;

  get passwordsMatch(): boolean {
    return this.password.length > 0 && this.password === this.confirmPassword;
  }

  get isFormValid(): boolean {
    return !!(
      this.fullName.trim() &&
      this.email.trim() &&
      this.phone.trim() &&
      this.country.trim() &&
      this.city.trim() &&
      this.address.trim() &&
      this.postalCode.trim() &&
      this.password.trim() &&
      this.confirmPassword.trim() &&
      this.passwordsMatch
    );
  }

  onPasswordChange(): void {
    if (!this.password) {
      this.confirmPassword = '';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.isFormValid) return;
    // Backend registration integration
  }
}
