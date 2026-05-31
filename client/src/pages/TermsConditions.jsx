import React from 'react';

const TermsConditions = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 border-b pb-4">
                Regulamin
            </h1>
            <p className="text-sm text-gray-400 mb-8">Ostatnia aktualizacja: {new Date().toLocaleDateString()}</p>
            
            <div className="prose prose-slate max-w-none text-gray-600">
                <h3><strong>§1. Postanowienia ogólne</strong></h3>
                <ol>
                    <li>Niniejszy Regulamin określa zasady korzystania z serwisu internetowego <strong>Flatly</strong>, dostępnego pod adresem internetowym flatly.pl.</li>
                    <li>Właścicielem serwisu jest firma "Flatly sp. z o.o." (podmiot fikcyjny na potrzeby projektu) z siedzibą w Rzeszowie.</li>
                    <li>Korzystanie z Serwisu oznacza akceptację niniejszego Regulaminu.</li>
                </ol>
                <br/>
                <h3><strong>§2. Rodzaje i zakres usług</strong></h3>
                <p>Serwis umożliwia Użytkownikom:</p>
                <ul>
                    <li>Przeglądanie ogłoszeń nieruchomości (mieszkania, domy, pokoje).</li>
                    <li>Dodawanie własnych ogłoszeń (dla Właścicieli).</li>
                    <li>Kontaktowanie się z ogłoszeniodawcami za pomocą formularza kontaktowego.</li>
                    <li>Korzystanie z inteligentnego asystenta AI do wyszukiwania ofert.</li>
                </ul>
                <br/>
                <h3><strong>§3. Prawa i obowiązki Użytkownika</strong></h3>
                <ol>
                    <li>Użytkownik zobowiązany jest do korzystania z Serwisu w sposób zgodny z prawem i dobrymi obyczajami.</li>
                    <li>Zabronione jest dostarczanie treści o charakterze bezprawnym, obraźliwym lub naruszającym prawa osób trzecich.</li>
                    <li>Ogłoszeniodawca oświadcza, że posiada prawa do dysponowania nieruchomością opisaną w ogłoszeniu.</li>
                </ol>
                <br/>
                <h3><strong>§4. Odpowiedzialność</strong></h3>
                <p>
                    Administrator dokłada wszelkich starań, aby dane w Serwisie były aktualne, jednak nie ponosi odpowiedzialności za 
                    treść ogłoszeń dodawanych przez Użytkowników oraz za skutki transakcji zawartych między Użytkownikami.
                </p>
                <br/>
                <h3><strong>§5. Postanowienia końcowe</strong></h3>
                <p>
                    W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy Kodeksu Cywilnego.
                    Administrator zastrzega sobie prawo do zmiany Regulaminu.
                </p>
            </div>
        </div>
    </div>
  );
};

export default TermsConditions;