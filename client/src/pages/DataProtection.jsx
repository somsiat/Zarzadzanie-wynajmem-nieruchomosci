import React from 'react';

const DataProtection = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-slate-900 mb-2 border-b pb-4">
                Ochrona danych osobowych (RODO)
            </h1>
            <p className="text-sm text-gray-400 mb-8">Obowiązek informacyjny zgodnie z art. 13 RODO.</p>
            
            <div className="prose prose-slate max-w-none text-gray-600">
                <h3><strong>1. Twoje prawa</strong></h3>
                <p>Zgodnie z rozporządzeniem o ochronie danych osobowych (RODO) przysługuje Ci prawo do:</p>
                <ul>
                    <li>- Dostępu do treści swoich danych oraz ich sprostowania.</li>
                    <li>- Usunięcia danych ("prawo do bycia zapomnianym").</li>
                    <li>- Ograniczenia przetwarzania.</li>
                    <li>- Przenoszenia danych.</li>
                    <li>- Wniesienia sprzeciwu wobec przetwarzania.</li>
                </ul>
                <br />
                <h3><strong>2. Cel przetwarzania</strong></h3>
                <p>Twoje dane przetwarzamy w celach:</p>
                <ul>
                    <li>Realizacji umowy o świadczenie usług drogą elektroniczną (utrzymanie konta).</li>
                    <li>Umożliwienia kontaktu między Najemcą a Wynajmującym.</li>
                    <li>Marketingowych (tylko za Twoją wyraźną zgodą, np. newsletter).</li>
                </ul>
                <br />
                <h3><strong>3. Bezpieczeństwo danych</strong></h3>
                <p>
                    Stosujemy szyfrowanie połączenia (certyfikat SSL) oraz bezpieczne metody przechowywania haseł w bazie danych (Supabase Auth). 
                    Dostęp do danych mają tylko upoważnieni pracownicy serwisu.
                </p>
                <br />
                <h3><strong>4. Kontakt z inspektorem ochrony danych</strong></h3>
                <p>
                    W sprawach związanych z przetwarzaniem Twoich danych osobowych możesz skontaktować się z nami mailowo:
                    <br/>
                    <strong>iod@flatly.pl</strong>
                </p>
            </div>
        </div>
    </div>
  );
};

export default DataProtection;