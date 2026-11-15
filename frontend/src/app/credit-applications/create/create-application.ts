import { Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CreditApplicationsService } from '../credit-applications';

@Component({
  selector: 'app-create-application',
  imports: [ReactiveFormsModule],
  templateUrl: './create-application.html',
  styleUrl: './create-application.css',
})
export class CreateApplication {
  readonly created = output<string>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly service = inject(CreditApplicationsService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.group({
    idNumber: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/)]),
    amount: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(500),
      Validators.max(50000),
      Validators.pattern(/^\d+(\.\d{1,2})?$/),
    ]),
    paymentTermMonths: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(6),
      Validators.max(60),
      Validators.pattern(/^\d+$/),
    ]),
  });
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  open() {
    this.form.reset();
    this.error.set('');
    this.dialog().nativeElement.showModal();
  }

  protected submit() {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    const { idNumber, amount, paymentTermMonths } = this.form.getRawValue();
    if (this.form.invalid || amount === null || paymentTermMonths === null) return;
    this.saving.set(true);
    this.error.set('');
    this.service.create({ idNumber: idNumber.trim(), amount, paymentTermMonths }).subscribe({
      next: (application) => {
        this.saving.set(false);
        this.dialog().nativeElement.close();
        this.created.emit(application.idNumber);
      },
      error: (response) => {
        this.saving.set(false);
        if (response.status === 401) {
          sessionStorage.removeItem('accessToken');
          void this.router.navigateByUrl('/login');
          return;
        }
        this.error.set(
          response.error?.error?.message ?? 'No se pudo crear la solicitud. Inténtalo de nuevo.',
        );
      },
    });
  }
}
