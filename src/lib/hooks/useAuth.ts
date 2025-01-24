import { useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';
import Cookies from 'js-cookie';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // Establecer cookie cuando el usuario está autenticado
        user.getIdToken().then(token => {
          Cookies.set('token', token);
        });
      } else {
        setUser(null);
        // Remover cookie cuando el usuario no está autenticado
        Cookies.remove('token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const token = await result.user.getIdToken();
    Cookies.set('token', token);
    return result;
  };

  const signUp = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const token = await result.user.getIdToken();
    Cookies.set('token', token);
    return result;
  };

  const logout = async () => {
    await signOut(auth);
    Cookies.remove('token');
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    logout,
    auth
  };
}