import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { CreateApplication } from '../credit-applications/create/create-application';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, catchError, map, of, startWith, switchMap } from 'rxjs';
import {
  ApplicationStatus,
  CreditApplicationsService,
} from '../credit-applications/credit-applications';

@Component({
  selector: 'app-home',
  imports: [AsyncPipe, CurrencyPipe, CreateApplication],
  templateUrl: './home.html',
  styleUrls: ['./home.css', './home-filters.css'],
})
export class Home {
  private readonly service = inject(CreditApplicationsService);
  private readonly router = inject(Router);
  protected readonly filter = new BehaviorSubject<ApplicationStatus | undefined>(undefined);
  protected readonly search = new BehaviorSubject('');
  protected readonly confirmation = signal('');
  protected readonly filters = [
    { label: 'Todas', value: undefined },
    { label: 'Pendientes', value: 'PENDING' },
    { label: 'Aprobadas', value: 'APPROVED' },
    { label: 'Rechazadas', value: 'REJECTED' },
  ] as const;
  protected readonly labels = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
  };
  private readonly list = this.filter.pipe(
    switchMap((status) =>
      this.service.list(status).pipe(
        map((applications) => ({ state: 'ready' as const, applications })),
        startWith({ state: 'loading' as const }),
        catchError((error) => {
          if (error.status === 401) {
            sessionStorage.removeItem('accessToken');
            void this.router.navigateByUrl('/login');
          }
          return of({
            state: 'error' as const,
            message: error.error?.error?.message || 'No se pudieron cargar las solicitudes.',
          });
        }),
      ),
    ),
  );
  protected readonly view = combineLatest([this.list, this.search]).pipe(
    map(([result, search]) => {
      const query = search.trim().toLowerCase();
      if (result.state !== 'ready' || !query) return result;
      return {
        ...result,
        applications: result.applications.filter((item) =>
          item.idNumber.toLowerCase().includes(query),
        ),
      };
    }),
  );

  protected selectStatus(value: string) {
    this.filter.next(this.filters.find((option) => option.value === value)?.value);
  }

  protected applicationCreated(idNumber: string) {
    this.search.next('');
    this.filter.next(undefined);
    this.confirmation.set(`Solicitud creada para la cédula ${idNumber}.`);
  }
}
