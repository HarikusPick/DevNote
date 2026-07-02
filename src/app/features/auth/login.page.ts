import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

type Mode = 'login' | 'signup';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<Mode>('login');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  readonly isSignup = computed(() => this.mode() === 'signup');

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  toggleMode() {
    this.mode.update(m => (m === 'login' ? 'signup' : 'login'));
    this.error.set(null);
    this.info.set(null);
  }

  async submit() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.info.set(null);
    const email = this.form.value.email!;
    const password = this.form.value.password!;
    try {
      if (this.isSignup()) {
        const data = await this.authService.signUp(email, password);
        if (data.session) {
          await this.router.navigate(['/projects']);
        } else {
          // E-posta doğrulama açık → onay maili gönderildi.
          this.info.set('Kayıt alındı. E-postana gönderilen bağlantıyla hesabını doğrula, sonra giriş yap.');
          this.mode.set('login');
        }
      } else {
        await this.authService.signIn(email, password);
        await this.router.navigate(['/projects']);
      }
    } catch (err: any) {
      this.error.set(err?.message ?? 'İşlem başarısız. Lütfen tekrar deneyin.');
    } finally {
      this.loading.set(false);
    }
  }
}
