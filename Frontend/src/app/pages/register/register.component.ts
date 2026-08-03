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

  onSubmit(): void {
    // Backend registration integration
  }
}
