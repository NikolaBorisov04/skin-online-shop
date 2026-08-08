import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'skin-terms-and-conditions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './terms-and-conditions.html',
  styleUrl: './terms-and-conditions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsAndConditionsComponent {}
