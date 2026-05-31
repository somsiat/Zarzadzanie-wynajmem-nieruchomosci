import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

const NotaryAppointment = () => {

  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Dane
  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Formularze
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [newMessage, setNewMessage] = useState('');
  
  // UI
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchDetails();
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchDetails = async () => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        properties (id, title, address_city, price_per_month, type, owner_id),
        profiles (id, full_name, email)
      `)
      .eq('id', id)
      .single();
    
    if (data) {
        setBooking(data);
        if (data.proposed_date) setDate(data.proposed_date);
        if (data.proposed_time) setTime(data.proposed_time);
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').eq('booking_id', id).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getPartnerId = () => {
      if (!booking) return null;
      return user.id === booking.properties.owner_id ? booking.tenant_id : booking.properties.owner_id;
  };

  // --- LOGIKA NEGOCJACJI ---

  const handleProposeDate = async () => {
    if (!date || !time) return alert("Wybierz datę i godzinę.");

    // Aktualizujemy bazę
    const { error } = await supabase
        .from('bookings')
        .update({ 
            proposed_date: date, 
            proposed_time: time,
            last_proposer_id: user.id,
            status: 'accepted' 
        })
        .eq('id', id);

    if (!error) {
        // Aktualizujemy stan lokalnie (żeby UI od razu zareagowało)
        setBooking(prev => ({ 
            ...prev, 
            proposed_date: date, 
            proposed_time: time, 
            last_proposer_id: user.id,
            status: 'accepted' 
        }));
        
        await sendMessageToChat(`📅 Zaproponowałem nowy termin: ${date} o godzinie ${time}`);
        alert("Propozycja wysłana!");
    }
  };

  const handleAcceptDate = async () => {
    if (!window.confirm(`Czy ostatecznie potwierdzasz termin ${booking.proposed_date} o ${booking.proposed_time}?`)) return;

    // 1. Aktualizacja w bazie
    const { error } = await supabase.from('bookings').update({ status: 'signed' }).eq('id', id);

    if (!error) {
        // 2. KLUCZOWE: Natychmiastowa aktualizacja stanu lokalnego
        // Dzięki temu widok "przeskakuje" na zielony komunikat i blokuje przyciski
        setBooking(prev => ({ ...prev, status: 'signed' }));

        await sendMessageToChat(`✅ Termin ${booking.proposed_date} został zaakceptowany!`);
        alert("Termin potwierdzony! Umówiono wizytę.");
    }
  };

  // --- LOGIKA CZATU ---

  const sendMessageToChat = async (content) => {
    const partnerId = getPartnerId();
    if (!partnerId) return;

    await supabase.from('messages').insert([{ 
        sender_id: user.id,
        receiver_id: partnerId,
        property_id: booking.property_id, // Wymagane przez Twoją tabelę
        booking_id: id,
        content: content,
        is_read: false
    }]);
    fetchMessages();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await sendMessageToChat(newMessage);
    setNewMessage('');
  };

  if (loading || !booking) return <div className="text-center py-20">Ładowanie...</div>;

  const prop = booking.properties;
  const isSigned = booking.status === 'signed'; // Czy umowa/termin jest już zaklepany?

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-black mb-4 block">&larr; Wróć do panelu</Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[85vh]">
            
            {/* LEWA KOLUMNA */}
            <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Karta */}
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold">Finalizacja Zakupu</p>
                            <h1 className="text-2xl font-bold mt-1">{prop.title}</h1>
                            <p className="text-slate-300 text-sm">{prop.address_city}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase font-bold">Cena</p>
                            <p className="text-2xl font-bold text-green-400">{prop.price_per_month?.toLocaleString()} zł</p>
                        </div>
                    </div>
                </div>

                {/* Panel Negocjacji - BLOKADA PO PODPISANIU */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex-grow flex flex-col justify-center transition-all duration-300">
                    
                    {isSigned ? (
                        // --- WIDOK PO ZAAKCEPTOWANIU (Zablokowany) ---
                        <div className="text-center animate-fade-in-up">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✓</div>
                            <h2 className="text-2xl font-bold text-slate-900">Termin Ustalony!</h2>
                            <p className="text-lg text-slate-700 mt-2 font-medium">
                                {date} | godz. {time}
                            </p>
                            <div className="bg-green-50 text-green-800 p-4 rounded-xl mt-6 text-sm font-bold border border-green-100">
                                Ten termin jest ostateczny i zatwierdzony przez obie strony.
                            </div>
                            <button onClick={() => navigate('/dashboard')} className="mt-6 font-bold text-blue-600 hover:underline">
                                Wróć do panelu
                            </button>
                        </div>
                    ) : (
                        // --- WIDOK NEGOCJACJI (Aktywny) ---
                        <>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Ustalanie terminu</h2>
                            <p className="text-gray-500 text-sm mb-6">Wybierz datę aktu notarialnego.</p>

                            <div className="flex gap-4 mb-6">
                                <div className="w-1/2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Data</label>
                                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg font-bold outline-none focus:border-black"/>
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Godzina</label>
                                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg font-bold outline-none focus:border-black"/>
                                </div>
                            </div>

                            {!booking.last_proposer_id ? (
                                <button onClick={handleProposeDate} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition">Wyślij propozycję</button>
                            ) : (
                                booking.last_proposer_id === user.id ? (
                                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-center font-bold border border-yellow-100">
                                        ⏳ Twoja propozycja czeka na akceptację.
                                        <button onClick={handleProposeDate} className="block w-full mt-2 text-xs underline hover:text-black">Zmień propozycję</button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-center mb-4">
                                            Propozycja partnera: <strong className="text-lg">{date}, {time}</strong>
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={handleAcceptDate} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition transform hover:-translate-y-0.5 shadow-lg">
                                                ✓ Akceptuj ostatecznie
                                            </button>
                                            <button onClick={handleProposeDate} className="flex-1 bg-white border border-gray-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-gray-50">
                                                Zaproponuj inny
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* PRAWA KOLUMNA: CZAT */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden h-full">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-slate-700">💬 Czat</h3>
                </div>
                
                <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50">
                    {messages.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">Rozpocznij rozmowę...</p>}
                    {messages.map((msg) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Napisz..." 
                        className="flex-grow bg-gray-100 px-4 py-2 rounded-full text-sm outline-none focus:bg-white focus:border-blue-600 border border-transparent transition"
                    />
                    <button type="submit" className="bg-blue-600 text-white w-10 h-10 rounded-full font-bold hover:bg-blue-700 transition">&uarr;</button>
                </form>
            </div>

        </div>
      </div>
    </div>
  );
};

export default NotaryAppointment;