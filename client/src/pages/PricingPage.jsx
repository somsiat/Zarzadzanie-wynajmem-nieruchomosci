import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PricingPage = () => {

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      <main className="flex-grow py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Wybierz swój plan</h1>
            <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
                Flatly to innowacyjny model rozliczeń. Nie płać za samo wystawienie – płać za skuteczność 
                lub wybierz pakiet premium z promocją AI.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                
                {/* PLAN 1: START */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition relative overflow-hidden">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Pakiet Start</h3>
                    <p className="text-gray-500 text-sm mb-6">Dla osób prywatnych</p>
                    <div className="text-4xl font-bold text-slate-900 mb-6">0 zł <span className="text-sm font-normal text-gray-400">/ 30 dni</span></div>
                    
                    <ul className="space-y-3 mb-8 text-sm text-gray-600">
                        <li className="flex gap-2">✅ Emisja ogłoszenia przez 30 dni</li>
                        <li className="flex gap-2">✅ Podstawowe statystyki</li>
                        <li className="flex gap-2">✅ Czat z klientami</li>
                        <li className="flex gap-2 text-gray-400">❌ Promowanie na liście</li>
                    </ul>
                    <button className="w-full py-3 border-2 border-black font-bold rounded-lg hover:bg-black hover:text-white transition">Wybieram Start</button>
                </div>

                {/* PLAN 2: PREMIUM (POLECANY) */}
                <div className="bg-black text-white p-8 rounded-2xl shadow-xl transform scale-105 relative">
                    <div className="absolute top-0 right-0 bg-blue-600 text-xs font-bold px-3 py-1 rounded-bl-lg">POLECANY</div>
                    <h3 className="text-xl font-bold mb-2">Pakiet Smart AI</h3>
                    <p className="text-gray-400 text-sm mb-6">Dla chcących sprzedać szybciej</p>
                    <div className="text-4xl font-bold mb-6">49 zł <span className="text-sm font-normal text-gray-400">/ 30 dni</span></div>
                    
                    <ul className="space-y-3 mb-8 text-sm text-gray-300">
                        <li className="flex gap-2">✅ Wszystko z pakietu Start</li>
                        <li className="flex gap-2">✨ <strong>3x Podbicie</strong> na górę listy</li>
                        <li className="flex gap-2">✨ <strong>Opis generowany przez AI</strong></li>
                        <li className="flex gap-2">✨ Wyróżnienie kolorem</li>
                    </ul>
                    <button className="w-full py-3 bg-blue-600 font-bold rounded-lg hover:bg-blue-700 transition">Wybieram Smart</button>
                </div>

                {/* PLAN 3: PRO */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Pakiet PRO</h3>
                    <p className="text-gray-500 text-sm mb-6">Dla biur i deweloperów</p>
                    <div className="text-4xl font-bold text-slate-900 mb-6">199 zł <span className="text-sm font-normal text-gray-400">/ mc</span></div>
                    
                    <ul className="space-y-3 mb-8 text-sm text-gray-600">
                        <li className="flex gap-2">✅ Nielimitowane ogłoszenia</li>
                        <li className="flex gap-2">✅ Automatyczny import (XML)</li>
                        <li className="flex gap-2">✅ Branding firmy w ogłoszeniach</li>
                        <li className="flex gap-2">✅ Dedykowany opiekun</li>
                    </ul>
                    <button className="w-full py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-lg hover:border-black hover:text-black transition">Kontakt z Działem Sprzedaży</button>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;