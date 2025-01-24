'use client';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
} from 'firebase/firestore';
import Spinner from '@/components/Spinner';

interface Rival {
  id: string;
  username: string;
  email: string;
  status: 'pending' | 'accepted';
}

export default function RivalsPage() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [rivals, setRivals] = useState<Rival[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadRivals();
    }
  }, [user]);

  const loadRivals = async () => {
    const rivalsQuery = query(
      collection(db, 'rivals'),
      where('participants', 'array-contains', user?.uid)
    );

    const snapshot = await getDocs(rivalsQuery);
    const rivalsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Rival[];

    setRivals(rivalsData);
    setLoading(false);
  };

  const inviteRival = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Buscar usuario por email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const userSnapshot = await getDocs(usersQuery);
      
      if (userSnapshot.empty) {
        setError('Usuario no encontrado');
        return;
      }

      const rivalUser = userSnapshot.docs[0];
      
      // Verificar que no sea el mismo usuario
      if (rivalUser.id === user?.uid) {
        setError('No puedes invitarte a ti mismo');
        return;
      }

      // Verificar si ya son rivales
      const existingRivalQuery = query(
        collection(db, 'rivals'),
        where('participants', '==', [user?.uid, rivalUser.id].sort())
      );

      const existingRival = await getDocs(existingRivalQuery);
      
      if (!existingRival.empty) {
        setError('Ya tienes una conexión con este usuario');
        return;
      }

      // Crear nueva conexión de rivales
      await addDoc(collection(db, 'rivals'), {
        participants: [user?.uid, rivalUser.id].sort(),
        status: 'pending',
        requestedBy: user?.uid,
        requestedAt: new Date().toISOString(),
        username: rivalUser.data().username,
        email: rivalUser.data().email
      });

      setEmail('');
      loadRivals();
    } catch (error) {
      setError('Error al enviar la invitación');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4">Invitar Rival</h2>
        <form onSubmit={inviteRival} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email del rival
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="ejemplo@email.com"
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button type="submit" className="btn-primary">
            Enviar Invitación
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Mis Rivales</h2>
        {rivals.length === 0 ? (
          <p className="text-gray-500">Aún no tienes rivales agregados</p>
        ) : (
          <div className="space-y-4">
            {rivals.map((rival) => (
              <div 
                key={rival.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-semibold">{rival.username}</p>
                  <p className="text-sm text-gray-500">{rival.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  rival.status === 'accepted' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {rival.status === 'accepted' ? 'Conectado' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
