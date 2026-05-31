import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (user) {
        fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    // 1. Pobierz płatności
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*, bookings(id, properties(id, title, address_city, price_per_month, admin_fee))')
      .or(`tenant_id.eq.${user.id},owner_id.eq.${user.id}`)
      .order('due_date', { ascending: false });

    setPayments(paymentsData || []);

    // 2. Pobierz aktywne umowy
    const { data: rentalsData } = await supabase
        .from('bookings')
        .select('*, properties!inner(*), profiles(full_name, email)')
        .eq('properties.owner_id', user.id)
        .eq('status', 'signed');
    
    // Filtruj tylko te z properties (na wypadek, gdyby jakieś nie załadowały się poprawnie)
    setActiveRentals((rentalsData || []).filter(rental => rental.properties));
    setLoading(false);
  };

  // --- NAJEMCA: PŁACENIE ---
  const handlePay = async (paymentId) => {
    setProcessingId(paymentId);
    setTimeout(async () => {
        const { error } = await supabase
            .from('payments')
            .update({ status: 'paid', paid_at: new Date() })
            .eq('id', paymentId);
        if (!error) fetchData();
        setProcessingId(null);
    }, 1500); 
  };

  // --- WŁAŚCICIEL: ZMIANA CZYNSZU ---
  const handleChangeRent = async (propertyId, currentPrice) => {
      const newPrice = window.prompt("Podaj nową kwotę czynszu (PLN):", currentPrice);
      if (!newPrice || isNaN(newPrice)) return;

      const { error } = await supabase
        .from('properties')
        .update({ price_per_month: Number(newPrice) })
        .eq('id', propertyId);

      if (error) alert("Błąd: " + error.message);
      else {
          alert(`Czynsz zaktualizowany do ${newPrice} zł! Kolejna faktura uwzględni nową stawkę.`);
          fetchData();
      }
  };

  // --- SYMULACJA MIESIĄCA ---
  const handleSimulateNextMonth = async () => {
    setSimulating(true);

    const lastPayment = payments[0]; 
    
    if (!lastPayment || !lastPayment.bookings) {
        alert("Brak aktywnej historii. Najpierw podpisz umowę.");
        setSimulating(false);
        return;
    }

    const booking = lastPayment.bookings;
    const lastDueDate = new Date(lastPayment.due_date);
    const nextDueDate = new Date(lastDueDate);
    nextDueDate.setMonth(lastDueDate.getMonth() + 1); 
    
    const monthName = nextDueDate.toLocaleString('pl-PL', { month: 'long' });
    const year = nextDueDate.getFullYear();

    const { data: freshProp } = await supabase
        .from('properties')
        .select('price_per_month, admin_fee')
        .eq('id', booking.properties.id)
        .single();

    let baseRent = freshProp?.price_per_month || 0;
    let mediaFee = freshProp?.admin_fee || 0;
    let penalty = 0;
    let note = '';

    // Kara za zwłokę
    const today = new Date();
    if (lastPayment.status !== 'paid' && today > lastDueDate) {
        penalty = Math.round(lastPayment.amount * 0.10); 
        note = `⚠️ Doliczono karę (${penalty} zł) za brak wpłaty.`;
    }

    const totalAmount = baseRent + mediaFee + penalty;
    
    const details = {
        rent: baseRent,
        media: mediaFee,
        penalty: penalty,
        note: note
    };

    await supabase.from('payments').insert([{
        booking_id: booking.id,
        tenant_id: lastPayment.tenant_id,
        owner_id: lastPayment.owner_id,
        title: `Czynsz - ${monthName} ${year}`,
        amount: totalAmount,
        due_date: nextDueDate,
        status: 'pending',
        details: details
    }]);

    await fetchData();
    setSimulating(false);
  };

  if (loading) return <div className="text-center py-20">Ładowanie finansów...</div>;

  const billsToPay = payments.filter(p => p.tenant_id === user.id);
  const myIncome = payments.filter(p => p.owner_id === user.id);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Centrum finansowe</h1>
                <p className="text-gray-500">Zarządzaj płatnościami i stawkami</p>
            </div>
            
            <div className="flex gap-3">
                 <button 
                    onClick={handleSimulateNextMonth}
                    disabled={simulating}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 shadow-sm transition flex items-center gap-2"
                >
                    {simulating ? 'Przeliczanie...' : '📅 Symuluj kolejny miesiąc'}
                </button>
                <Link to="/dashboard" className="bg-white border px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:text-black">
                    Wróć
                </Link>
            </div>
        </div>

        {/* --- WIDOK WŁAŚCICIELA --- */}
        {activeRentals.length > 0 && (
            <div className="mb-12 animate-fade-in-up">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    Strefa właściciela <span className="text-sm font-normal text-gray-500">(Twoje aktywne umowy)</span>
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {activeRentals
                        .filter(rental => rental.properties) // Filtruj tylko te z properties
                        .map(rental => (
                        <div key={rental.id} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                AKTYWNY NAJEM
                            </div>
                            
                            <h3 className="font-bold text-lg mb-1">{rental.properties?.title || 'Brak tytułu'}</h3>
                            <p className="text-sm text-gray-500 mb-4">Najemca: {rental.profiles?.full_name || rental.profiles?.email || 'Nieznany'}</p>
                            
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Obecny czynsz:</span>
                                    <span className="font-bold">{rental.properties?.price_per_month || 0} zł</span>
                                </div>
                                <div className="flex justify-between text-sm mb-1 text-gray-500">
                                    <span>Opłaty admin/media:</span>
                                    <span>{rental.properties?.admin_fee || 0} zł</span>
                                </div>
                                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-blue-700">
                                    <span>Razem (przychód):</span>
                                    <span>{(rental.properties?.price_per_month || 0) + (rental.properties?.admin_fee || 0)} zł</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleChangeRent(rental.properties?.id, rental.properties?.price_per_month)}
                                className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-black hover:text-white transition"
                                disabled={!rental.properties?.id}
                            >
                                Zmień stawkę czynszu
                            </button>
                            <p className="text-[10px] text-gray-400 text-center mt-2">
                                Nowa stawka zostanie naliczona od przyszłego miesiąca.
                            </p>
                        </div>
                    ))}
                </div>
                
                {/* Historia wpłat dla właściciela */}
                {myIncome.length > 0 && (
                     <div className="mt-8">
                        <h3 className="text-lg font-bold mb-3">Ostatnie wpłaty od najemców</h3>
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            {myIncome.slice(0, 10).map(inc => (
                                <div key={inc.id} className="p-4 border-b border-gray-50 flex justify-between items-center text-sm">
                                    <div>
                                        <div className="font-bold">{inc.title}</div>
                                        <div className="text-gray-400 text-xs">{new Date(inc.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className={`font-bold ${inc.status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                                        +{inc.amount} zł
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                )}
            </div>
        )}


        {/* --- WIDOK NAJEMCY (RACHUNKI) --- */}
        {billsToPay.length > 0 ? (
            <div className="animate-fade-in-up">
                 <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    🏠 Twoje rachunki <span className="text-sm font-normal text-gray-500">(Jako najemca)</span>
                </h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {billsToPay.map(pay => (
                        <div key={pay.id} className="p-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition duration-300">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 shadow-sm
                                        ${pay.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {pay.status === 'paid' ? '✓' : '!'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{pay.title}</h3>
                                        <div className="text-sm text-gray-500 flex gap-3">
                                            <span className={new Date(pay.due_date) < new Date() && pay.status !== 'paid' ? "text-red-600 font-bold" : ""}>
                                                Termin: {pay.due_date}
                                            </span>
                                        </div>
                                        
                                        {/* SZCZEGÓŁY RACHUNKU */}
                                        {pay.details && (
                                            <div className="mt-2 text-xs bg-gray-100 p-2 rounded-lg text-gray-600 w-full md:w-auto min-w-[200px]">
                                                <div className="flex justify-between"><span>Czynsz:</span> <strong>{pay.details.rent} zł</strong></div>
                                                <div className="flex justify-between"><span>Media:</span> <strong>{pay.details.media} zł</strong></div>
                                                {pay.details.penalty > 0 && <div className="flex justify-between text-red-600 font-bold"><span>KARA:</span> <strong>+{pay.details.penalty} zł</strong></div>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-slate-900">{pay.amount} zł</div>
                                        <div className={`text-[10px] font-bold uppercase ${pay.status === 'paid' ? 'text-green-600' : 'text-red-500'}`}>
                                            {pay.status === 'paid' ? 'OPŁACONO' : 'DO ZAPŁATY'}
                                        </div>
                                    </div>
                                    
                                    {pay.status === 'pending' && (
                                        <button 
                                            onClick={() => handlePay(pay.id)}
                                            disabled={processingId === pay.id}
                                            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg min-w-[140px]"
                                        >
                                            {processingId === pay.id ? '...' : 'Zapłać'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
             !loading && activeRentals.length === 0 && <div className="text-center py-20 text-gray-400">Brak historii płatności.</div>
        )}

      </div>
    </div>
  );
};

export default Payments;