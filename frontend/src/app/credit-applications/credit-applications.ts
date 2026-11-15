import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth';

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type CreditApplication = {
  id: string;
  idNumber: string;
  amount: string;
  paymentTermMonths: number;
  status: ApplicationStatus;
};

@Injectable({ providedIn: 'root' })
export class CreditApplicationsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private get headers() {
    return { Authorization: `Bearer ${this.auth.accessToken}` };
  }

  create(data: { idNumber: string; amount: number; paymentTermMonths: number }) {
    return this.http.post<CreditApplication>('/credit-applications', data, {
      headers: this.headers,
    });
  }

  list(status?: ApplicationStatus) {
    return this.http.get<CreditApplication[]>('/credit-applications', {
      headers: this.headers,
      params: status ? { status } : {},
    });
  }
}
