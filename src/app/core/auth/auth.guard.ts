import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // Yereldeki bayat oturuma değil, sunucuda doğrulanmış kullanıcıya bak:
  // token süresi dolmuş/iptal edilmişse login'e yönlendir (RLS hatasını önler).
  const user = await authService.getValidUser();
  if (user) return true;
  return router.createUrlTree(['/login']);
};
