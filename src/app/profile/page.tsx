'use client';
import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ProfilePage() {
  const { user } = useAuthContext();
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      if (user) {
        await updatePassword(user, newPassword);
        setSuccess('Contraseña actualizada correctamente');
        setIsEditingPassword(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setError('Error al actualizar la contraseña');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card">
        <div className="flex items-center space-x-4 mb-8">
          <div className="h-20 w-20 rounded-full bg-fifa-blue flex items-center justify-center">
            <span className="text-2xl text-white">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mi Perfil</h1>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Sección de Información */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Información de la cuenta</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-md">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Cuenta creada</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-md">
                  {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Sección de Cambio de Contraseña */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Seguridad</h2>
            {!isEditingPassword ? (
              <button
                onClick={() => setIsEditingPassword(true)}
                className="btn-primary"
              >
                Cambiar Contraseña
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
                {success && (
                  <p className="text-green-500 text-sm">{success}</p>
                )}
                <div className="flex space-x-4">
                  <button type="submit" className="btn-primary">
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPassword(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setError('');
                    }}
                    className="btn-primary bg-gray-500"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
