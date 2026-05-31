import React, { useState } from 'react';

const Contact = () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // Walidacja
    if (!formData.full_name || !formData.email || !formData.message) {
        alert("Wypełnij wymagane pola!");
        setLoading(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/contact-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: formData.full_name,
                email: formData.email,
                subject: formData.subject,
                message: formData.message
            })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload?.error || 'Nie udało się wysłać wiadomości');
        }

        // Sukces
        setSuccess(true);
        setFormData({ full_name: '', email: '', subject: '', message: '' }); // Wyczyść formularz
        // alert("Wiadomość wysłana pomyślnie! 🚀"); 

    } catch (error) {
        console.error("Błąd wysyłania:", error);
        alert(`Wystąpił błąd podczas wysyłania wiadomości: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        
        {/* NAGŁÓWEK */}
        <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Skontaktuj się z nami</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
                Masz pytania dotyczące oferty? Chcesz zgłosić problem techniczny? Jesteśmy do Twojej dyspozycji od poniedziałku do piątku w godzinach 8:00 - 18:00.
            </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            
            {/* LEWA KOLUMNA: DANE KONTAKTOWE (Karty) */}
            <div className="md:col-span-1 space-y-6">
                
                {/* Biuro */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 shrink-0">
                        📍
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Biuro Główne</h3>
                        <p className="text-sm text-gray-500 mt-1">ul. Rynek 12/4 <br/> 35-001 Rzeszów <br/> Polska</p>
                    </div>
                </div>

                {/* Telefon */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                        📞
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Telefon</h3>
                        <p className="text-sm text-gray-500 mt-1">Pn-Pt, 8:00 - 18:00</p>
                        <p className="text-green-600 font-bold mt-1">+48 123 456 789</p>
                    </div>
                </div>

                {/* Email */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                        ✉️
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Email</h3>
                        <p className="text-sm text-gray-500 mt-1">Odpowiadamy w 24h</p>
                        <p className="text-purple-600 font-bold mt-1">kontakt@flatly.pl</p>
                    </div>
                </div>

            </div>

            {/* PRAWA KOLUMNA: FORMULARZ */}
            <div className="md:col-span-2">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold mb-6">Napisz wiadomość</h2>
                    
                    {success ? (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-xl text-center animate-fade-in-up">
                            <div className="text-4xl mb-2">✅</div>
                            <h3 className="font-bold text-lg">Wiadomość wysłana!</h3>
                            <p>Dziękujemy za kontakt. Odpowiemy najszybciej jak to możliwe.</p>
                            <button onClick={() => setSuccess(false)} className="mt-4 text-sm font-bold underline hover:text-green-900">Wyślij kolejną</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Imię i Nazwisko</label>
                                    <input 
                                        type="text" 
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition outline-none"
                                        placeholder="Jan Kowalski"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Adres Email</label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition outline-none"
                                        placeholder="jan@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Temat</label>
                                <select 
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition outline-none"
                                >
                                    <option value="">Wybierz temat...</option>
                                    <option value="offer">Zapytanie o ofertę</option>
                                    <option value="tech">Problem techniczny</option>
                                    <option value="collab">Współpraca</option>
                                    <option value="other">Inne</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Wiadomość</label>
                                <textarea 
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows="5"
                                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition outline-none resize-none"
                                    placeholder="W czym możemy Ci pomóc?"
                                    required
                                ></textarea>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition transform hover:-translate-y-0.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Wysyłanie...' : 'Wyślij wiadomość'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;