import { CurrencyPipe } from '@angular/common';
import { Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  CreditApplicationsService,
  type CreditApplication,
  type DecisionStatus,
} from '../credit-applications';

@Component({
  selector: 'app-application-decision',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './application-decision.html',
  styleUrls: ['../create/create-application.css', './application-decision.css'],
})
export class ApplicationDecision {
  readonly updated = output<CreditApplication>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly service = inject(CreditApplicationsService);
  private readonly router = inject(Router);
  protected readonly application = signal<CreditApplication | null>(null);
  protected readonly status = new FormControl<DecisionStatus | null>(null);
  protected readonly comment = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/)],
  });
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  open(application: CreditApplication) {
    this.application.set(application);
    this.status.reset();
    this.comment.reset();
    this.error.set('');
    this.dialog().nativeElement.showModal();
  }

  protected submit() {
    const application = this.application();
    const status = this.status.value;
    this.comment.markAsTouched();
    if (!application || !status || this.saving() || this.comment.invalid) return;
    this.saving.set(true);
    this.error.set('');
    this.service.updateStatus(application.id, status, this.comment.value.trim()).subscribe({
      next: (application) => {
        this.saving.set(false);
        this.dialog().nativeElement.close();
        this.updated.emit(application);
      },
      error: (response) => {
        this.saving.set(false);
        if (response.status === 401) {
          sessionStorage.removeItem('accessToken');
          void this.router.navigateByUrl('/login');
          return;
        }
        this.error.set(
          response.error?.error?.message ??
            'No se pudo actualizar la solicitud. Inténtalo de nuevo.',
        );
      },
    });
  }
}
