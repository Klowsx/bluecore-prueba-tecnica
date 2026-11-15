import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  register(credentials: { email: string; password: string }) {
    return this.http.post('/auth/register', credentials);
  }
}
