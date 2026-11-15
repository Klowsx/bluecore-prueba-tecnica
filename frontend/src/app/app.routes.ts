import { inject } from '@angular/core';
import { AuthService } from './auth/auth';
import { Login } from './auth/login/login';
import { Home } from './home/home';
import { Router, Routes } from '@angular/router';
import { Register } from './auth/register/register';

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    pathMatch: 'full',
    component: Home,
    canActivate: [
      () => !!inject(AuthService).accessToken || inject(Router).createUrlTree(['/login']),
    ],
  },

  { path: 'registro', component: Register },
];
