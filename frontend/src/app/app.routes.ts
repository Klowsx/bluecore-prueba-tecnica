import { Routes } from '@angular/router';
import { Register } from './auth/register/register';

export const routes: Routes = [
  { path: '', redirectTo: 'registro', pathMatch: 'full' },
  { path: 'registro', component: Register },
];
