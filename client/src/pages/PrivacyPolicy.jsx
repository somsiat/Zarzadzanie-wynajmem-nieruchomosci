import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 border-b pb-4">
                Polityka prywatności
            </h1>
            <p className="text-sm text-gray-400 mb-8">Ostatnia aktualizacja: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-slate max-w-none text-gray-600">
                <h3>1. Administrator danych</h3>
                <p>
                    Administratorem Twoich danych osobowych jest <strong>Flatly Sp. z o.o.</strong>. 
                    Dbamy o Twoją prywatność i nie udostępniamy danych podmiotom trzecim bez Twojej wyraźnej zgody, 
                    chyba że jest to wymagane przez prawo.
                </p>
                <br/>
                <h3>2. Jakie dane zbieramy?</h3>
                <p>W ramach korzystania z serwisu możemy przetwarzać następujące dane:</p>
                <ul>
                    <li><strong>Dane rejestracyjne:</strong> adres e-mail, imię i nazwisko (niezbędne do założenia konta).</li>
                    <li><strong>Dane kontaktowe:</strong> numer telefonu (podawany dobrowolnie w ogłoszeniu).</li>
                    <li><strong>Dane techniczne:</strong> adres IP, typ przeglądarki, system operacyjny.</li>
                </ul>
                <br/>
                <h3>3. Pliki cookies (Ciasteczka)</h3>
                <p>Nasz serwis wykorzystuje pliki cookies w celu:</p>
                <ul>
                    <li>Utrzymania sesji zalogowanego Użytkownika (żebyś nie musiał logować się na każdej podstronie).</li>
                    <li>Zapamiętywania preferencji wyszukiwania (filtry lokalizacji, ceny).</li>
                    <li>Zbierania anonimowych statystyk odwiedzin (Google Analytics).</li>
                </ul>
                <p>
                    Możesz w każdej chwili wyłączyć obsługę cookies w ustawieniach swojej przeglądarki, jednak może to wpłynąć na funkcjonalność serwisu.
                </p>
                <br/>
                <h3>4. Logi serwera</h3>
                <p>
                    Informacje o niektórych zachowaniach użytkowników podlegają logowaniu w warstwie serwerowej. 
                    Dane te są wykorzystywane wyłącznie w celu administrowania serwisem oraz w celu zapewnienia jak najbardziej sprawnej obsługi świadczonych usług hostingowych.
                </p>
            </div>
        </div>
    </div>
  );
};

export default PrivacyPolicy;