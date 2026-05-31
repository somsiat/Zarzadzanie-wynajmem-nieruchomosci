import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('properties');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false); // Domyślnie false dla bezpieczeństwa

    const [properties, setProperties] = useState([]);
    const [users, setUsers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [articles, setArticles] = useState([]);
    const [contact_messages, setMessages] = useState([]);
    const [incomingMessages, setIncomingMessages] = useState([]);

    // Stan do edycji użytkownika
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({ full_name: '' });

    const [articleForm, setArticleForm] = useState({
        title: '',
        excerpt: '',
        content: '',
        image_url: ''
    });
    const [articleHeroImage, setArticleHeroImage] = useState(null); // { file, previewUrl }

    // Odpowiadanie użytkownikom
    const [replyingToContactId, setReplyingToContactId] = useState(null);
    const [messagingUserId, setMessagingUserId] = useState(null);
    const [messageDraft, setMessageDraft] = useState('');
    const [selectedThread, setSelectedThread] = useState(null); // Wybrana konwersacja z użytkownikiem
    const [selectedContact, setSelectedContact] = useState(null); // Wybrany kontakt z formularza

    useEffect(() => {
        checkAdmin();
    }, [user]);

    // ... (pozostałe useEffect i checkAdmin bez zmian) ...
    // Pamiętaj o ustawieniu setIsAdmin(false) w checkAdmin w bloku else!

     const checkAdmin = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        const { data } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (data?.is_admin) {
            setIsAdmin(true);
            fetchAllData();
        } else {
            setIsAdmin(false);
            alert("Brak uprawnień administratora!");
            navigate('/dashboard');
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        // ... (pobieranie nieruchomości bez zmian) ...
        const { data: props } = await supabase.from('properties').select('*, profiles!owner_id(email)').order('created_at', { ascending: false });
        setProperties(props || []);

        // Pobieranie użytkowników
        const { data: usrs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        setUsers(usrs || []);

        // ... (reszta pobierania bez zmian) ...
        const { data: bks } = await supabase.from('bookings').select('*, properties(title), profiles(email)').order('created_at', { ascending: false});
        setBookings(bks || []);
        
        const { data: arts } = await supabase.from('articles').select('*').order('created_at', {ascending: false});
        setArticles(arts || []);
        
        const { data: msg } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false});
        setMessages(msg || []);

        const { data: toAdmin } = await supabase.from('messages').select('*').eq('receiver_id', user.id).is('booking_id', null);
        const { data: fromAdmin } = await supabase.from('messages').select('*').eq('sender_id', user.id).is('booking_id', null);
        const allAdminMsgs = [...(toAdmin || []), ...(fromAdmin || [])];
        const otherIds = [...new Set(allAdminMsgs.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id))];
        const { data: otherProfiles } = await supabase.from('profiles').select('id, full_name, email').in('id', otherIds);
        const profilesMap = (otherProfiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        const threads = otherIds.map(uid => ({
          userId: uid,
          user: profilesMap[uid],
          messages: allAdminMsgs.filter(m => (m.sender_id === uid || m.receiver_id === uid)).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        })).filter(t => t.messages.length > 0).sort((a, b) => new Date(b.messages[b.messages.length - 1]?.created_at || 0) - new Date(a.messages[a.messages.length - 1]?.created_at || 0));
        setIncomingMessages(threads);

        setLoading(false);
    };

    // ... (handleDeleteProperty, handleAddArticle, handleDeleteArticle bez zmian) ...
    const handleDeleteProperty = async (id) => {
        if(!window.confirm("Czy na pewno chcesz usunąć ogłoszenie? Efektu nie da się cofnąć")) return;
        const { error } = await supabase.from('properties').delete().eq('id', id);
        if (error) alert("Błąd: " + error.message);
        else fetchAllData();
    };

    const handleArticleHeroChange = (e) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setArticleHeroImage({ file, previewUrl: URL.createObjectURL(file) });
        }
    };
    const handleArticleHeroDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setArticleHeroImage({ file, previewUrl: URL.createObjectURL(file) });
        }
    };
    const removeArticleHero = () => setArticleHeroImage(null);

    const handleAddArticle = async (e) => {
        e.preventDefault();
        let imageUrl = articleForm.image_url || '';
        if (articleHeroImage) {
            const file = articleHeroImage.file;
            const fileExt = file.name.split('.').pop();
            const fileName = `articles/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('property-images').upload(fileName, file);
            if (uploadError) {
                alert("Błąd wgrywania zdjęcia: " + uploadError.message);
                return;
            }
            const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(fileName);
            imageUrl = publicUrl;
        }
        const payload = { ...articleForm, image_url: imageUrl || null };
        const { error } = await supabase.from('articles').insert([payload]);
        if (error) alert("Błąd dodawania: " + error.message);
        else {
            alert("Artykuł został dodany pomyślnie!");
            setArticleForm({title: '', excerpt: '', content: '', image_url: ''});
            setArticleHeroImage(null);
            fetchAllData();
        }
    };

    const handleDeleteArticle = async (id) => {
        if(!window.confirm("Usunąć ten artykuł?")) return;
        await supabase.from('articles').delete().eq('id', id);
        fetchAllData();
    };


    // --- NOWA LOGIKA EDYCJI UŻYTKOWNIKA ---

    const startEditingUser = (u) => {
        setEditingUser(u);
        setUserForm({ full_name: u.full_name || '' });
    };

    const cancelEditingUser = () => {
        setEditingUser(null);
        setUserForm({ full_name: '' });
    };

    const handleSendMessageToUser = async (userId) => {
        if (!messageDraft.trim()) return;
        const { error } = await supabase.from('messages').insert([{
            sender_id: user.id,
            receiver_id: userId,
            content: messageDraft.trim(),
            booking_id: null,
            is_read: false
        }]);
        if (error) alert("Błąd wysyłania: " + error.message);
        else {
            setMessageDraft('');
            fetchAllData(); // Odśwież dane, żeby zobaczyć nową wiadomość
        }
    };

    const handleReplyToContact = async (contactMsg) => {
        if (!messageDraft.trim()) return;
        const { data: profile } = await supabase.from('profiles').select('id').eq('email', contactMsg.email).single();
        if (!profile) {
            alert("Użytkownik z adresem " + contactMsg.email + " nie jest zarejestrowany. Skontaktuj się z nim emailem.");
            return;
        }
        const { error } = await supabase.from('messages').insert([{
            sender_id: user.id,
            receiver_id: profile.id,
            content: `[Odpowiedź na wiadomość z formularza kontaktowego]\n\n${messageDraft.trim()}`,
            booking_id: null,
            is_read: false
        }]);
        if (error) alert("Błąd wysyłania: " + error.message);
        else {
            setMessageDraft('');
            fetchAllData(); // Odśwież dane
            // Sprawdź czy istnieje już konwersacja z tym użytkownikiem
            const existingThread = incomingMessages.find(t => t.userId === profile.id);
            if (existingThread) {
                setSelectedThread(existingThread);
                setSelectedContact(null);
            }
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (userId === user?.id) {
            alert("Nie możesz usunąć własnego konta.");
            return;
        }
        if (!window.confirm(`Czy na pewno chcesz usunąć użytkownika ${userName || '?'}? Ta operacja jest nieodwracalna.`)) return;
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) alert("Błąd usuwania: " + error.message);
        else fetchAllData();
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        // Administrator nie może zmieniać uprawnień (ani nadawać, ani odbierać)
        try {
            const { error } = await supabase.rpc('update_user_data', {
                payload_id: editingUser.id,
                payload_name: userForm.full_name,
                payload_admin: editingUser.is_admin
            });

            if (error) {
                console.error("Błąd Supabase:", error);
                alert("Błąd aktualizacji: " + error.message);
            } else {
                alert("Zmiany zostały zapisane w bazie!");
                setEditingUser(null);
                fetchAllData(); // Odśwież widok, żeby zobaczyć zmiany
            }

        } catch (err) {
            console.error("Błąd krytyczny:", err);
            alert("Wystąpił nieoczekiwany błąd.");
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: "Oczekujące",
            accepted: "Zaakceptowane",
            signed: "Podpisana",
            cancelled: "Anulowana",
            completed: "Zakończona",
            rejected: "Odrzucona"
        };
        const styles = {
            pending: "bg-yellow-100 text-yellow-800",
            accepted: "bg-green-100 text-green-800",
            signed: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
            completed: "bg-blue-100 text-blue-800",
            rejected: "bg-red-100 text-red-800"
        };
        const text = labels[status] || status;
        return <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${styles[status] || "bg-gray-100"}`}>{text}</span>;
    };
    
    if (!isAdmin) return null;
    if (loading) return <div className="text-center py-20 font-bold text-gray-500">Ładowanie panelu administratora...</div>;
    
    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4">
            <div className="container mx-auto max-w-7xl">
                {/* ... (Nagłówek i przyciski wylogowania bez zmian) ... */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">🖥️ Panel administratora</h1>
                    <div className="flex items-center gap-4">
                        <a href="/" target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm">Podgląd strony</a>
                        <button onClick={async () => { await signOut(); navigate('/'); }} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm">Wyloguj</button>
                    </div>
                </div>

                {/* Menu zakładek */}
                <div className="flex flex-wrap gap-2 border-b border-gray-300 mb-8 pb-1">
                    {[
                        { id: 'properties', label: '🏠 Moderacja ogłoszeń' },
                        { id: 'bookings', label: '📄 Status umów' },
                        { id: 'users', label: '👥 Użytkownicy' },
                        { id: 'blog', label: '📝 Blog' },
                        { id: 'contact_messages', label: '✉️ Skrzynka odbiorcza' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)} 
                            className={`px-6 py-3 rounded-t-lg font-bold transition-colors ${activeTab === tab.id ? 'bg-white text-blue-600 border-t border-x border-gray-300 relative top-[1px]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Sekcja ogłoszeń, umów, bloga i wiadomości pozostaje bez zmian w strukturze, dodajemy tylko logikę edycji użytkowników */}

                {/* --- SEKCJA UŻYTKOWNIKÓW --- */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                        
                        {/* Formularz wysyłania wiadomości */}
                        {messagingUserId && (
                            <div className="p-6 bg-blue-50 border-b border-blue-100">
                                <h3 className="font-bold text-lg mb-4">Wyślij wiadomość do: {users.find(u => u.id === messagingUserId)?.full_name || users.find(u => u.id === messagingUserId)?.email}</h3>
                                <div className="flex flex-col gap-3 max-w-lg">
                                    <textarea value={messageDraft} onChange={e => setMessageDraft(e.target.value)} className="w-full p-3 border rounded-lg" rows="4" placeholder="Treść wiadomości..." />
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSendMessageToUser(messagingUserId)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">Wyślij</button>
                                        <button onClick={() => { setMessagingUserId(null); setMessageDraft(''); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Anuluj</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FORMULARZ EDYCJI (Pokazuje się tylko gdy editingUser !== null) */}
                        {editingUser && (
                            <div className="p-6 bg-blue-50 border-b border-blue-100">
                                <h3 className="font-bold text-lg mb-4">Edytuj użytkownika: {editingUser.email}</h3>
                                <form onSubmit={handleUpdateUser} className="flex flex-col gap-4 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Imię i nazwisko</label>
                                        <input 
                                            type="text" 
                                            value={userForm.full_name}
                                            onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Zapisz zmiany</button>
                                        <button type="button" onClick={cancelEditingUser} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Anuluj</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Użytkownik</th>
                                    <th className="px-6 py-4">Data rejestracji</th>
                                    <th className="px-6 py-4 text-right">Uprawnienia / Akcje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{u.full_name || 'Brak imienia'}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                                            {u.is_admin 
                                                ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-200 mr-2">ADMIN</span> 
                                                : <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200 mr-2">USER</span>}
                                            
                                            <button 
                                                onClick={() => startEditingUser(u)}
                                                className="text-blue-600 hover:text-blue-900 font-medium px-2"
                                            >
                                                Edytuj
                                            </button>
                                            {u.id !== user?.id && (
                                                <>
                                                    <button onClick={() => { setMessagingUserId(u.id); setReplyingToContactId(null); setMessageDraft(''); }} className="text-blue-600 hover:text-blue-800 font-medium px-2">Wyślij wiadomość</button>
                                                    <button 
                                                        onClick={() => handleDeleteUser(u.id, u.full_name || u.email)}
                                                        className="text-red-600 hover:text-red-800 font-medium px-2"
                                                        title="Usuń użytkownika"
                                                    >
                                                        Usuń
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'properties' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {properties.map(prop => (
                            <div key={prop.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                                {/* ... zawartość karty ogłoszenia ... */}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg truncate w-3/4">{prop.title}</h3>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{prop.type === 'rent' ? 'Wynajem' : 'Sprzedaż'}</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">Właściciel: {prop.profiles?.email || 'Nieznany'}</p>
                                <div className="flex gap-2 mt-4">
                                    <a href={`/oferta/${prop.id}`} target="_blank" rel="noreferrer" className="flex-1 text-center border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50 transition">Podgląd</a>
                                    <a href={`/edytuj-ogloszenie/${prop.id}`} className="flex-1 text-center border border-blue-200 text-blue-600 rounded-lg py-2 text-sm hover:bg-blue-50 transition">Edycja</a>
                                </div>
                                <button onClick={() => handleDeleteProperty(prop.id)} className="w-full mt-2 py-2 text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition">🗑️ Usuń</button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'bookings' && (
                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">ID / Data</th>
                                    <th className="px-6 py-4">Nieruchomość</th>
                                    <th className="px-6 py-4">Strony umowy</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bookings.map(bk => (
                                    <tr key={bk.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4"><div className="font-mono text-xs text-gray-400">#{bk.id.slice(0,6)}</div><div className="text-xs">{new Date(bk.created_at).toLocaleDateString()}</div></td>
                                        <td className="px-6 py-4 font-medium">{bk.properties?.title || <span className="text-red-400">Usunięta oferta</span>}</td>
                                        <td className="px-6 py-4 text-xs text-gray-600"><div><strong>Najemca:</strong> {bk.profiles?.email}</div></td>
                                        <td className="px-6 py-4">{getStatusLabel(bk.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'blog' && (
                    <div className="grid lg:grid-cols-3 gap-8 animate-fade-in">
                        <div className="lg:col-span-1">
                             <div className="bg-white p-6 rounded-xl border border-gray-200 sticky top-4">
                                <h3 className="font-bold text-xl mb-4 text-slate-800">Dodaj nowy artykuł</h3>
                                <form onSubmit={handleAddArticle} className="space-y-4">
                                    {/* ... inputy formularza ... */}
                                     <div><label className="block text-xs font-bold text-gray-500 mb-1">Tytuł</label><input className="w-full border border-gray-300 p-2 rounded" value={articleForm.title} onChange={e => setArticleForm({...articleForm, title: e.target.value})} required /></div>
                                     <div><label className="block text-xs font-bold text-gray-500 mb-1">Opis</label><input className="w-full border border-gray-300 p-2 rounded" value={articleForm.excerpt} onChange={e => setArticleForm({...articleForm, excerpt: e.target.value})} /></div>
                                     <div><label className="block text-xs font-bold text-gray-500 mb-1">Treść</label><textarea className="w-full border border-gray-300 p-2 rounded" rows="6" value={articleForm.content} onChange={e => setArticleForm({...articleForm, content: e.target.value})} required /></div>
                                     <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Zdjęcie hero</label>
                                        <div
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleArticleHeroDrop}
                                            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition relative cursor-pointer mb-2"
                                            onClick={() => document.getElementById('article-hero-input')?.click()}
                                        >
                                            <input id="article-hero-input" type="file" accept="image/*" onChange={handleArticleHeroChange} className="hidden" />
                                            {articleHeroImage ? (
                                                <div className="relative inline-block">
                                                    <img src={articleHeroImage.previewUrl} alt="Hero" className="max-h-40 rounded-lg object-cover" />
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); removeArticleHero(); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">✕</button>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500">Przeciągnij zdjęcie tutaj lub <span className="font-bold text-blue-600">kliknij, aby wybrać</span></div>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400 text-center mb-1">— lub podaj URL —</div>
                                        <input className="w-full border border-gray-300 p-2 rounded text-sm" placeholder="https://..." value={articleForm.image_url} onChange={e => setArticleForm({...articleForm, image_url: e.target.value})} />
                                     </div>
                                    <button className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800">Opublikuj</button>
                                </form>
                             </div>
                        </div>
                        <div className="lg:col-span-2 space-y-4">
                            {/* ... lista artykułów ... */}
                            {articles.map(art => (
                                <div key={art.id} className="bg-white p-4 rounded-xl border border-gray-200 flex gap-4 items-start group">
                                     <div className="w-24 h-24 shrink-0 bg-gray-100 rounded-lg overflow-hidden">{art.image_url && <img src={art.image_url} alt="" className="w-full h-full object-cover" />}</div>
                                     <div className="flex-1">
                                        <div className="flex justify-between items-start"><h4 className="font-bold text-lg">{art.title}</h4><button onClick={() => handleDeleteArticle(art.id)} className="text-red-600 opacity-0 group-hover:opacity-100">🗑️</button></div>
                                        <p className="text-sm text-gray-500 line-clamp-2">{art.excerpt}</p>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'contact_messages' && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in h-[calc(100vh-200px)] flex flex-col">
                        {/* Główny layout - Messenger style */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Lewa kolumna - Lista konwersacji */}
                            <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
                                {/* Konwersacje z użytkownikami */}
                                {incomingMessages.length > 0 && (
                                    <div className="border-b border-gray-200 bg-white">
                                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                                            <h4 className="font-bold text-sm text-slate-800">
                                                💬 Konwersacje ({incomingMessages.length})
                                            </h4>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {incomingMessages.map(thread => {
                                                const lastMessage = thread.messages[thread.messages.length - 1];
                                                const isSelected = selectedThread?.userId === thread.userId;
                                                return (
                                                    <div
                                                        key={thread.userId}
                                                        onClick={() => {
                                                            setSelectedThread(thread);
                                                            setSelectedContact(null);
                                                            setReplyingToContactId(null);
                                                        }}
                                                        className={`p-4 cursor-pointer hover:bg-gray-100 transition ${
                                                            isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                                                                {(thread.user?.full_name || thread.user?.email || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-slate-900 truncate">
                                                                    {thread.user?.full_name || thread.user?.email || 'Użytkownik'}
                                                                </div>
                                                                <div className="text-xs text-gray-500 truncate">
                                                                    {lastMessage?.content?.substring(0, 40) || 'Brak wiadomości'}...
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-1">
                                                                    {lastMessage ? new Date(lastMessage.created_at).toLocaleDateString('pl-PL', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    }) : ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Formularz kontaktowy - lista */}
                                <div className="bg-white">
                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                                        <h4 className="font-bold text-sm text-slate-800">
                                            📧 Formularz kontaktowy ({contact_messages.length})
                                        </h4>
                                    </div>
                                    {contact_messages.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400">
                                            <div className="text-4xl mb-2">📭</div>
                                            <p className="text-sm">Brak wiadomości</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {contact_messages.map(msg => {
                                                const isSelected = selectedContact?.id === msg.id;
                                                return (
                                                    <div
                                                        key={msg.id}
                                                        onClick={() => {
                                                            setSelectedContact(msg);
                                                            setSelectedThread(null);
                                                            setReplyingToContactId(null);
                                                        }}
                                                        className={`p-4 cursor-pointer hover:bg-gray-100 transition ${
                                                            isSelected ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                                                                {(msg.full_name || msg.email || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-slate-900 truncate">
                                                                    {msg.full_name || 'Anonimowy użytkownik'}
                                                                </div>
                                                                <div className="text-xs text-gray-500 truncate">
                                                                    {msg.email}
                                                                </div>
                                                                {msg.subject && (
                                                                    <div className="text-xs text-purple-600 mt-1 truncate">
                                                                        📌 {msg.subject}
                                                                    </div>
                                                                )}
                                                                <div className="text-xs text-gray-400 mt-1">
                                                                    {new Date(msg.created_at).toLocaleDateString('pl-PL', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Prawa kolumna - Czat */}
                            <div className="flex-1 flex flex-col bg-white">
                                {selectedThread ? (
                                    <>
                                        {/* Nagłówek czatu */}
                                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {(selectedThread.user?.full_name || selectedThread.user?.email || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">
                                                        {selectedThread.user?.full_name || selectedThread.user?.email || 'Użytkownik'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{selectedThread.user?.email}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Wiadomości */}
                                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                                            {selectedThread.messages.map(m => (
                                                <div
                                                    key={m.id}
                                                    className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                                                            m.sender_id === user.id
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-white text-gray-800 border border-gray-200'
                                                        }`}
                                                    >
                                                        <div className={`text-xs mb-1 ${
                                                            m.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                                                        }`}>
                                                            {m.sender_id === user.id ? 'Ty' : selectedThread.user?.full_name || 'Użytkownik'} • {new Date(m.created_at).toLocaleDateString('pl-PL', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                        <p className={`text-sm whitespace-pre-wrap ${
                                                            m.sender_id === user.id ? 'text-white' : 'text-gray-800'
                                                        }`}>
                                                            {m.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pole do wpisywania */}
                                        <div className="p-4 border-t border-gray-200 bg-white">
                                            <div className="flex gap-2">
                                                <textarea
                                                    value={messageDraft}
                                                    onChange={e => setMessageDraft(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendMessageToUser(selectedThread.userId);
                                                        }
                                                    }}
                                                    className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition resize-none"
                                                    rows="2"
                                                    placeholder="Napisz wiadomość..."
                                                />
                                                <button
                                                    onClick={() => handleSendMessageToUser(selectedThread.userId)}
                                                    disabled={!messageDraft.trim()}
                                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Wyślij
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : selectedContact ? (
                                    <>
                                        {/* Nagłówek czatu dla formularza */}
                                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {(selectedContact.full_name || selectedContact.email || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">
                                                        {selectedContact.full_name || 'Anonimowy użytkownik'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{selectedContact.email}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Treść wiadomości z formularza */}
                                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                                            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                                                {selectedContact.subject && (
                                                    <div className="mb-4">
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Temat:</span>
                                                        <div className="mt-1 text-sm font-semibold text-slate-700 bg-yellow-50 px-4 py-2 rounded-lg inline-block">
                                                            {selectedContact.subject}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="mb-4">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Wiadomość:</span>
                                                    <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg">
                                                        {selectedContact.message}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Otrzymano: {new Date(selectedContact.created_at).toLocaleDateString('pl-PL', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pole do odpowiedzi */}
                                        <div className="p-4 border-t border-gray-200 bg-white">
                                            {replyingToContactId === selectedContact.id ? (
                                                <div className="space-y-3">
                                                    <textarea
                                                        value={messageDraft}
                                                        onChange={e => setMessageDraft(e.target.value)}
                                                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm"
                                                        rows="4"
                                                        placeholder="Napisz odpowiedź..."
                                                    />
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleReplyToContact(selectedContact)}
                                                            disabled={!messageDraft.trim()}
                                                            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            ✉️ Wyślij odpowiedź
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setReplyingToContactId(null);
                                                                setMessageDraft('');
                                                            }}
                                                            className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-300 transition"
                                                        >
                                                            Anuluj
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setReplyingToContactId(selectedContact.id);
                                                        setMessageDraft('');
                                                    }}
                                                    className="w-full bg-blue-600 text-white px-5 py-3 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                                                >
                                                    ✉️ Odpowiedz na wiadomość
                                                </button>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                                        <div className="text-center">
                                            <div className="text-6xl mb-4">💬</div>
                                            <p className="text-gray-400 text-lg font-medium">Wybierz konwersację lub wiadomość</p>
                                            <p className="text-gray-400 text-sm mt-2">Kliknij na element z listy, aby otworzyć czat</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;