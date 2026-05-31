import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar'; // Zakładam, że masz Navbar

const AllOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // Pobieramy filtry z paska adresu (np. ?category=apartment&type=rent)
  const category = searchParams.get('category') || 'all';
  const type = searchParams.get('type') || 'all';
  const city = searchParams.get('city') || '';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  useEffect(() => {
    fetchOffers();
  }, [category, type, city, minPrice, maxPrice]);

  const fetchOffers = async () => {
    setLoading(true);
    let query = supabase
      .from('properties')
      .select('*, property_images(image_url)')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
      

    if (city) query = query.ilike('address_city', `%${city}%`);
    if (type !== 'all') query = query.eq('type', type);
    if (category !== 'all') query = query.eq('category', category);
    if (minPrice) query = query.gte('price_per_month', minPrice);
    if (maxPrice) query = query.lte('price_per_month', maxPrice);

    const { data, error } = await query;
    if (!error) setOffers(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Wyniki wyszukiwania</h1>
        
        {loading ? (
          <div>Szukam ofert...</div>
        ) : offers.length === 0 ? (
          <div className="text-gray-500">Brak ofert spełniających kryteria.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offers.map(offer => (
              <Link to={`/oferta/${offer.id}`} key={offer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                <div className="h-48 bg-gray-200 relative">
                    {offer.property_images?.[0] ? (
                        <img src={offer.property_images[0].image_url} className="w-full h-full object-cover" alt="foto" />
                    ) : <div className="p-4 text-gray-400">Brak zdjęcia</div>}
                    <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded uppercase font-bold">{offer.type === 'sale' ? 'Sprzedaż' : 'Wynajem'}</div>
                </div>
                <div className="p-4">
                    <h3 className="font-bold truncate">{offer.title}</h3>
                    <p className="text-sm text-gray-500">{offer.address_city}</p>
                    <p className="text-blue-600 font-bold mt-2">{offer.price_per_month} zł</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOffers;