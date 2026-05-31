import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  // Domyślnie ustawiamy rolę na 'tenant', ale użytkownik tego nie widzi
  const [role, setRole] = useState('tenant'); 
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Rejestracja w Auth + Zapisanie metadanych (Dobra praktyka)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });

      if (error) throw error;

      // 2. Tworzenie LUB aktualizacja profilu (UPSERT)
      // To naprawia problem pustego imienia
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([ // <--- ZMIANA Z INSERT NA UPSERT
            { 
              id: data.user.id, 
              email: email,
              full_name: fullName,
              role: role 
            }
          ]);

        if (profileError) throw profileError;

        alert('Rejestracja udana! Możesz się zalogować.');
        navigate('/login');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Utwórz konto</h2>
          <p className="mt-2 text-sm text-gray-600">
             Dołącz do Flatly w kilka sekund
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="rounded-md shadow-sm space-y-4">
            
            {/* Imię i Nazwisko */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko</label>
              <input
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                placeholder="Jan Kowalski"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                placeholder="jan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Hasło */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
              <input
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* TUTAJ BYŁO PYTANIE "KIM JESTEŚ" - USUNIĘTE */}

          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition disabled:opacity-50"
            >
              {loading ? 'Rejestrowanie...' : 'Zarejestruj się'}
            </button>
          </div>

          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">Masz już konto? </span>
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Zaloguj się
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;