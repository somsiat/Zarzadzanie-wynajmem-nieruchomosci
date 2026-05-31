import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const AMENITIES_OPTIONS = [
  'Winda', 'Balkon', 'Garaż', 'Ogródek', 'Klimatyzacja', 
  'Internet', 'Telewizja kablowa', 'Ochrona', 'Monitoring', 
  'Zmywarka', 'Pralka', 'Meble'
];

const AddProperty = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Tablica plików File
  const [images, setImages] = useState([]);

  const [formData, setFormData] = useState({
    title: '', description: '', price_per_month: '',
    admin_fee: '', security_deposit: '',
    address_city: '', address_street: '', surface_area: '',
    rooms: '', floor: '', build_year: '',
    type: 'rent', category: 'apartment', 
    contact_phone: '', contact_email: user?.email || '',
    amenities: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (item) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(item);
      return exists 
        ? { ...prev, amenities: prev.amenities.filter(i => i !== item) }
        : { ...prev, amenities: [...prev.amenities, item] };
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
        // Dodajemy nowe pliki, tworząc unikalne ID dla każdego (potrzebne do drag&drop)
        const newFiles = Array.from(e.target.files).map(file => ({
            file: file,
            id: URL.createObjectURL(file), // Używamy tymczasowego URL jako unikalnego ID
            previewUrl: URL.createObjectURL(file)
        }));
        setImages(prev => [...prev, ...newFiles]);
    }
  };

  // --- OBSŁUGA UPUSZCZENIA (DRAG END) ---
  const handleOnDragEnd = (result) => {
    if (!result.destination) return; // Upuszczono poza listą

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setImages(items);
  };

  const removeImage = (idToRemove) => {
    setImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Musisz być zalogowany!");
    setLoading(true);

    try {
      // 1. Dodaj ofertę
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .insert([{
            owner_id: user.id,
            title: formData.title, description: formData.description,
            price_per_month: parseFloat(formData.price_per_month),
            admin_fee: formData.admin_fee ? parseFloat(formData.admin_fee) : 0,
            security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : 0,
            address_city: formData.address_city, address_street: formData.address_street,
            surface_area: formData.surface_area ? parseFloat(formData.surface_area) : null,
            rooms: formData.rooms ? parseInt(formData.rooms) : null,
            floor: formData.floor ? parseInt(formData.floor) : null,
            build_year: formData.build_year ? parseInt(formData.build_year) : null,
            type: formData.type, category: formData.category,
            contact_phone: formData.contact_phone, contact_email: formData.contact_email,
            amenities: formData.amenities
        }])
        .select().single();

      if (propertyError) throw propertyError;
      const propertyId = propertyData.id;

      // 2. Wyślij zdjęcia (Z KOLEJNOŚCIĄ Z TABLICY)
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const fileObj = images[i]; // Teraz to obiekt {file, id, previewUrl}
          const file = fileObj.file;
          const fileExt = file.name.split('.').pop();
          const fileName = `${propertyId}/${Math.random()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage.from('property-images').upload(fileName, file);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(fileName);

          await supabase.from('property_images').insert({ 
                property_id: propertyId, 
                image_url: publicUrl,
                display_order: i // <--- KLUCZOWE: Zapisujemy indeks pętli jako kolejność
            });
        }
      }

      alert("Ogłoszenie dodane pomyślnie!");
      navigate('/dashboard');

    } catch (error) {
      console.error("Błąd:", error);
      alert("Wystąpił błąd: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-10 text-center no-print">
        <Link to="/dashboard" className="text-gray-500 hover:text-black font-medium text-sm transition">&larr; Wróć do panelu</Link>
      </div>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-3xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold mb-8 text-slate-900">Dodaj nowe ogłoszenie</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
           {/* SEKCJA 1: PODSTAWOWE (Bez zmian) */}
           <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">Informacje podstawowe</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input required name="title" value={formData.title} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Tytuł ogłoszenia" />
               <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50">
                 <option value="rent">Wynajem</option>
                 <option value="sale">Sprzedaż</option>
               </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <select name="category" value={formData.category} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50">
                 <option value="apartment">Mieszkanie</option>
                 <option value="house">Dom</option>
                 <option value="room">Pokój</option>
                 <option value="plot">Działka</option>
               </select>
               <textarea required name="description" value={formData.description} onChange={handleChange} rows="1" className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Opis..." />
            </div>
          </div>

          {/* SEKCJA 2: FINANSE (Bez zmian) */}
          <div className="space-y-4 bg-blue-50 p-6 rounded-xl border border-blue-100">
             <h3 className="font-bold text-blue-900 border-b border-blue-200 pb-2">Finanse</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input required name="price_per_month" value={formData.price_per_month} onChange={handleChange} type="number" className="w-full p-2 border border-blue-200 rounded" placeholder={formData.type === 'rent' ? 'Czynsz' : 'Wartość nieruchomości'} />
                {formData.type === 'rent' && (
                  <>
                    <input name="admin_fee" value={formData.admin_fee} onChange={handleChange} type="number" className="w-full p-2 border border-blue-200 rounded" placeholder="Czynsz admin." />
                    <input name="security_deposit" value={formData.security_deposit} onChange={handleChange} type="number" className="w-full p-2 border border-blue-200 rounded" placeholder="Kaucja" />
                  </>
                )}
             </div>
          </div>

          {/* SEKCJA 3: SZCZEGÓŁY (Bez zmian) */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">Szczegóły</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input required name="address_city" value={formData.address_city} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Miasto" />
               <input required name="address_street" value={formData.address_street} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Ulica" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <input name="surface_area" value={formData.surface_area} onChange={handleChange} type="number" className="w-full p-3 border rounded-lg bg-gray-50" placeholder="m²" />
               <input name="rooms" value={formData.rooms} onChange={handleChange} type="number" className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Pokoje" />
               <input name="floor" value={formData.floor} onChange={handleChange} type="number" className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Piętro" />
               <input name="build_year" value={formData.build_year} onChange={handleChange} type="number" className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Rok" />
            </div>
          </div>

          {/* SEKCJA 4: ZDJĘCIA (DRAG & DROP) */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">Zdjęcia</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition relative mb-4">
              <input type="file" onChange={handleImageChange} multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="text-gray-500">Kliknij lub upuść tutaj, aby <span className="font-bold text-blue-600">dodać zdjęcia</span></div>
            </div>
            
            {/* DRAG & DROP */}
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="images-list" direction="horizontal">
                    {(provided) => (
                        <div 
                            {...provided.droppableProps} 
                            ref={provided.innerRef} 
                            className="grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                            {images.map((imgObj, index) => (
                                <Draggable key={imgObj.id} draggableId={imgObj.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`relative group rounded-lg overflow-hidden border bg-gray-100 ${snapshot.isDragging ? 'border-blue-500 shadow-lg scale-105 z-50' : 'border-gray-200'}`}
                                            style={{ ...provided.draggableProps.style }}
                                        >
                                            <div className="aspect-square">
                                                <img src={imgObj.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                            
                                            {/* Przycisk USUŃ */}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(imgObj.id)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>

                                            {/* Numer w kolejności */}
                                            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                                #{index + 1}
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

          </div>

           {/* SEKCJA 5: UDOGODNIENIA  */}
           <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">Udogodnienia</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AMENITIES_OPTIONS.map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer bg-white border p-3 rounded-lg hover:bg-gray-50">
                  <input type="checkbox" checked={formData.amenities.includes(item)} onChange={() => handleCheckbox(item)} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* SEKCJA 6: KONTAKT (Bez zmian) */}
          <div className="space-y-4">
             <h3 className="font-bold text-lg border-b pb-2">Kontakt</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input required name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Telefon" />
               <input required name="contact_email" value={formData.contact_email} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50" placeholder="Email" />
             </div>
          </div>

          <div className="pt-6">
            <button type="submit" disabled={loading} className={`w-full py-4 text-white font-bold rounded-xl text-lg shadow-lg transition transform hover:-translate-y-1 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}`}>
              {loading ? 'Publikowanie...' : 'Opublikuj Ogłoszenie'}
            </button>
          </div>

        </form>
      </div>
    </div>
    </>
  );
};

export default AddProperty;