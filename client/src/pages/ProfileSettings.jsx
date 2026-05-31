import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
        fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone_number')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
          console.error('Błąd pobierania:', error);
      }
      
      // Ustawiamy dane (jeśli ich nie ma w bazie, zostają puste)
      setFormData({
        full_name: data?.full_name || '',
        phone_number: data?.phone_number || '',
        email: user.email
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
        // Używamy UPSERT - jeśli profil jest, to go zaktualizuje. Jeśli nie ma - stworzy.
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id, // Kluczowe: ID musi się zgadzać z ID usera
                full_name: formData.full_name,
                phone_number: formData.phone_number,
                updated_at: new Date()
            });

        if (error) throw error;

        alert('Zapisano zmiany pomyślnie!');
        navigate('/dashboard');

    } catch (error) {
        alert('Błąd zapisu: ' + error.message);
        console.error(error);
    } finally {
        setUpdating(false);
    }
  };

  if (loading) return <div className="text-center py-20">Ładowanie ustawień...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Ustawienia Profilu</h1>
        
        <form onSubmit={handleSave} className="space-y-6">
            
            {/* Email (Tylko do odczytu) */}
            <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">Adres Email</label>
                <input 
                    type="text" 
                    value={formData.email}
                    disabled
                    className="w-full p-3 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Emaila nie można zmienić.</p>
            </div>

            {/* Imię i Nazwisko */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Imię i nazwisko</label>
                <input 
                    type="text" 
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-black outline-none"
                    placeholder="np. Jan Kowalski"
                />
            </div>

            {/* Telefon */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Numer Telefonu</label>
                <input 
                    type="text" 
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-black outline-none"
                    placeholder="np. 500 600 700"
                />
                <p className="text-xs text-gray-400 mt-1">Numer będzie widoczny na umowie i dla kontrahentów.</p>
            </div>

            <hr className="border-gray-100" />

            <button 
                type="submit" 
                disabled={updating}
                className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition shadow-lg"
            >
                {updating ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;