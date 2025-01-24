'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Spinner from './Spinner';

export default function CompleteProfile() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().status === 'pending') {
          setUsername(userDoc.data().username || '');
          setLoading(false);
        } else {
          router.push('/stats');
        }
      }
    };

    checkProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await updateDoc(doc(db, 'users', user!.uid), {
        username,
        status: 'active',
        updatedAt: new Date().toISOString()
      });

      router.push('/stats');
    } catch (error) {
      setError('Error al actualizar el perfil');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Completa tu Perfil</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre de Usuario
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

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full">
            Guardar y Continuar
          </button>
        </form>
      </div>
    </div>
  );
}
