import React from 'react';

const PropertyCard = ({ offer }) => {

  // 1. Cena
  const rawPrice = offer.price_per_month || offer.price; 
  const displayPrice = rawPrice 
    ? `${Number(rawPrice).toLocaleString()} zł` 
    : 'Zapytaj o cenę';

  // 2. Pierwsze zdjęcie
  const mainImage = offer.property_images?.[0]?.image_url || null;

  // 3. Dane techniczne
  const surface = offer.surface_area || offer.surface || '-';
  const rooms = offer.rooms || '-';
  const city = offer.address_city || offer.city || 'Lokalizacja nieznana';

  // 4. Sprawdzamy czy to sprzedaż
  const isSale = offer.type === 'sale';

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white cursor-pointer group flex flex-col h-full">
      
      <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={offer.title || 'Oferta'} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          />
        ) : (
          <span className="text-4xl text-gray-400">★</span> 
        )}
        
        {/* --- TUTAJ ZMIANA FLAGI --- */}
        <div className={`absolute top-2 left-2 text-white text-[10px] px-2 py-1 rounded uppercase font-bold shadow-sm backdrop-blur-sm ${isSale ? 'bg-red-600/90' : 'bg-black/70'}`}>
            {isSale ? 'SPRZEDAŻ' : 'WYNAJEM'}
        </div>
        {/* -------------------------- */}

      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">
            {offer.title || 'Brak tytułu'}
        </h3>
        
        {/* Cena z warunkiem /mc */}
        <span className="font-bold text-slate-900 text-xl">
            {Number(offer.price_per_month).toLocaleString('pl-PL')} zł 
            {!isSale ? ' / mc' : ''}
        </span>
        
        <p className="text-gray-500 text-sm mt-2 line-clamp-2 min-h-[40px]">
            {offer.description || 'Brak opisu'}
        </p>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium mt-auto">
            <span className="flex items-center gap-1">
              🏠 {surface} m²
            </span>
            <span className="flex items-center gap-1">
              🛏️ {rooms} pok.
            </span>
            <span className="flex items-center gap-1">
              📍 {city}
            </span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;