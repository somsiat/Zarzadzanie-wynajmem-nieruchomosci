import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const BlogPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, excerpt, image_url, created_at')
      .order('created_at', { ascending: false }); // Pobierz WSZYSTKIE, od najnowszych

    if (!error) setArticles(data || []);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-20">Ładowanie bloga...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        
        {/* Nagłówek strony */}
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Blog o nieruchomościach</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
                Znajdziesz tu porady prawne, analizy rynku i wskazówki, jak bezpiecznie wynająć lub kupić mieszkanie.
            </p>
        </div>

        {/* Lista artykułów */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((post) => (
            <Link to={`/blog/${post.id}`} key={post.id} className="group cursor-pointer block h-full">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 h-full flex flex-col border border-gray-100">
                <div className="h-52 overflow-hidden relative bg-gray-200">
                   {post.image_url ? (
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">Brak zdjęcia</div>
                   )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="text-xs font-bold text-blue-600 uppercase mb-2">
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-blue-600 transition">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-grow">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto">
                    <span className="font-bold text-sm text-slate-900 underline decoration-gray-300 group-hover:decoration-blue-600 underline-offset-4 transition">
                        Czytaj dalej &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default BlogPage;