import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
      ],
    ],
    password: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(128)]],
  });
  protected readonly saving = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly error = signal('');
  private readonly router = inject(Router);

  protected togglePassword() {
    this.passwordVisible.update((visible) => !visible);
  }

  protected submit() {
    if (this.saving()) return;
    this.error.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset();
        this.passwordVisible.set(false);
        void this.router.navigateByUrl('/');
      },
      error: (response) => {
        this.saving.set(false);
        this.error.set(
          response.error?.error?.message ?? 'No se pudo iniciar sesión. Inténtalo de nuevo.',
        );
      },
    });
  }
}
