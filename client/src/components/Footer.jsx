import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-gray-300 py-16 mt-auto">
      <div className="container mx-auto px-4">
        
        {/* GÓRNA CZĘŚĆ STOPKI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* KOLUMNA 1: O FIRMIE */}
          <div>
            <div className="flex items-center gap-2 mb-6">
               <div className="w-6 h-6 bg-white rounded-sm"></div>
               <span className="font-bold text-xl text-white">Flatly</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Nowoczesna platforma łącząca najemców, właścicieli i deweloperów. 
              Dbamy o to, aby proces szukania domu był prostszy i bezpieczniejszy.
            </p>
          </div>

          {/* KOLUMNA 2: NIERUCHOMOŚCI */}
          <div>
            <h4 className="text-white font-bold mb-4">Nieruchomości</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/oferty?category=apartment&type=rent" className="hover:text-white transition">Mieszkania na wynajem</Link></li>
              <li><Link to="/oferty?category=apartment&type=sale" className="hover:text-white transition">Mieszkania na sprzedaż</Link></li>
              <li><Link to="/oferty?category=house&type=rent" className="hover:text-white transition">Domy na wynajem</Link></li>
              <li><Link to="/oferty?category=house&type=sale" className="hover:text-white transition">Domy na sprzedaż</Link></li>
              <li><Link to="/oferty?category=room&type=rent" className="hover:text-white transition">Pokoje</Link></li>
            </ul>
          </div>

          {/* KOLUMNA 3: LOKALIZACJE*/}
          <div>
            <h4 className="text-white font-bold mb-4">Popularne Lokalizacje</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/oferty?city=Warszawa" className="hover:text-white transition">Warszawa</a></li>
              <li><a href="/oferty?city=Kraków" className="hover:text-white transition">Kraków</a></li>
              <li><a href="/oferty?city=Wrocław" className="hover:text-white transition">Wrocław</a></li>
              <li><a href="/oferty?city=Gdańsk" className="hover:text-white transition">Gdańsk</a></li>
              <li><a href="/oferty?city=Poznań" className="hover:text-white transition">Poznań</a></li>
              <li><a href="/oferty?city=Łódź" className="hover:text-white transition">Łódź</a></li>
            </ul>
          </div>

          {/* KOLUMNA 4: DLA KLIENTA, CENNIK */}
          <div>
            <h4 className="text-white font-bold mb-4">Usługi i Pomoc</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/cennik" className="text-blue-400 hover:text-blue-300 font-bold transition">Cennik i Pakiety</Link></li>
              <li><a href="#" className="hover:text-white transition">Dla deweloperów</a></li>
              <li><a href="#" className="hover:text-white transition">Dla biur nieruchomości</a></li>
              <li><a href="#" className="hover:text-white transition">Blog i porady</a></li>
              <li className="pt-4"><a href="/kontakt" className="hover:text-white transition">Kontakt / Pomoc</a></li>
            </ul>
          </div>
        </div>

        {/* DOLNA CZĘŚĆ STOPKI*/}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <div className="flex gap-6 mb-4 md:mb-0">
             <a href="/regulamin" className="hover:text-white transition">Regulamin</a>
             <a href="/polityka-prywatnosci" className="hover:text-white transition">Polityka prywatności</a>
             <a href="/ochrona-danych" className="hover:text-white transition">Ochrona danych</a>
          </div>
          <div>
            &copy; 2026 Flatly Wszelkie prawa zastrzeżone.
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;