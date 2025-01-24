'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import Spinner from './Spinner';

export default function Navigation() {
  const pathname = usePathname();
  const { user, loading } = useAuthContext();

  if (loading) {
    return <Spinner />;
  }

  const navLinks = [
    { href: '/stats', label: 'Estadísticas' },
    { href: '/matches/new', label: 'Nuevo Partido' },
    { href: '/rivals', label: 'Rivales' }
  ];
  

  function logout(): void {
    throw new Error('Function not implemented.');
  }

  return (
    <nav className="bg-fifa-blue text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold">
              Fifados
            </Link>
            
            {user && (
              <div className="hidden md:flex ml-10 space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      pathname === link.href
                        ? 'bg-fifa-green text-gray-900'
                        : 'hover:bg-blue-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    pathname === '/profile'
                      ? 'bg-fifa-green text-gray-900'
                      : 'hover:bg-blue-700'
                  }`}
                >
                  Perfil
                </Link>
                <button
                  onClick={() => logout()}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-fifa-green text-gray-900 hover:bg-green-400 transition-colors duration-200"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
