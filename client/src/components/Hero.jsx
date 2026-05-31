import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    location: '',
    type: 'all',
    minPrice: '',
    maxPrice: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // LOGIKA WYSZUKIWARKI:
  const handleSubmit = () => {
    const params = new URLSearchParams();
    
    // Dodajemy parametry tylko jeśli są wpisane
    if (filters.location) params.append('city', filters.location);
    if (filters.type !== 'all') params.append('type', filters.type);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

    // Przekieruj do strony z wynikami
    navigate(`/oferty?${params.toString()}`);
  };

  const handleClear = () => {
    setFilters({ location: '', type: 'all', minPrice: '', maxPrice: '' });
  };

  // Obsługa kategorii
  const handleTileClick = (path) => {
    navigate(path);
  };

  // Komponent pomocniczy dla kafelka 
  const CategoryCard = ({ icon, label, path }) => (
    <button 
      onClick={() => handleTileClick(path)}
      className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-3 border border-gray-100 w-full h-28 group cursor-pointer"
    >
      <div className="text-gray-400 group-hover:text-blue-600 transition transform group-hover:scale-110">
        {icon}
      </div>
      <span className="font-semibold text-slate-700 text-sm">{label}</span>
    </button>
  );

  return (
    <div className="w-full">
      {/* 1. Tło */}
      <div 
        className="bg-blue-600 py-16 md:py-24 px-4 text-center relative overflow-hidden"
        style={{
          backgroundImage: 'url(/hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay dla lepszej czytelności */}
        <div className="absolute top-0 left-0 w-full h-full bg-blue-600/30 pointer-events-none"></div>
        
        {/* Tło - dekoracyjne elementy */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto max-w-5xl relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-10 drop-shadow-md">
                Znajdź coś dla siebie
            </h1>

            <div className="bg-white p-4 rounded-lg shadow-xl grid grid-cols-1 md:grid-cols-12 gap-3 text-left">
                {/* Lokalizacja */}
                <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Lokalizacja</label>
                    <input 
                        type="text" 
                        name="location" 
                        placeholder="np. Warszawa" 
                        value={filters.location} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                    />
                </div>
                
                {/* Typy */}
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Typ</label>
                    <select 
                        name="type" 
                        value={filters.type} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value="all">Wszystkie</option>
                        <option value="rent">Wynajem</option>
                        <option value="sale">Sprzedaż</option>
                    </select>
                </div>
                
                {/* Cena od */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">Cena (zł)</label>
                    <input 
                        type="number" 
                        name="minPrice" 
                        placeholder="Od" 
                        value={filters.minPrice} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                    />
                </div>
                
                {/* Cena do */}
                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">&nbsp;</label>
                    <input 
                        type="number" 
                        name="maxPrice" 
                        placeholder="Do" 
                        value={filters.maxPrice} 
                        onChange={handleInputChange} 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                    />
                </div>
                
                {/* Przycisk szukaj */}
                <div className="md:col-span-1 flex items-end">
                    <button 
                        onClick={handleSubmit} 
                        className="w-full h-[42px] bg-black hover:bg-gray-800 text-white font-bold rounded transition flex items-center justify-center" 
                        title="Szukaj"
                    >
                        🔍
                    </button>
                </div>
            </div>
            
             <div className="text-right mt-2 mr-1">
                <button onClick={handleClear} className="text-xs text-blue-100 hover:text-white underline opacity-80">
                    Wyczyść filtry
                </button>
            </div>
        </div>
      </div>

      {/* 2. KAFELKI KATEGORII */}
      <div className="bg-gray-50 py-12 border-b border-gray-200">
        <div className="container mx-auto px-4">
            <h3 className="text-slate-900 font-bold text-xl mb-6 text-center">Wybierz kategorię</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* MIESZKANIA */}
                <CategoryCard 
                    label="Mieszkania" 
                    path="/oferty?category=apartment&type=rent"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>}
                />
                
                {/* DOMY */}
                <CategoryCard 
                    label="Domy" 
                    path="/oferty?category=house&type=rent"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                />
                
                {/* POKOJE */}
                <CategoryCard 
                    label="Pokoje" 
                    path="/oferty?category=room&type=rent"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20"/><path d="M20 22V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v17"/><line x1="4" x2="20" y1="14" y2="14"/></svg>}
                />

                {/* SPRZEDAŻ */}
                <CategoryCard 
                    label="Do kupienia" 
                    path="/oferty?type=sale"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8.5a1.5 1.5 0 0 0-1.5-1.5h-7A1.5 1.5 0 0 0 7 12.5V21"/><path d="M9 21v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5"/></svg>}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;