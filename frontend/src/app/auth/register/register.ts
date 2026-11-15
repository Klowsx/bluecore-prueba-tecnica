import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
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
  protected readonly success = signal('');

  protected togglePassword() {
    this.passwordVisible.update((visible) => !visible);
  }

  protected submit() {
    if (this.saving()) return;
    this.error.set('');
    this.success.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset();
        this.passwordVisible.set(false);
        this.success.set('Tu cuenta se creó correctamente.');
      },
      error: (response) => {
        this.saving.set(false);
        this.error.set(
          response.error?.error?.message ?? 'No se pudo crear la cuenta. Inténtalo de nuevo.',
        );
      },
    });
  }
}
