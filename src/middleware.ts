import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Obtener el token de la cookie
  const token = request.cookies.get('token')?.value;
  const userStatus = request.cookies.get('userStatus')?.value;
  const pathname = request.nextUrl.pathname;

  if (token && userStatus === 'pending' && pathname !== '/complete-profile') {
    return NextResponse.redirect(new URL('/complete-profile', request.url));
  }

  // Rutas que requieren autenticación
  const protectedPaths = ['/profile', '/rivals', '/stats'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // Si es una ruta protegida y no hay token, redirigir a login
  if (isProtectedPath && !token) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    return response;
  }

  // Si hay token y está intentando acceder a login/register, redirigir
  if (token && (pathname === '/login' || pathname === '/register')) {
    const response = NextResponse.redirect(new URL('/stats', request.url));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*|favicon.ico).*)']
};