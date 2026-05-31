import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  
  // 1. Zmienna stanu dla Admina
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) fetchUserData();
  }, [user]);

  // 2. Pobieramy imię ORAZ status admina
  const fetchUserData = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, is_admin') // <--- Tutaj dodaliśmy is_admin
      .eq('id', user.id)
      .single();
    
    if (data) {
        if (data.full_name) setFullName(data.full_name);
        if (data.is_admin) setIsAdmin(true); // <--- Ustawiamy flagę
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 h-20 flex items-center">
      <div className="container mx-auto px-4 relative">
        <div className="flex justify-between items-center">
          
          {/* 1. LEWA STRONA - LOGO */}
          <Link to="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <span className="bg-black text-white w-8 h-8 flex items-center justify-center rounded-lg">F</span>
            Flatly
          </Link>

          {/* 2. PRAWA STRONA: ELEMENTY STAŁE */}
          <div className="flex items-center gap-4">
            
            {user ? (
                // WIDOK ZALOGOWANEGO
                <div className="flex items-center gap-3">
                    {/* --- 3. PRZYCISK ADMINA (Tylko jeśli isAdmin === true) --- */}
                    {isAdmin && (
                        <Link to="/admin">
                            <button className="bg-red-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-red-700 transition shadow-sm">
                                Panel administratora
                            </button>
                        </Link>
                    )}
                    {/* -------------------------------------------------------- */}

                    {/* Przycisk Panel - ukryty dla administratorów */}
                    {!isAdmin && (
                        <Link to="/dashboard">
                            <button className="bg-black text-white px-5 py-2 rounded-md font-bold text-sm hover:bg-gray-800 transition">
                                Panel
                            </button>
                        </Link>
                    )}
                </div>
            ) : (
                // WIDOK NIEZALOGOWANEGO
                <Link to="/login" className="font-bold text-sm text-slate-900 hover:text-blue-600 px-2">
                    Zaloguj
                </Link>
            )}

            {/* 3. HAMBURGER / KRZYŻYK */}
            <button 
              onClick={toggleMenu} 
              className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-50 rounded-full transition z-50"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>

          </div>
        </div>

        {/* --- MENU BOCZNE (DROPDOWN) --- */}
        {isMenuOpen && (
          <div className="absolute top-16 right-0 w-80 bg-white shadow-2xl border border-gray-100 rounded-xl p-6 flex flex-col gap-6 animate-fade-in-up z-40">
            
            {user && (
                <div className="border-b border-gray-100 pb-4 mb-2">
                    <p className="text-xs text-gray-400 uppercase font-bold">Zalogowany jako</p>
                    <p className="font-bold text-slate-900 truncate">{fullName || user.email}</p>
                    {isAdmin && <span className="text-xs text-red-600 font-bold uppercase mt-1 block">Administrator</span>}
                </div>
            )}

            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Oferty</p>
                <div className="space-y-3">
                    <Link to="/oferty?type=sale" onClick={toggleMenu} className="flex items-center gap-3 font-medium text-slate-700 hover:text-blue-600 transition">
                        Kup nieruchomość
                    </Link>
                    <Link to="/oferty?category=apartment&type=rent" onClick={toggleMenu} className="flex items-center gap-3 font-medium text-slate-700 hover:text-blue-600 transition">
                        Wynajmij mieszkanie
                    </Link>
                    <Link to="/oferty?category=house&type=rent" onClick={toggleMenu} className="flex items-center gap-3 font-medium text-slate-700 hover:text-blue-600 transition">
                        Wynajmij dom
                    </Link>
                </div>
            </div>

            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Wiedza i pomoc</p>
                <div className="space-y-3">
                    <Link to="/blog" onClick={toggleMenu} className="block font-medium text-slate-700 hover:text-blue-600 transition">
                        Blog o nieruchomościach
                    </Link>
                    <Link to="/cennik" onClick={toggleMenu} className="block font-medium text-blue-600 hover:text-blue-800 transition">
                        Cennik i Pakiety
                    </Link>
                </div>
            </div>

            
            {user ? (
                <div className="pt-4 border-t border-gray-100">
                    <button 
                        onClick={handleLogout} 
                        className="text-red-600 font-bold text-sm hover:underline"
                    >
                        Wyloguj się
                    </button>
                </div>
            ) : (
                <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-2">Nie masz konta?</p>
                      <Link to="/register" onClick={toggleMenu} className="block w-full bg-black text-white text-center py-2.5 rounded font-bold hover:bg-gray-800">
                        Załóż darmowe konto
                      </Link>
                </div>
            )}
            
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;