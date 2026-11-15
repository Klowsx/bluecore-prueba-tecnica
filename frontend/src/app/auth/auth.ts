import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { inject, Injectable } from '@angular/core';

type Credentials = { email: string; password: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  register(credentials: Credentials) {
    return this.http.post('/auth/register', credentials);
  }

  get accessToken() {
    return sessionStorage.getItem('accessToken');
  }

  login(credentials: Credentials) {
    return this.http
      .post<{ accessToken: string }>('/auth/login', credentials)
      .pipe(tap(({ accessToken }) => sessionStorage.setItem('accessToken', accessToken)));
  }
}
