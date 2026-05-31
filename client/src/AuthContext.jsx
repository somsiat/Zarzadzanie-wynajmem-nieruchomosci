import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Sprawdź sesję przy starcie
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Pobieramy rolę z metadanych (zapisanych przy rejestracji)
          setRole(session.user.user_metadata?.role || 'tenant');
        }
      } catch (error) {
        console.error("Błąd sesji:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // 2. Nasłuchuj zmian (logowanie/wylogowanie) w czasie rzeczywistym
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || 'tenant');
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Funkcja wylogowania
  const signOut = async () => {
    await supabase.auth.signOut();
    // Wymuszamy wyczyszczenie stanu "na sztywno" dla pewności
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);