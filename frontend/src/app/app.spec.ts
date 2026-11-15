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

  it('carga las solicitudes con el token después de un login exitoso', async () => {
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
    const list = http.expectOne('/credit-applications');
    expect(list.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    list.flush([]);
    fixture.detectChanges();
    expect(page.querySelector('tbody td[colspan="5"]')?.textContent).toContain(
      'Todavía no hay solicitudes.',
    );
    const select = page.querySelector('select')!;
    select.value = 'APPROVED';
    select.dispatchEvent(new Event('change'));
    http
      .expectOne('/credit-applications?status=APPROVED')
      .flush([
        { id: '1', idNumber: '8-123-456', amount: '500', paymentTermMonths: 6, status: 'APPROVED' },
      ]);
    fixture.detectChanges();
    expect(page.querySelector('tbody')?.textContent).toContain('Aprobada');
    expect(select.selectedOptions[0].textContent.trim()).toBe('Aprobadas');
    const search = page.querySelector<HTMLInputElement>('input[type="search"]')!;
    for (const [query, expected] of [
      ['999', 'No hay solicitudes que coincidan'],
      ['123', '8-123-456'],
    ]) {
      search.value = query;
      search.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(page.querySelectorAll('thead th')).toHaveLength(5);
      expect(page.querySelector('tbody')?.textContent).toContain(expected);
    }
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
