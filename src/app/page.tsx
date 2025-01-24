'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashstats');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-6">
          Bienvenido a Fifados
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Registra tus partidos de FIFA y compite con tus amigos
        </p>
        <div className="space-x-4">
          <a href="/login" className="btn-primary inline-block">
            Iniciar Sesión
          </a>
          <a href="/register" className="btn-primary bg-fifa-green inline-block">
            Registrarse
          </a>
        </div>
      </div>
    </div>
  );
}
