import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

const TenantDashboard = () => {
  const { user } = useAuth();
  
  const [myOffers, setMyOffers] = useState([]);
  const [requests, setRequests] = useState([]);             
  const [myApplications, setMyApplications] = useState([]); 
  const [messages, setMessages] = useState([]);
  const [adminMessages, setAdminMessages] = useState([]);
  const [adminReplyDraft, setAdminReplyDraft] = useState('');
  const [replyingAdminId, setReplyingAdminId] = useState(null);
  const [sendingAdminReply, setSendingAdminReply] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('requests'); 
  const [offersFilter, setOffersFilter] = useState('active'); 
  const [appsFilter, setAppsFilter] = useState('active');     

  useEffect(() => {
    if (user) {
        fetchProfile();
        fetchOwnerData();   
        fetchTenantData();
        fetchMessages();
        fetchAdminMessages();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (data?.full_name) setFullName(data.full_name);
  };

  const fetchOwnerData = async () => {
    const { data: offers } = await supabase
        .from('properties')
        .select('*, property_images(image_url)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
    setMyOffers(offers || []);

    const { data: reqs, error } = await supabase
        .from('bookings')
        .select('*, properties!inner(title, owner_id), profiles(email, full_name)')
        .eq('properties.owner_id', user.id)
        .order('created_at', { ascending: false });

    if (error) console.error("Błąd pobierania wniosków:", error);
    setRequests(reqs || []);
    setLoading(false);
  };

  const fetchTenantData = async () => {
    const { data } = await supabase
        .from('bookings')
        .select('*, properties(title, address_city, price_per_month)')
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false });
    setMyApplications(data || []);
  };

  // Pobieranie wiadomości między właścicielem a najemcą
  const fetchMessages = async () => {
    // Pobierz wszystkie bookingi gdzie użytkownik jest najemcą
    const { data: tenantBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('tenant_id', user.id);

    // Pobierz wszystkie bookingi gdzie użytkownik jest właścicielem
    const { data: ownerBookings } = await supabase
      .from('bookings')
      .select('id, properties!inner(owner_id)')
      .eq('properties.owner_id', user.id);

    const allBookingIds = [
      ...(tenantBookings?.map(b => b.id) || []),
      ...(ownerBookings?.map(b => b.id) || [])
    ];

    if (allBookingIds.length === 0) {
      setMessages([]);
      return;
    }

    // Pobierz wiadomości związane z tymi bookingami
    const { data: msgs, error } = await supabase
      .from('messages')
      .select('*')
      .in('booking_id', allBookingIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Błąd pobierania wiadomości:", error);
      setMessages([]);
    } else {
      // Pobierz profile nadawców i odbiorców
      const senderIds = [...new Set((msgs || []).map(m => m.sender_id))];
      const receiverIds = [...new Set((msgs || []).map(m => m.receiver_id))];
      const allUserIds = [...new Set([...senderIds, ...receiverIds])];

      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, is_admin')
          .in('id', allUserIds);

        const profilesMap = {};
        if (profiles) {
          profiles.forEach(p => profilesMap[p.id] = p);
        }

        // Pobierz tytuły nieruchomości
        const bookingIds = [...new Set((msgs || []).map(m => m.booking_id))];
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('id, properties(title)')
          .in('id', bookingIds);

        const bookingsMap = {};
        if (bookingsData) {
          bookingsData.forEach(b => bookingsMap[b.id] = b);
        }

        // Połącz dane
        const messagesWithDetails = (msgs || []).map(msg => ({
          ...msg,
          sender: profilesMap[msg.sender_id] || null,
          receiver: profilesMap[msg.receiver_id] || null,
          booking: bookingsMap[msg.booking_id] || null
        }));

        setMessages(messagesWithDetails);
      } else {
        setMessages(msgs || []);
      }
    }
  };

  // Pobieranie odpowiedzi administratora
  const fetchAdminMessages = async () => {
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_admin')
      .eq('is_admin', true);

    if (!adminProfiles || adminProfiles.length === 0) {
      setAdminMessages([]);
      setReplyingAdminId(null);
      return;
    }

    const adminIds = adminProfiles.map(p => p.id);

    // Pobierz wiadomości od administratorów do użytkownika
    const { data: toUserMsgs, error: toUserError } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', user.id)
      .in('sender_id', adminIds)
      .is('booking_id', null);

    // Pobierz wiadomości od użytkownika do administratorów
    const { data: fromUserMsgs, error: fromUserError } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', user.id)
      .in('receiver_id', adminIds)
      .is('booking_id', null);

    if (toUserError || fromUserError) {
      console.error("Błąd pobierania wiadomości od administratora:", toUserError || fromUserError);
      setAdminMessages([]);
    } else {
      const profilesMap = {};
      adminProfiles.forEach(p => profilesMap[p.id] = p);

      const allMsgs = [...(toUserMsgs || []), ...(fromUserMsgs || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const messagesWithDetails = allMsgs.map(msg => ({
        ...msg,
        sender: msg.sender_id === user.id ? { id: user.id, full_name: fullName, email: user.email, is_admin: false } : (profilesMap[msg.sender_id] || null),
        receiver: msg.receiver_id === user.id ? { id: user.id, full_name: fullName, email: user.email, is_admin: false } : (profilesMap[msg.receiver_id] || null)
      }));

      setAdminMessages(messagesWithDetails);

      const repliedAdminStillExists = replyingAdminId && adminIds.includes(replyingAdminId);
      if (!repliedAdminStillExists) {
        const latestAdminMsg = (toUserMsgs || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        setReplyingAdminId(latestAdminMsg?.sender_id || adminIds[0] || null);
      }
    }
  };

  const handleSendAdminReply = async () => {
    if (!adminReplyDraft.trim() || !replyingAdminId) return;

    setSendingAdminReply(true);
    const { error } = await supabase.from('messages').insert([{
      sender_id: user.id,
      receiver_id: replyingAdminId,
      content: adminReplyDraft.trim(),
      booking_id: null,
      is_read: false
    }]);
    setSendingAdminReply(false);

    if (error) {
      alert("Błąd wysyłania odpowiedzi: " + error.message);
    } else {
      setAdminReplyDraft('');
      fetchAdminMessages();
    }
  };

  // --- AKCJE ---

  const handleAccept = async (bookingId) => {
    await supabase.from('bookings').update({ status: 'accepted' }).eq('id', bookingId);
    alert('Zaakceptowano wniosek! Teraz możecie podpisać umowę.');
    fetchOwnerData();
  };

  const handleReject = async (bookingId) => {
    await supabase.from('bookings').update({ status: 'rejected' }).eq('id', bookingId);
    fetchOwnerData();
  };

  const handleDeleteOffer = async (e, propertyId) => {
    e.preventDefault(); 
    if(!window.confirm("Czy na pewno chcesz trwale usunąć to ogłoszenie?")) return;
    const { error } = await supabase.from('properties').delete().eq('id', propertyId);
    if (error) alert("Błąd usuwania: " + error.message);
    else fetchOwnerData();
  };

  const handleRestoreOffer = async (e, propertyId) => {
    e.preventDefault();
    if(!window.confirm("Czy potwierdzasz zakończenie najmu? Mieszkanie wróci na rynek.")) return;
    
    try {
        const { error: propError } = await supabase.from('properties').update({ status: 'available' }).eq('id', propertyId);
        if (propError) throw propError;
        const { error: bookingError } = await supabase.from('bookings').update({ status: 'completed' }).eq('property_id', propertyId).eq('status', 'signed');
        
        alert("Najem zakończony. Mieszkanie jest ponownie aktywne.");
        fetchOwnerData();
        setOffersFilter('active');
    } catch (error) {
        alert("Błąd: " + error.message);
    }
  };

  // Filtry
  const activeOffersList = myOffers.filter(o => o.status !== 'rented');
  const rentedOffersList = myOffers.filter(o => o.status === 'rented');
  const displayedOffers = offersFilter === 'active' ? activeOffersList : rentedOffersList;

  const activeAppsList = myApplications.filter(app => ['pending', 'accepted', 'signed'].includes(app.status));
  const archivedAppsList = myApplications.filter(app => ['rejected', 'completed', 'cancelled'].includes(app.status));
  const displayedApps = appsFilter === 'active' ? activeAppsList : archivedAppsList;


  if (loading) return <div className="text-center py-20">Ładowanie panelu...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* NAGŁÓWEK */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Cześć, {fullName || 'Użytkowniku'} 👋</h1>
                <p className="text-gray-500">Panel zarządzania</p>
            </div>
            <Link to="/ustawienia" className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-50 hover:text-black flex items-center gap-2 transition shadow-sm">
                ⚙️ Ustawienia profilu
            </Link>
        </div>
        
        {/* ZAKŁADKI */}
        <div className="flex gap-6 border-b border-gray-200 mb-8 mt-6 overflow-x-auto">
            <button onClick={() => setActiveTab('requests')} className={`pb-4 font-bold whitespace-nowrap transition ${activeTab === 'requests' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}>
                Wnioski do mnie ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button onClick={() => setActiveTab('properties')} className={`pb-4 font-bold whitespace-nowrap transition ${activeTab === 'properties' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}>
                Moje nieruchomości
            </button>
            <button onClick={() => setActiveTab('applications')} className={`pb-4 font-bold whitespace-nowrap transition ${activeTab === 'applications' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}>
                Moje rezerwacje
            </button>
            <button onClick={() => setActiveTab('messages')} className={`pb-4 font-bold whitespace-nowrap transition ${activeTab === 'messages' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}>
                Wiadomości
            </button>
        </div>

        {/* --- 1. WNIOSKI OD NAJEMCÓW --- */}
        {activeTab === 'requests' && (
            <div className="animate-fade-in-up">
                {requests.length === 0 ? (
                    <p className="text-gray-400 text-center py-10 bg-white rounded-xl border border-gray-100">Brak nowych wniosków.</p>
                ) : (
                    <div className="space-y-4">
                        {requests.map((req) => (
                            <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <div className="font-bold text-lg">{req.properties.title}</div>
                                    <div className="text-gray-500 text-sm">Zgłoszenie od: <span className="text-black font-medium">{req.profiles?.full_name || req.profiles?.email}</span></div>
                                    <div className={`text-xs font-bold mt-2 uppercase px-2 py-1 rounded inline-block ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''} ${req.status === 'accepted' ? 'bg-green-100 text-green-700' : ''} ${req.status === 'signed' ? 'bg-black text-white' : ''}`}>Status: {req.status}</div>
                                </div>
                                <div className="flex gap-3 items-center">
                                    {req.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleAccept(req.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700">Akceptuj</button>
                                            <button onClick={() => handleReject(req.id)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-300">Odrzuć</button>
                                        </>
                                    )}
                                    {(req.status === 'accepted' || req.status === 'signed') && (
                                        <Link to={`/umowa/${req.id}`} className={`px-5 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition ${req.status === 'signed' ? 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                                            {req.status === 'signed' ? '📜 Zobacz umowę' : '✍️ Przejdź do podpisu'}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- 2. MOJE NIERUCHOMOŚCI (WŁAŚCICIEL) --- */}
        {activeTab === 'properties' && (
            <div className="animate-fade-in-up">
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                        <button onClick={() => setOffersFilter('active')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${offersFilter === 'active' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}>🟢 Aktywne ({activeOffersList.length})</button>
                        <button onClick={() => setOffersFilter('rented')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${offersFilter === 'rented' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}>🏠 W trakcie ({rentedOffersList.length})</button>
                    </div>
                    <Link to="/dodaj-ogloszenie"><button className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-sm flex items-center gap-2">+ Dodaj nowe</button></Link>
                </div>

                {displayedOffers.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <p className="text-gray-400 mb-4 text-lg">{offersFilter === 'active' ? 'Brak aktywnych ogłoszeń.' : 'Brak wynajętych mieszkań.'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedOffers.map((offer) => (
                            <div key={offer.id} className="relative group block h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition border border-gray-100">
                                
                                <Link to={`/oferta/${offer.id}`} className="block h-48 bg-gray-200 relative overflow-hidden">
                                    {offer.property_images?.[0]?.image_url && <img src={offer.property_images[0].image_url} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" alt="foto" />}
                                    <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded uppercase font-bold backdrop-blur-sm">{offer.type === 'sale' ? 'Sprzedaż' : 'Wynajem'}</div>
                                    
                                    {offer.status === 'rented' && (
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-[2px] text-white">
                                            <span className="font-bold text-lg mb-1">🏠 W TRAKCIE</span>
                                        </div>
                                    )}
                                </Link>

                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className="font-bold text-slate-900 truncate text-lg mb-1">{offer.title}</h3>
                                    <p className="text-gray-500 text-sm mb-4">{offer.address_city}</p>
                                    
                                    {/* CENA */}
                                    <div className="mt-auto mb-4">
                                         <span className="font-bold text-slate-900 text-xl">{offer.price_per_month?.toLocaleString()} zł</span>
                                    </div>

                                    {/* --- NOWE TŁA PRZYCISKÓW (FOOTER) --- */}
                                    {offer.status === 'rented' ? (
                                        <div className="pt-4 border-t border-gray-100 flex gap-2">
                                             <Link to="/platnosci" className="flex-1 bg-blue-50 text-blue-700 py-2.5 rounded-lg text-xs font-bold text-center hover:bg-blue-100 transition flex items-center justify-center gap-1 border border-blue-100">
                                                💰 Finanse
                                             </Link>
                                             <button 
                                                onClick={(e) => { e.preventDefault(); handleRestoreOffer(e, offer.id); }} 
                                                className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-lg text-xs font-bold text-center hover:bg-red-100 transition border border-red-100"
                                             >
                                                ❌ Zakończ
                                             </button>
                                        </div>
                                    ) : (
                                        <div className="pt-4 border-t border-gray-100 text-center">
                                            <button 
                                                onClick={(e) => handleDeleteOffer(e, offer.id)}
                                                className="text-gray-400 text-xs font-bold hover:text-red-500 transition"
                                            >
                                                Usuń ogłoszenie
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- 4. WIADOMOŚCI --- */}
        {activeTab === 'messages' && (
            <div className="animate-fade-in-up">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Wiadomości między właścicielem a najemcą */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-bold text-lg text-slate-900">💬 Rozmowy o nieruchomościach</h3>
                            <p className="text-xs text-gray-500 mt-1">Wiadomości z właścicielami/najemcami</p>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                            {messages.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <div className="text-3xl mb-2">💬</div>
                                    <p className="text-sm">Brak wiadomości</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="p-4 hover:bg-gray-50 transition">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-sm text-slate-900">
                                                            {msg.sender?.full_name || msg.sender?.email || 'Nieznany'}
                                                        </span>
                                                        {msg.sender?.is_admin && (
                                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">ADMIN</span>
                                                        )}
                                                    </div>
                                                    {msg.booking?.properties?.title && (
                                                        <p className="text-xs text-gray-500 mb-2">
                                                            📍 {msg.booking.properties.title}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(msg.created_at).toLocaleDateString('pl-PL', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                                                {msg.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Odpowiedzi administratora */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-red-50">
                            <h3 className="font-bold text-lg text-slate-900">🛡️ Odpowiedzi administratora</h3>
                            <p className="text-xs text-gray-500 mt-1">Wiadomości od administracji</p>
                        </div>
                        <div className="max-h-[520px] overflow-y-auto">
                            {adminMessages.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <div className="text-3xl mb-2">📭</div>
                                    <p className="text-sm">Brak wiadomości od administratora</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {adminMessages.map((msg) => (
                                        <div key={msg.id} className="p-4 hover:bg-gray-50 transition">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-slate-900">
                                                        {msg.sender_id === user.id ? 'Ty' : (msg.sender?.full_name || 'Administrator')}
                                                    </span>
                                                    {msg.sender_id !== user.id && (
                                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">ADMIN</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(msg.created_at).toLocaleDateString('pl-PL', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className={`text-sm rounded-lg p-3 border whitespace-pre-wrap ${
                                                msg.sender_id === user.id
                                                    ? 'text-blue-900 bg-blue-50 border-blue-100'
                                                    : 'text-gray-700 bg-red-50 border-red-100'
                                            }`}>
                                                {msg.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-white">
                            <div className="flex flex-col gap-3">
                                <div className="text-xs text-gray-500">
                                    Odpowiadasz do:{' '}
                                    <span className="font-bold text-slate-700">
                                        {adminMessages.find(m => m.sender_id !== user.id && m.sender_id === replyingAdminId)?.sender?.full_name ||
                                         adminMessages.find(m => m.sender_id !== user.id && m.sender_id === replyingAdminId)?.sender?.email ||
                                         'Administratora'}
                                    </span>
                                </div>
                                <textarea
                                    value={adminReplyDraft}
                                    onChange={(e) => setAdminReplyDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendAdminReply();
                                        }
                                    }}
                                    rows="3"
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
                                    placeholder="Napisz odpowiedź do administratora..."
                                />
                                <button
                                    onClick={handleSendAdminReply}
                                    disabled={!adminReplyDraft.trim() || !replyingAdminId || sendingAdminReply}
                                    className="self-end bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sendingAdminReply ? 'Wysyłanie...' : 'Wyślij odpowiedź'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- 3. MOJE REZERWACJE (NAJEMCA) --- */}
        {activeTab === 'applications' && (
            <div className="animate-fade-in-up">
                
                <div className="flex bg-white p-1 rounded-lg border border-gray-200 w-fit mb-6">
                    <button onClick={() => setAppsFilter('active')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${appsFilter === 'active' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}>⏱️ W toku ({activeAppsList.length})</button>
                    <button onClick={() => setAppsFilter('archived')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${appsFilter === 'archived' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}>🗄️ Archiwum ({archivedAppsList.length})</button>
                </div>

                {displayedApps.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <p className="text-gray-400">{appsFilter === 'active' ? 'Brak aktywnych zgłoszeń.' : 'Archiwum jest puste.'}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayedApps.map((app) => (
                            <div key={app.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                {/* LEWA STRONA: INFO */}
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="font-bold text-lg">{app.properties.title}</div>
                                        <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded tracking-wide ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''} ${app.status === 'accepted' ? 'bg-green-100 text-green-700' : ''} ${app.status === 'signed' ? 'bg-black text-white' : ''} ${app.status === 'rejected' ? 'bg-red-50 text-red-500' : ''} ${app.status === 'completed' ? 'bg-gray-100 text-gray-500' : ''}`}>
                                            {app.status === 'pending' && 'Oczekiwanie'}
                                            {app.status === 'accepted' && 'Zaakceptowano'}
                                            {app.status === 'signed' && 'Umowa aktywna'}
                                            {app.status === 'rejected' && 'Odrzucono'}
                                            {app.status === 'completed' && 'Zakończono'}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">{app.properties.address_city} • {app.properties.price_per_month} zł</div>
                                </div>

                                {/* PRAWA STRONA: AKCJE */}
                                <div className="flex flex-col items-end gap-3 min-w-[160px]">
                                    
                                    {/* 1. Umowa podpisana */}
                                    {app.status === 'signed' && (
                                        <>
                                            <Link to="/platnosci" className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-bold text-sm text-center hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-2">
                                                💳 Zapłać czynsz
                                            </Link>
                                            
                                            <Link to={`/umowa/${app.id}`} className="w-full bg-white border-2 border-gray-100 text-gray-600 px-4 py-2 rounded-lg font-bold text-xs text-center hover:border-gray-300 hover:text-black transition">
                                                📄 Zobacz umowę
                                            </Link>
                                        </>
                                    )}

                                    {/* 2. Umowa zaakceptowana */}
                                    {app.status === 'accepted' && (
                                        <Link to={`/umowa/${app.id}`} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm text-center hover:bg-blue-700 shadow-sm">
                                            ✍️ Podpisz umowę
                                        </Link>
                                    )}

                                    {/* 3. Archiwumf */}
                                    {app.status === 'completed' && (
                                        <Link to={`/umowa/${app.id}`} className="text-gray-400 font-medium text-xs hover:text-gray-600 hover:underline">
                                            Archiwalna umowa
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default TenantDashboard;