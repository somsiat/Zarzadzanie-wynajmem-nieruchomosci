import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const AMENITIES_OPTIONS = [
  'Winda', 'Balkon', 'Garaż', 'Ogródek', 'Klimatyzacja', 
  'Internet', 'Telewizja kablowa', 'Ochrona', 'Monitoring', 
  'Zmywarka', 'Pralka', 'Meble'
];

const EditProperty = () => {

  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // GŁÓWNY STAN ZDJĘĆ (Zarówno stare URL jak i nowe Pliki)
  const [allImages, setAllImages] = useState([]); 

  // Stan formularza
  const [formData, setFormData] = useState({
    title: '', description: '', price_per_month: '',
    admin_fee: '', security_deposit: '',
    address_city: '', address_street: '', surface_area: '',
    rooms: '', floor: '', build_year: '',
    type: 'rent', category: 'apartment', heating_type: '',
    contact_phone: '', contact_email: '', amenities: []
  });

  // 1. Pobierz dane
  useEffect(() => {
    const fetchOffer = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, property_images(*)')
        .eq('id', id)
        .single();

      if (error) {
        alert("Błąd pobierania oferty");
        navigate('/dashboard');
      } else {
        const isOwner = user && data.owner_id === user.id;
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        const admin = profile?.is_admin ?? false;
        setIsAdmin(admin);
        if (!isOwner && !admin) {
            alert("Nie masz uprawnień.");
            navigate('/dashboard');
            return;
        }
        setFormData(data);
        
        // Sortujemy istniejące zdjęcia wg display_order
        const images = (data.property_images || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        
        // Mapujemy do wspólnego formatu
        setAllImages(images.map(img => ({
          id: `existing-${img.id}`, // Unikalne ID dla Drag&Drop
          image_url: img.image_url,
          previewUrl: img.image_url,
          isExisting: true,
          dbId: img.id
        })));
        setLoading(false);
      }
    };
    if (user) fetchOffer();
  }, [id, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (item) => {
    setFormData(prev => {
        const currentAmenities = prev.amenities || [];
        const exists = currentAmenities.includes(item);
        return exists 
          ? { ...prev, amenities: currentAmenities.filter(i => i !== item) }
          : { ...prev, amenities: [...currentAmenities, item] };
      });
  };

  // --- ZARZĄDZANIE ZDJĘCIAMI ---

  const handleImageChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFileObjects = files.map(file => ({
        file: file, // Obiekt File do wysłania
        id: `new-${Math.random().toString(36).substr(2, 9)}`, // Losowe ID dla Drag&Drop
        previewUrl: URL.createObjectURL(file),
        isExisting: false
      }));
      
      // Dodajemy na koniec listy
      setAllImages(prev => [...prev, ...newFileObjects]);
    }
  };

  // Obsługa drag & drop
  const handleOnDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(allImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setAllImages(items);
  };

  const removeImage = async (idToRemove) => {
    const item = allImages.find(img => img.id === idToRemove);
    
    if (item?.isExisting) {
      if (!window.confirm("Usunąć to zdjęcie trwale z bazy?")) return;
      
      // Usuń z bazy od razu
      const { error } = await supabase.from('property_images').delete().eq('id', item.dbId);
      if (error) {
          alert("Błąd usuwania: " + error.message);
          return;
      }
    }
    
    // Usuń z widoku (zarówno nowe jak i stare)
    setAllImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  // 2. Zapisz zmiany (NAPRAWIONA LOGIKA)
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // A. Aktualizacja tekstu
      const { error } = await supabase
        .from('properties')
        .update({
            title: formData.title,
            description: formData.description,
            price_per_month: formData.price_per_month !== '' && formData.price_per_month != null ? parseFloat(formData.price_per_month) : null,
            admin_fee: formData.type === 'rent' && formData.admin_fee !== '' && formData.admin_fee != null ? parseFloat(formData.admin_fee) : 0,
            security_deposit: formData.type === 'rent' && formData.security_deposit !== '' && formData.security_deposit != null ? parseFloat(formData.security_deposit) : 0,
            address_city: formData.address_city,
            address_street: formData.address_street,
            surface_area: formData.surface_area,
            rooms: formData.rooms,
            floor: formData.floor,
            build_year: formData.build_year,
            type: formData.type,
            category: formData.category,
            heating_type: formData.heating_type,
            contact_phone: formData.contact_phone,
            contact_email: formData.contact_email,
            amenities: formData.amenities
        })
        .eq('id', id);

      if (error) throw error;

      // B. AKTUALIZACJA ZDJĘĆ (KLUCZOWA ZMIANA)
      // Iterujemy po allImages w takiej kolejności, w jakiej są na ekranie!
      
      for (let i = 0; i < allImages.length; i++) {
        const img = allImages[i];

        if (img.isExisting) {
            // STARE ZDJĘCIE: Aktualizujemy tylko jego display_order w bazie
            await supabase
                .from('property_images')
                .update({ display_order: i })
                .eq('id', img.dbId);
        } else {
            // NOWE ZDJĘCIE: Wgrywamy i zapisujemy z obecnym indeksem 'i'
            const file = img.file;
            const fileExt = file.name.split('.').pop();
            const fileName = `${id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(fileName);

            await supabase
                .from('property_images')
                .insert([{ 
                    property_id: id, 
                    image_url: publicUrl, 
                    display_order: i // <--- Tutaj zapisujemy poprawną kolejność!
                }]);
        }
      }

      alert("Zapisano zmiany!");
      navigate(isAdmin ? '/admin' : '/dashboard');
    } catch (error) {
      alert("Błąd zapisu: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20">Ładowanie danych...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-3xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold mb-6">Edytuj ogłoszenie</h1>
        
        <form onSubmit={handleUpdate} className="space-y-8">
            
            {/* --- POLA TEKSTOWE --- */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-bold">Tytuł</label>
                        <input name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                        <label className="text-sm font-bold">{formData.type === 'rent' ? 'Czynsz' : 'Wartość nieruchomości'}</label>
                        <input name="price_per_month" value={formData.price_per_month} onChange={handleChange} type="number" className="w-full p-2 border rounded" />
                    </div>
                </div>
                {formData.type === 'rent' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-bold">Czynsz administracyjny</label>
                        <input name="admin_fee" value={formData.admin_fee ?? ''} onChange={handleChange} type="number" className="w-full p-2 border rounded" placeholder="0" />
                    </div>
                    <div>
                        <label className="text-sm font-bold">Kaucja</label>
                        <input name="security_deposit" value={formData.security_deposit ?? ''} onChange={handleChange} type="number" className="w-full p-2 border rounded" placeholder="0" />
                    </div>
                  </div>
                )}
                <div>
                    <label className="text-sm font-bold">Opis</label>
                    <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>
                {/* ... reszta pól (miasto, ulica itp.) ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="address_city" value={formData.address_city} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Miasto" />
                    <input name="address_street" value={formData.address_street} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Ulica" />
                </div>
            </div>

            {/* SEKCJA 4: ZDJĘCIA (DRAG & DROP) */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">Zdjęcia</h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition relative mb-4">
                    <input type="file" onChange={handleImageChange} multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="text-gray-500">Kliknij, aby <span className="font-bold text-blue-600">dodać nowe zdjęcia</span></div>
                </div>
                
                {allImages.length > 0 && (
                  <DragDropContext onDragEnd={handleOnDragEnd}>
                    <Droppable droppableId="images-list" direction="horizontal">
                      {(provided) => (
                        <div 
                          {...provided.droppableProps} 
                          ref={provided.innerRef} 
                          className="grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                          {allImages.map((imgObj, index) => (
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
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  >
                                    ✕
                                  </button>

                                  {/* Etykieta NOWE */}
                                  {!imgObj.isExisting && (
                                    <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-2 py-1 rounded">NOWE</div>
                                  )}

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
                )}
            </div>

            {/* --- UDOGODNIENIA --- */}
            <div>
                <label className="text-sm font-bold mb-2 block">Udogodnienia</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {AMENITIES_OPTIONS.map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.amenities?.includes(item)} onChange={() => handleCheckbox(item)} />
                    <span className="text-sm">{item}</span>
                    </label>
                ))}
                </div>
            </div>

            <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default EditProperty;