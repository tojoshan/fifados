'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { FirebaseError } from 'firebase/app';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Verificar si el email ya existe
      const userCredential = await signUp(email, password);
      
      // Verificar si el username ya existe
      const usernameQuery = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      if (usernameQuery.exists()) {
        await userCredential.user.delete();
        setError('Este nombre de usuario ya está en uso');
        return;
      }

      // Crear perfil de usuario
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username,
        email,
        totalMatches: 0,
        wins: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
        createdAt: new Date().toISOString()
      });

      // Reservar el username
      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        uid: userCredential.user.uid
      });

      router.push('/profile');
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setError('Este email ya está registrado');
            break;
          case 'auth/invalid-email':
            setError('Email inválido');
            break;
          case 'auth/weak-password':
            setError('La contraseña debe tener al menos 6 caracteres');
            break;
          default:
            setError('Error al crear la cuenta');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Crear Cuenta</h1>
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
              minLength={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              La contraseña debe tener al menos 6 caracteres
            </p>
          </div>
          <button 
            type="submit" 
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        <p className="mt-4 text-center">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-fifa-blue hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
