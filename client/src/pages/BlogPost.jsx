import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const BlogPost = () => {
  const { id } = useParams(); // Pobieramy ID z paska adresu
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) console.error("Błąd pobierania artykułu:", error);
    else setArticle(data);
    
    setLoading(false);
  };

  if (loading) return <div className="text-center py-20">Ładowanie artykułu...</div>;
  if (!article) return <div className="text-center py-20">Nie znaleziono artykułu.</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Zdjęcie nagłówkowe */}
      {article.image_url && (
        <div className="w-full h-80 md:h-[500px] relative">
           <img 
             src={article.image_url} 
             alt={article.title} 
             className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-black/40"></div>
           <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 text-white container mx-auto">
              <Link to="/" className="text-sm font-bold opacity-80 hover:opacity-100 mb-4 block">&larr; Wróć na stronę główną</Link>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">{article.title}</h1>
              <p className="mt-4 opacity-90">{new Date(article.created_at).toLocaleDateString()}</p>
           </div>
        </div>
      )}

      {/* Treść artykułu */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
         {!article.image_url && (
            // Jeśli brak zdjęcia, pokaż tytuł tutaj
            <div className="mb-8">
                <Link to="/" className="text-blue-600 font-bold text-sm mb-4 block">&larr; Wróć</Link>
                <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
            </div>
         )}
         
         <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
            {article.content || article.excerpt || "Brak treści..."}
         </div>
      </div>
    </div>
  );
};

export default BlogPost;