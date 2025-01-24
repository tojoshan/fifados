'use client';
import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, setDoc, doc } from 'firebase/firestore';
import { FiX, FiMail } from 'react-icons/fi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteRivalModal({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuthContext();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      // Buscar usuario por email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase().trim())
      );
      
      const userSnapshot = await getDocs(usersQuery);
      let rivalId: string;
      let rivalData: any;

      if (userSnapshot.empty) {
        // Crear usuario provisional
        rivalId = `pending_${Date.now()}`;
        rivalData = {
          email: email.toLowerCase().trim(),
          username: email.split('@')[0],
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        // Guardar usuario provisional
        await setDoc(doc(db, 'users', rivalId), rivalData);

        // Crear invitación pendiente
        await addDoc(collection(db, 'invitations'), {
          email: email.toLowerCase().trim(),
          invitedBy: user?.uid,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      } else {
        rivalId = userSnapshot.docs[0].id;
        rivalData = userSnapshot.docs[0].data();
      }

      // Crear conexión de rivales
      await addDoc(collection(db, 'rivals'), {
        participants: [user?.uid, rivalId].sort(),
        status: rivalData.status === 'pending' ? 'pending' : 'accepted',
        createdAt: new Date().toISOString(),
        username: rivalData.username,
        email: rivalData.email
      });

      setSuccess(true);
      setEmail('');
      onSuccess();
      
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);

    } catch (error) {
      setError('Error al procesar la invitación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FiX className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">Agregar Rival</h2>
        
        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMail className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-green-600 font-medium">¡Rival agregado con éxito!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email del rival
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="ejemplo@email.com"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex justify-end space-x-4 mt-6">
              <button 
                type="button" 
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Agregando...' : 'Agregar Rival'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
