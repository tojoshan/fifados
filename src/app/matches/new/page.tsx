'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { FiPlus, FiSearch } from 'react-icons/fi';
import InviteRivalModal from '@/components/InviteRivalModal';
import Spinner from '@/components/Spinner';

interface Rival {
  id: string;
  username: string;
  email: string;
}

export default function NewMatchPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rivals, setRivals] = useState<Rival[]>([]);
  const [selectedRival, setSelectedRival] = useState('');
  const [myTeam, setMyTeam] = useState('');
  const [rivalTeam, setRivalTeam] = useState('');
  const [myGoals, setMyGoals] = useState('');
  const [rivalGoals, setRivalGoals] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredRivals, setFilteredRivals] = useState<Rival[]>([]);
  const [frequentRivals, setFrequentRivals] = useState<Rival[]>([]);

  useEffect(() => {
    if (rivals.length > 0) {
      const filtered = rivals.filter(rival => 
        rival.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRivals(filtered);
    }
  }, [searchTerm, rivals]);

  useEffect(() => {
    if (user) {
      loadRivals();
      loadFrequentRivals();
    }
  }, [user]);

  const loadRivals = async () => {
    const rivalsQuery = query(
      collection(db, 'rivals'),
      where('participants', 'array-contains', user?.uid),
      where('status', '==', 'accepted')
    );

    const snapshot = await getDocs(rivalsQuery);
    const rivalsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Rival[];

    setRivals(rivalsData);
    setLoading(false);
  };

  const loadFrequentRivals = async () => {
    try {
      // Obtener los últimos 20 partidos
      const matchesQuery = query(
        collection(db, 'matches'),
        where('participants', 'array-contains', user?.uid),
        orderBy('date', 'desc'),
        limit(20)
      );
      
      const matchesSnapshot = await getDocs(matchesQuery);
      const matches = matchesSnapshot.docs.map(doc => doc.data());
  
      // Contar frecuencia de rivales
      const rivalFrequency: Record<string, number> = {};
      matches.forEach(match => {
        const rivalId = match.participants.find((id: string) => id !== user?.uid);
        rivalFrequency[rivalId] = (rivalFrequency[rivalId] || 0) + 1;
      });
  
      // Obtener información de los rivales más frecuentes
      const topRivalIds = Object.entries(rivalFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([id]) => id);
  
      const rivalsData = await Promise.all(
        topRivalIds.map(async (rivalId) => {
          const rivalDoc = await getDoc(doc(db, 'users', rivalId));
          return {
            id: rivalId,
            ...rivalDoc.data()
          } as Rival;
        })
      );
  
      setFrequentRivals(rivalsData);
    } catch (error) {
      console.error('Error loading frequent rivals:', error);
    }
  };

  const handleAddRival = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleRivalAdded = () => {
    loadRivals();
    loadFrequentRivals();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRival || !myTeam || !rivalTeam || !myGoals || !rivalGoals) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      const match = {
        date: new Date().toISOString(),
        participants: [user?.uid, selectedRival].sort(),
        player1: {
          userId: user?.uid,
          team: myTeam,
          goals: parseInt(myGoals)
        },
        player2: {
          userId: selectedRival,
          team: rivalTeam,
          goals: parseInt(rivalGoals)
        },
        winner: parseInt(myGoals) > parseInt(rivalGoals) ? user?.uid : selectedRival
      };

      await addDoc(collection(db, 'matches'), match);
      router.push('/stats');
    } catch (error) {
      setError('Error al registrar el partido');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Registrar Nuevo Partido</h1>
        
        <div className="mb-8">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
              placeholder="Buscar rival..."
            />
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {searchTerm === '' ? (
              frequentRivals.map(rival => (
                <button
                  key={rival.id}
                  onClick={() => setSelectedRival(rival.id)}
                  className={`p-4 rounded-lg border-2 text-center ${
                    selectedRival === rival.id 
                      ? 'border-fifa-blue bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-fifa-blue text-white flex items-center justify-center mx-auto mb-2">
                    {rival.username.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-medium truncate">{rival.username}</p>
                </button>
              ))
            ) : (
              filteredRivals.map(rival => (
                <button
                  key={rival.id}
                  onClick={() => setSelectedRival(rival.id)}
                  className={`p-4 rounded-lg border-2 text-center ${
                    selectedRival === rival.id 
                      ? 'border-fifa-blue bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-fifa-blue text-white flex items-center justify-center mx-auto mb-2">
                    {rival.username.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-medium truncate">{rival.username}</p>
                </button>
              ))
            )}
            
            <button
              onClick={handleAddRival}
              className="p-4 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-fifa-blue transition-colors"
            >
              <FiPlus className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-500 mt-2">Agregar Rival</span>
            </button>

            <InviteRivalModal
              isOpen={isModalOpen}
              onClose={handleModalClose}
              onSuccess={handleRivalAdded}
            />

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mi Equipo
              </label>
              <input
                type="text"
                value={myTeam}
                onChange={(e) => setMyTeam(e.target.value)}
                className="input-field"
                placeholder="Ej: Real Madrid"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Equipo Rival
              </label>
              <input
                type="text"
                value={rivalTeam}
                onChange={(e) => setRivalTeam(e.target.value)}
                className="input-field"
                placeholder="Ej: Barcelona"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mis Goles
              </label>
              <input
                type="number"
                min="0"
                value={myGoals}
                onChange={(e) => setMyGoals(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Goles Rival
              </label>
              <input
                type="number"
                min="0"
                value={rivalGoals}
                onChange={(e) => setRivalGoals(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full">
            Registrar Partido
          </button>
        </div>
      </div>
    </div>
  );
}


