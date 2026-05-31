import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import PropertyCard from './PropertyCard'; // <--- 1. Importujemy gotowy kafelek

const LatestOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestOffers();
  }, []);

  const fetchLatestOffers = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('properties')
      .select('*, property_images(image_url)')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Błąd:', error);
    } else {
      setOffers(data || []);
    }
    
    setLoading(false);
  };

  if (loading) return <div className="py-20 text-center text-gray-500">Ładowanie najnowszych ofert...</div>;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        
        {/* Nagłówek sekcji */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Najnowsze ogłoszenia</h2>
                <p className="text-gray-500 mt-2">Sprawdź co nowego pojawiło się w naszej ofercie</p>
            </div>
            <Link to="/oferty" className="hidden md:block text-blue-600 font-bold hover:underline">
                Zobacz wszystkie &rarr;
            </Link>
        </div>
        
        {/* Siatka ofert */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offers.map((offer) => (
            // 2. Używamy gotowego PropertyCard owiniętego w Link
            <Link to={`/oferta/${offer.id}`} key={offer.id} className="block h-full">
               <PropertyCard offer={offer} />
            </Link>
          ))}
        </div>

        {/* Przycisk na mobile */}
        <div className="mt-8 text-center md:hidden">
            <Link to="/oferty" className="inline-block bg-white border border-gray-300 text-slate-900 px-6 py-3 rounded-full font-bold shadow-sm hover:bg-gray-50">
                Zobacz wszystkie oferty
            </Link>
        </div>

      </div>
    </section>
  );
};

export default LatestOffers;