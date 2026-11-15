import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';

describe('App', () => {
  afterEach(() => sessionStorage.removeItem('accessToken'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('muestra la confirmación después de un login exitoso', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await router.navigateByUrl('/login');
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    for (const [id, value] of [
      ['email', 'test@example.com'],
      ['password', 'prueba123'],
    ]) {
      const input = page.querySelector<HTMLInputElement>('#' + id)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    const submit = () => page.querySelector('form')!.dispatchEvent(new Event('submit'));
    submit();
    http
      .expectOne('/auth/login')
      .flush(
        { error: { message: 'Credenciales incorrectas.' } },
        { status: 401, statusText: 'Unauthorized' },
      );
    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'Credenciales incorrectas.',
    );
    submit();
    http.expectOne('/auth/login').flush({ accessToken: 'token-de-prueba' });
    await fixture.whenStable();
    expect(router.url).toBe('/');
    expect(page.querySelector('main')?.textContent).toContain('Sesión iniciada.');
    expect(sessionStorage.getItem('accessToken')).toBe('token-de-prueba');
    http.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('muestra el login al abrir la aplicación sin sesión', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toBe('Iniciar sesión');
  });
});
