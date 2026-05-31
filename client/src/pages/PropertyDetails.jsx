import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

const PropertyDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);

  useEffect(() => {
    fetchOfferDetails();
    if (user) checkBookingStatus();
  }, [id, user]);

  const fetchOfferDetails = async () => {
    // profiles!owner_id — dane kontaktowe z profilu właściciela, gdy w ofercie nie wpisano contact_*
    const { data, error } = await supabase
      .from('properties')
      .select('*, property_images(image_url), profiles!owner_id(email, phone_number, full_name)')
      .eq('id', id)
      .single();

    if (!error) {
      setOffer(data);
      if (data.property_images?.length > 0) setActiveImage(data.property_images[0].image_url);
    }
    setLoading(false);
  };

  const checkBookingStatus = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('status')
      .eq('property_id', id)
      .eq('tenant_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) setBookingStatus(data.status);
  };

  const handleRentRequest = async () => {
    if (!user) return navigate('/login', { state: { from: location } });
    
    let confirmMsg = "Czy chcesz wysłać zgłoszenie?";
    if (bookingStatus === 'rejected') {
        confirmMsg = "Poprzednie zgłoszenie odrzucono. Czy wysłać nowe?";
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .insert([{ 
            property_id: id, 
            tenant_id: user.id, 
            status: 'pending' 
        }]);

      if (error) throw error;
      alert("Zgłoszenie wysłane!");
      setBookingStatus('pending');
    } catch (error) {
      alert("Błąd: " + error.message);
    }
  };

  const handleDelete = async () => {
    if(window.confirm("Usunąć ogłoszenie?")) {
        await supabase.from('properties').delete().eq('id', id);
        navigate('/');
    }
  };

  if (loading) return <div className="text-center py-20">Ładowanie...</div>;
  if (!offer) return <div className="text-center py-20">Brak oferty.</div>;

  const isSale = offer.type === 'sale';
  const isOwner = user && user.id === offer.owner_id;

  // Kontakt z pola oferty lub (fallback) z profilu właściciela — inaczej widzisz „ukryte” mimo że dane są w profilu
  const ownerProfile = offer.profiles;
  const displayPhone = (offer.contact_phone && String(offer.contact_phone).trim()) || (ownerProfile?.phone_number && String(ownerProfile.phone_number).trim()) || '';
  const displayEmail = (offer.contact_email && String(offer.contact_email).trim()) || (ownerProfile?.email && String(ownerProfile.email).trim()) || '';

  // Konfiguracja przycisku
  const getButtonConfig = () => {
    if (bookingStatus === 'pending') return { text: '⏳ Zgłoszenie wysłane', style: 'bg-yellow-100 text-yellow-800 cursor-not-allowed', disabled: true };
    if (bookingStatus === 'accepted') return { text: '🎉 Zaakceptowano!', style: 'bg-green-100 text-green-800 cursor-not-allowed', disabled: true };
    if (bookingStatus === 'rejected') return { text: '✕ Odrzucono (Spróbuj ponownie)', style: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100', disabled: false };
    
    return { 
        text: isSale ? '🏦 Zapytaj o kupno' : '🔑 Wynajmij ten obiekt', 
        style: 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5', 
        disabled: false 
    };
  };

  const btn = getButtonConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        
        {/* Nawigacja */}
        <div className="flex justify-between items-center mb-4">
            <Link to="/" className="text-sm text-gray-500 hover:text-black">&larr; Powrót</Link>
            {isOwner && (
                <div className="flex gap-2">
                    <Link to={`/edytuj-ogloszenie/${offer.id}`}><button className="bg-white text-blue-600 px-3 py-1 rounded border text-sm font-bold">Edytuj</button></Link>
                    <button onClick={handleDelete} className="bg-white text-red-600 px-3 py-1 rounded border text-sm font-bold">Usuń</button>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEWA KOLUMNA: ZDJĘCIA I TREŚĆ */}
          <div className="lg:col-span-2 space-y-6">
             
             {/* Galeria */}
             <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="h-[400px] bg-gray-200 rounded-xl overflow-hidden relative">
                     {activeImage ? (
                        <img src={activeImage} className="w-full h-full object-cover" alt="Oferta" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">Brak zdjęć</div>
                     )}
                     <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 text-xs font-bold rounded uppercase">
                        {isSale ? 'Sprzedaż' : 'Wynajem'}
                     </div>
                 </div>
                 {offer.property_images?.length > 1 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-2 scrollbar-hide">
                        {offer.property_images.map((img, idx) => (
                        <img key={idx} src={img.image_url} onClick={() => setActiveImage(img.image_url)} className={`w-20 h-20 object-cover rounded cursor-pointer border-2 transition ${activeImage === img.image_url ? 'border-black' : 'border-transparent hover:border-gray-300'}`} />
                        ))}
                    </div>
                 )}
             </div>

             {/* Główne Info */}
             <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h1 className="text-3xl font-bold mb-2 text-slate-900">{offer.title}</h1>
                <p className="text-gray-500 mb-6 flex items-center gap-2">📍 {offer.address_city}, {offer.address_street}</p>
                
                {/* Parametry techniczne (NOWOŚĆ) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 py-6 border-t border-b border-gray-100">
                    <div className="text-center">
                        <span className="block text-gray-400 text-xs uppercase font-bold">Powierzchnia</span>
                        <span className="text-lg font-bold text-slate-900">{offer.surface_area ? `${offer.surface_area} m²` : '-'}</span>
                    </div>
                    <div className="text-center border-l border-gray-100">
                        <span className="block text-gray-400 text-xs uppercase font-bold">Pokoje</span>
                        <span className="text-lg font-bold text-slate-900">{offer.rooms || '-'}</span>
                    </div>
                    <div className="text-center border-l border-gray-100">
                        <span className="block text-gray-400 text-xs uppercase font-bold">Piętro</span>
                        <span className="text-lg font-bold text-slate-900">{offer.floor || '-'}</span>
                    </div>
                    <div className="text-center border-l border-gray-100">
                        <span className="block text-gray-400 text-xs uppercase font-bold">Rok budowy</span>
                        <span className="text-lg font-bold text-slate-900">{offer.build_year || '-'}</span>
                    </div>
                </div>

                <div className="prose text-gray-600 whitespace-pre-line leading-relaxed mb-8">
                    {offer.description}
                </div>

                {/* --- SEKCJA UDOGODNIEŃ (NOWOŚĆ) --- */}
                {offer.amenities && offer.amenities.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Udogodnienia</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {offer.amenities.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-700">
                                    <span className="text-green-500 font-bold">✓</span> {item}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
          </div>

          {/* PRAWA KOLUMNA: CENA I KONTAKT */}
          <div className="lg:col-span-1">
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-24">
                <div className="mb-6">
                    <p className="text-4xl font-bold text-blue-600 tracking-tight">{offer.price_per_month?.toLocaleString('pl-PL')} zł</p>
                    <p className="text-sm text-gray-400 mt-1">{isSale ? 'Cena całkowita' : 'Czynsz miesięczny'}</p>
                    
                    {!isSale && (
                        <div className="mt-3 space-y-1">
                            {offer.admin_fee > 0 && <p className="text-xs text-gray-500">+ {offer.admin_fee} zł czynsz admin.</p>}
                            {offer.security_deposit > 0 && <p className="text-xs text-gray-500">Kaucja: {offer.security_deposit} zł</p>}
                        </div>
                    )}
                </div>
                
                <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm">📞</div>
                        <span className="font-bold text-slate-900">{displayPhone || 'Numer ukryty'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm">✉️</div>
                        <span className="text-sm text-slate-600 break-all">{displayEmail || 'Email ukryty'}</span>
                    </div>
                </div>

                {isOwner ? (
                    <div className="bg-gray-100 text-center py-4 rounded-xl text-sm font-bold text-gray-500">
                        To Twoja oferta (widok właściciela)
                    </div>
                ) : (
                    <div className="space-y-3">
                        <button 
                            onClick={handleRentRequest} 
                            disabled={btn.disabled}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${btn.style}`}
                        >
                            {btn.text}
                        </button>
                    </div>
                )}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default PropertyDetails;