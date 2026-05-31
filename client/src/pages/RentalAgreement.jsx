import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

const RentalAgreement = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Zarządzanie okresem najmu
  const [editingPeriod, setEditingPeriod] = useState(false);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  const [savingPeriod, setSavingPeriod] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [id, user]);

  const fetchBookingDetails = async () => {
    const { data: bookingData, error } = await supabase
      .from('bookings')
      .select(`
        *,
        properties (
            id, title, address_city, address_street, 
            price_per_month, admin_fee, security_deposit, 
            owner_id, type
        ),
        profiles (full_name, email) 
      `)
      .eq('id', id)
      .single();

    if (error) {
        console.error("Błąd:", error);
        setLoading(false);
        return;
    }

    setBooking(bookingData);

    if (bookingData?.properties?.owner_id) {
        const { data: ownerData } = await supabase
            .from('profiles')
            .select('full_name, email, phone_number')
            .eq('id', bookingData.properties.owner_id)
            .single();
        if (ownerData) setOwnerProfile(ownerData);
    }
    setLoading(false);
  };

  // Ustaw domyślne wartości pól po załadowaniu rezerwacji
  useEffect(() => {
    if (booking) {
      setStartDateInput(booking.start_date || '');
      setEndDateInput(booking.end_date || '');
      setNoEndDate(!booking.end_date);
    }
  }, [booking]);

  // --- AUTOMATYCZNE GENEROWANIE RACHUNKU ---
  const generateFirstPayment = async (bookingData) => {
    const prop = bookingData.properties;
    const rent = Number(prop.price_per_month) || 0;
    const media = Number(prop.admin_fee) || 0;
    const totalAmount = rent + media;

    const monthName = new Date().toLocaleString('pl-PL', { month: 'long' });
    const year = new Date().getFullYear();
    
    const details = {
        rent: rent,
        media: media,
        penalty: 0,
        note: 'Pierwszy czynsz po podpisaniu umowy'
    };

    const { error } = await supabase.from('payments').insert([{
        booking_id: bookingData.id,
        tenant_id: bookingData.tenant_id,
        owner_id: prop.owner_id,
        title: `Czynsz + Media (${monthName} ${year})`,
        amount: totalAmount,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        status: 'pending',
        details: details 
    }]);

    if (error) console.error("Błąd generowania rachunku:", error);
  };

  const handleSignLease = async () => {
    if (!booking || !user) return;
    const isTenant = user.id === booking.tenant_id;
    const isOwner = user.id === booking.properties.owner_id;

    if (!isTenant && !isOwner) {
        alert("Nie jesteś stroną tej umowy.");
        return;
    }

    const updateData = {};
    if (isTenant) updateData.tenant_signature = true;
    if (isOwner) updateData.owner_signature = true;

    try {
        const { error: signError } = await supabase.from('bookings').update(updateData).eq('id', id);
        if (signError) throw signError;

        const { data: freshBooking } = await supabase.from('bookings').select('tenant_signature, owner_signature').eq('id', id).single();

        if (freshBooking.tenant_signature && freshBooking.owner_signature) {
            
            // 1. Zmień status umowy na PODPISANA
            await supabase.from('bookings').update({ status: 'signed' }).eq('id', id);
            
            // 2. LOGIKA PŁATNOŚCI (Tylko dla wynajmu!)
            if (booking.properties.type === 'rent') {
                await generateFirstPayment(booking);
                alert("Gratulacje! Umowa Najmu podpisana. Wygenerowano pierwszy rachunek.");
            } else {
                alert("Gratulacje! Umowa Sprzedaży podpisana. Transakcja zakończona.");
            }
            
        } else {
            alert("Podpisano pomyślnie. Czekamy na drugą stronę.");
        }
        fetchBookingDetails();
    } catch (error) {
        alert('Błąd: ' + error.message);
    }
  };

  const handlePrint = () => window.print();

  // Zapis okresu najmu przez właściciela
  const handleSavePeriod = async () => {
    if (!booking || !user) return;

    const prop = booking.properties;
    const isOwner = user.id === prop.owner_id;

    if (!isOwner) {
      alert('Tylko właściciel może edytować okres trwania najmu.');
      return;
    }

    if (!startDateInput) {
      alert('Podaj datę rozpoczęcia najmu.');
      return;
    }

    if (!noEndDate && !endDateInput) {
      alert('Podaj datę zakończenia najmu lub zaznacz „bezterminowo”.');
      return;
    }

    try {
      setSavingPeriod(true);

      const updatePayload = {
        start_date: startDateInput || null,
        end_date: noEndDate ? null : (endDateInput || null),
      };

      const { error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;

      alert('Okres trwania najmu został zapisany.');
      setEditingPeriod(false);
      fetchBookingDetails();
    } catch (error) {
      alert('Błąd zapisu okresu najmu: ' + error.message);
    } finally {
      setSavingPeriod(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Ładowanie...</div>;
  if (!booking) return <div className="text-center py-20">Brak umowy.</div>;

  const prop = booking.properties;
  const isOwner = user?.id === prop.owner_id;
  const isTenant = user?.id === booking.tenant_id;
  const ownerDisplayName = ownerProfile?.full_name || ownerProfile?.email || "Właściciel";
  const tenantDisplayName = booking.profiles?.full_name || booking.profiles?.email || "Klient";
  
  const tenantSigned = booking.tenant_signature;
  const ownerSigned = booking.owner_signature;
  const isFullySigned = booking.status === 'signed';
  const isSale = prop.type === 'sale'; // Czy to sprzedaż?

  // DYNAMICZNE DATY POBIERANE Z BAZY DANYCH
  const startDateFormatted = booking.start_date 
    ? new Date(booking.start_date).toLocaleDateString('pl-PL') 
    : new Date().toLocaleDateString('pl-PL');

  const endDateFormatted = booking.end_date 
    ? new Date(booking.end_date).toLocaleDateString('pl-PL') 
    : "nieustalono";

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 font-sans text-slate-800 print:bg-white print:p-0 print:m-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .no-print { display: none !important; }
          .print-break-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-[210mm] mx-auto bg-white shadow-xl rounded-sm overflow-hidden border border-gray-200 print:shadow-none print:border-none print:max-w-none print:w-full">
        
        {/* NAGŁÓWEK */}
        <div className="bg-slate-50 p-10 border-b border-gray-200 text-center print:bg-white print:border-b-2 print:border-black print:p-4">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                {isSale ? 'UMOWA KUPNA-SPRZEDAŻY' : 'UMOWA NAJMU LOKALU'}
            </h1>
            <div className="flex justify-center gap-4 text-sm text-gray-500 uppercase tracking-widest mt-4 print:text-black">
                <span>Nr: {booking.id.slice(0, 8)}</span>
                <span>•</span>
                <span>Rzeszów, {startDateFormatted}</span>
            </div>
            
            {/* PRZYCISK DO PŁATNOŚCI - TYLKO DLA WYNAJMU */}
            {isFullySigned && !isSale && (
                <div className="mt-6 no-print animate-fade-in-up">
                    <Link to="/platnosci" className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-emerald-700 transition transform hover:-translate-y-0.5">
                        💳 Przejdź do płatności &rarr;
                    </Link>
                </div>
            )}
            {isFullySigned && isSale && (
                <div className="mt-6 no-print animate-fade-in-up">
                    <div className="inline-block bg-gray-100 text-gray-600 px-6 py-2 rounded-full font-bold border border-gray-300">
                        ✅ Transakcja sfinalizowana
                    </div>
                </div>
            )}
        </div>

        <div className="p-10 md:p-16 space-y-8 leading-relaxed print:p-4 print:space-y-4 print:text-sm">
            
            <div className="text-right no-print">
                <button onClick={handlePrint} className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-2 ml-auto">
                    🖨️ Drukuj / Pobierz PDF
                </button>
            </div>

            {/* §1. STRONY UMOWY */}
            <section className="print-break-avoid">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2 print:text-black print:border-black">§1. Strony Umowy</h3>
                <div className="grid md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 print:bg-white print:border-black print:border print:p-3">
                        <strong className="block text-xs uppercase text-gray-400 mb-1 print:text-black">{isSale ? 'Sprzedający' : 'Wynajmujący'}</strong>
                        <div className="text-lg font-bold">{ownerDisplayName}</div>
                        <div className="text-xs text-gray-400 print:text-black mt-1">{ownerProfile?.email} <br/> {ownerProfile?.phone_number}</div>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 print:bg-white print:border-black print:border print:p-3">
                        <strong className="block text-xs uppercase text-gray-400 mb-1 print:text-black">{isSale ? 'Kupujący' : 'Najemca'}</strong>
                        <div className="text-lg font-bold">{tenantDisplayName}</div>
                        <div className="text-xs text-gray-400 print:text-black mt-1">{booking.profiles?.email}</div>
                    </div>
                </div>
            </section>

            {/* §2. PRZEDMIOT I CZAS TRWANIA */}
            <section className="print-break-avoid">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2 print:text-black print:border-black">
                    {isSale ? '§2. Przedmiot Umowy' : '§2. Przedmiot i Czas Trwania'}
                </h3>
                <p>Przedmiotem {isSale ? 'sprzedaży' : 'najmu'} jest lokal położony w: <strong>{prop.address_city}, {prop.address_street || 'ulica nieznana'}</strong>.</p>
                
                {!isSale ? (
                    <>
                        <p className="mt-4">
                            Umowa zawarta na czas oznaczony od dnia <strong>{startDateFormatted}</strong> do dnia <strong>{endDateFormatted}</strong>.
                        </p>

                        {/* Formularz ustawienia okresu najmu dla właściciela (tylko przed pełnym podpisaniem) */}
                        {isOwner && !isFullySigned && (
                          <div className="mt-6 no-print border border-gray-200 rounded-lg p-4 bg-gray-50">
                            {!editingPeriod ? (
                              <button
                                onClick={() => setEditingPeriod(true)}
                                className="text-sm font-bold text-blue-600 hover:text-blue-800"
                              >
                                ✏️ Ustaw / zmień okres trwania najmu
                              </button>
                            ) : (
                              <div className="space-y-3">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                      Data rozpoczęcia najmu
                                    </label>
                                    <input
                                      type="date"
                                      value={startDateInput || ''}
                                      onChange={(e) => setStartDateInput(e.target.value)}
                                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                      Data zakończenia najmu
                                    </label>
                                    <input
                                      type="date"
                                      value={noEndDate ? '' : (endDateInput || '')}
                                      onChange={(e) => setEndDateInput(e.target.value)}
                                      disabled={noEndDate}
                                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-100"
                                    />
                                  </div>
                                </div>

                                <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={noEndDate}
                                    onChange={(e) => setNoEndDate(e.target.checked)}
                                  />
                                  Umowa bezterminowa (brak daty zakończenia)
                                </label>

                                <div className="flex gap-3 mt-2">
                                  <button
                                    onClick={handleSavePeriod}
                                    disabled={savingPeriod}
                                    className="bg-black text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-gray-800 disabled:opacity-60"
                                  >
                                    {savingPeriod ? 'Zapisywanie...' : 'Zapisz okres najmu'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPeriod(false);
                                      setStartDateInput(booking.start_date || '');
                                      setEndDateInput(booking.end_date || '');
                                      setNoEndDate(!booking.end_date);
                                    }}
                                    className="text-xs font-bold text-gray-500 hover:text-black"
                                  >
                                    Anuluj
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </>
                ) : (
                    <p className="mt-4">Przekazanie własności następuje z chwilą podpisania niniejszej umowy.</p>
                )}
            </section>

            {/* §3. WARUNKI FINANSOWE */}
            <section className="print-break-avoid">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2 print:text-black print:border-black">§3. Warunki Finansowe</h3>
                
                {isSale ? (
                    // WERSJA DLA SPRZEDAŻY
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">Całkowita cena sprzedaży:</p>
                        <p className="text-3xl font-bold text-slate-900">{Number(prop.price_per_month).toLocaleString()} PLN</p>
                        <p className="text-xs text-gray-500 mt-2">* Płatność realizowana poza systemem (przelew bankowy / depozyt notarialny).</p>
                    </div>
                ) : (
                    // WERSJA DLA WYNAJMU
                    <div className="overflow-hidden rounded-xl border border-gray-200 print:border-black">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 print:bg-gray-100 print:text-black">
                                <tr>
                                    <th className="px-6 py-3 font-medium print:py-2">Składnik opłaty</th>
                                    <th className="px-6 py-3 font-medium text-right print:py-2">Kwota (miesięcznie)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 print:divide-black">
                                <tr>
                                    <td className="px-6 py-4 print:py-2">Czynsz najmu</td>
                                    <td className="px-6 py-4 text-right font-bold print:py-2">{prop.price_per_month} PLN</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 print:py-2">Media i opłaty admin.</td>
                                    <td className="px-6 py-4 text-right print:py-2">{prop.admin_fee || 0} PLN</td>
                                </tr>
                                <tr className="bg-blue-50/50 print:bg-white">
                                    <td className="px-6 py-4 font-bold text-slate-900 print:py-2">ŁĄCZNIE DO ZAPŁATY</td>
                                    <td className="px-6 py-4 text-right font-bold text-blue-700 text-lg print:text-black print:py-2">
                                        {Number(prop.price_per_month) + Number(prop.admin_fee || 0)} PLN
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="mt-4 flex items-center justify-between bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-yellow-800 text-sm mx-4 mb-4 print:bg-white print:border-black print:text-black print:py-2 print:mx-0">
                            <strong>Kaucja zwrotna (jednorazowa):</strong>
                            <span className="font-bold text-lg">{prop.security_deposit || 0} PLN</span>
                        </div>
                    </div>
                )}
            </section>
        </div>

        {/* PODPISY */}
        <div className="bg-slate-50 p-10 border-t border-gray-200 print:bg-white print:border-none print:pt-4 print:mt-4 print-break-avoid">
            <h3 className="text-center font-bold uppercase text-gray-400 text-xs mb-8 tracking-widest print:text-black">Podpisy Elektroniczne</h3>
            
            <div className="grid grid-cols-2 gap-8 print:gap-4">
                <div className="text-center">
                    <div className="text-xs uppercase font-bold text-gray-400 mb-2 print:text-black">{isSale ? 'Sprzedający' : 'Wynajmujący'}</div>
                    {ownerSigned ? (
                        <div className="text-green-700 font-bold text-lg border-2 border-green-600 bg-green-50 p-4 rounded-lg print:border-black print:text-black print:bg-white print:p-2 print:text-sm">
                           ✓ Zatwierdzono cyfrowo <br/>
                           <span className="text-xs font-normal text-gray-600 print:text-black">{ownerDisplayName}</span>
                        </div>
                    ) : (
                        <div className="print:hidden">
                            {isOwner && <button onClick={handleSignLease} className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition">Podpisz jako Właściciel</button>}
                            {!isOwner && <span className="text-xs text-gray-400 italic">Oczekiwanie...</span>}
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <div className="text-xs uppercase font-bold text-gray-400 mb-2 print:text-black">{isSale ? 'Kupujący' : 'Najemca'}</div>
                    {tenantSigned ? (
                        <div className="text-green-700 font-bold text-lg border-2 border-green-600 bg-green-50 p-4 rounded-lg print:border-black print:text-black print:bg-white print:p-2 print:text-sm">
                           ✓ Zatwierdzono cyfrowo <br/>
                           <span className="text-xs font-normal text-gray-600 print:text-black">{tenantDisplayName}</span>
                        </div>
                    ) : (
                        <div className="print:hidden">
                            {isTenant && <button onClick={handleSignLease} className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition">Podpisz jako {isSale ? 'Kupujący' : 'Najemca'}</button>}
                            {!isTenant && <span className="text-xs text-gray-400 italic">Oczekiwanie...</span>}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-10 text-center no-print">
                <Link to="/dashboard" className="text-gray-500 hover:text-black font-medium text-sm transition">&larr; Wróć do panelu</Link>
            </div>
        </div>

      </div>
    </div>
  );
};

export default RentalAgreement;