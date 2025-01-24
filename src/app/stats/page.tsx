'use client';
import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Link from 'next/link';
import Spinner from '@/components/Spinner';

interface Match {
  id: string;
  date: string;
  player1: {
    userId: string;
    username: string;
    team: string;
    goals: number;
  };
  player2: {
    userId: string;
    username: string;
    team: string;
    goals: number;
  };
  winner: string;
}

interface Stats {
  totalMatches: number;
  wins: number;
  losses: number;
  mostUsedTeam: { team: string; count: number };
  mostFrequentOpponent: { username: string; count: number };
  mostWinsAgainst: { username: string; count: number };
  mostLossesAgainst: { username: string; count: number };
  biggestGoalDifference: { opponent: string; difference: number; match: Match };
  mostGoalsInMatch: { goals: number; match: Match };
  goalsProgression: { date: string; goals: number }[];
}

export default function StatsPage() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const matchesQuery = query(
          collection(db, 'matches'),
          where('participants', 'array-contains', user.uid),
          orderBy('date', 'asc')
        );

        const matchesSnapshot = await getDocs(matchesQuery);
        const matches = matchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Match[];

        if (matches.length === 0) {
          setStats(null);
          setLoading(false);
          return;
        }

        // Procesar estadísticas
        const processedStats = processMatches(matches, user.uid);
        setStats(processedStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) return <Spinner />;

  if (!stats) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-xl font-semibold text-gray-600">
          Aún no hay partidos registrados
        </h2>
        <p className="mt-2 text-gray-500">
          Registra tu primer partido para comenzar a ver estadísticas
        </p>
        <Link href="/matches/new" className="btn-primary mt-4 inline-block">
          Registrar Partido
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600">Total Partidos</h3>
          <p className="text-3xl font-bold">{stats.totalMatches}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600">Victorias</h3>
          <p className="text-3xl font-bold text-green-500">{stats.wins}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600">Derrotas</h3>
          <p className="text-3xl font-bold text-red-500">{stats.losses}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600">Efectividad</h3>
          <p className="text-3xl font-bold text-fifa-blue">
            {((stats.wins / stats.totalMatches) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Estadísticas Detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Equipo más utilizado</h3>
          <p className="text-xl">{stats.mostUsedTeam.team}</p>
          <p className="text-sm text-gray-500">{stats.mostUsedTeam.count} partidos</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Rival más frecuente</h3>
          <p className="text-xl">{stats.mostFrequentOpponent.username}</p>
          <p className="text-sm text-gray-500">{stats.mostFrequentOpponent.count} partidos</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Mayor victoria</h3>
          <p className="text-xl">Diferencia de {stats.biggestGoalDifference.difference} goles</p>
          <p className="text-sm text-gray-500">vs {stats.biggestGoalDifference.opponent}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Máximo de goles</h3>
          <p className="text-xl">{stats.mostGoalsInMatch.goals} goles</p>
          <p className="text-sm text-gray-500">
            {new Date(stats.mostGoalsInMatch.match.date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Gráfico de Progresión de Goles */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Progresión de Goles</h3>
        <LineChart
          width={800}
          height={300}
          data={stats.goalsProgression}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="goals" stroke="#1E3D8F" />
        </LineChart>
      </div>
    </div>
  );
}

function processMatches(matches: Match[], userId: string): Stats {
  const stats = {
    totalMatches: matches.length,
    wins: 0,
    losses: 0,
    teams: {} as Record<string, number>,
    opponents: {} as Record<string, number>,
    winsAgainst: {} as Record<string, number>,
    lossesAgainst: {} as Record<string, number>,
    biggestGoalDifference: { opponent: '', difference: 0, match: matches[0] },
    mostGoalsInMatch: { goals: 0, match: matches[0] },
    goalsProgression: [] as { date: string; goals: number }[]
  };

  matches.forEach(match => {
    const isPlayer1 = match.player1.userId === userId;
    const playerData = isPlayer1 ? match.player1 : match.player2;
    const opponentData = isPlayer1 ? match.player2 : match.player1;
    const won = match.winner === userId;

    // Contabilizar victorias/derrotas
    if (won) stats.wins++;
    else stats.losses++;

    // Equipos utilizados
    stats.teams[playerData.team] = (stats.teams[playerData.team] || 0) + 1;

    // Oponentes
    stats.opponents[opponentData.username] = (stats.opponents[opponentData.username] || 0) + 1;

    // Victorias/derrotas por oponente
    if (won) {
      stats.winsAgainst[opponentData.username] = (stats.winsAgainst[opponentData.username] || 0) + 1;
    } else {
      stats.lossesAgainst[opponentData.username] = (stats.lossesAgainst[opponentData.username] || 0) + 1;
    }

    // Diferencia de goles
    const goalDifference = Math.abs(match.player1.goals - match.player2.goals);
    if (goalDifference > stats.biggestGoalDifference.difference) {
      stats.biggestGoalDifference = {
        opponent: opponentData.username,
        difference: goalDifference,
        match
      };
    }

    // Mayor cantidad de goles en un partido
    const totalGoals = playerData.goals;
    if (totalGoals > stats.mostGoalsInMatch.goals) {
      stats.mostGoalsInMatch = {
        goals: totalGoals,
        match
      };
    }

    // Progresión de goles
    stats.goalsProgression.push({
      date: new Date(match.date).toLocaleDateString(),
      goals: playerData.goals
    });
  });

  // Encontrar el equipo más usado
  const mostUsedTeam = Object.entries(stats.teams)
    .reduce((max, [team, count]) => 
      count > (max.count || 0) ? { team, count } : max,
      { team: '', count: 0 }
    );

  // Encontrar el oponente más frecuente
  const mostFrequentOpponent = Object.entries(stats.opponents)
    .reduce((max, [username, count]) => 
      count > (max.count || 0) ? { username, count } : max,
      { username: '', count: 0 }
    );

  return {
    totalMatches: stats.totalMatches,
    wins: stats.wins,
    losses: stats.losses,
    mostUsedTeam,
    mostFrequentOpponent,
    mostWinsAgainst: Object.entries(stats.winsAgainst)
      .reduce((max, [username, count]) => 
        count > (max.count || 0) ? { username, count } : max,
        { username: '', count: 0 }
      ),
    mostLossesAgainst: Object.entries(stats.lossesAgainst)
      .reduce((max, [username, count]) => 
        count > (max.count || 0) ? { username, count } : max,
        { username: '', count: 0 }
      ),
    biggestGoalDifference: stats.biggestGoalDifference,
    mostGoalsInMatch: stats.mostGoalsInMatch,
    goalsProgression: stats.goalsProgression
  };
}
