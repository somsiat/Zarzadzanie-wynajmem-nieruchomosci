import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // <--- Ważny import
import { supabase } from '../supabaseClient';

const BlogSection = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, excerpt, image_url, created_at') // Pobieramy też ID
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error) setArticles(data || []);
    };
    fetchArticles();
  }, []);

  if (articles.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Wiedza i porady</h2>
        <p className="text-gray-500 mb-10">Najnowsze artykuły z naszego bloga</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((post) => (
            // Cały kafelek jest teraz linkiem do /blog/{ID}
            <Link to={`/blog/${post.id}`} key={post.id} className="group cursor-pointer">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 h-full flex flex-col border border-gray-100">
                <div className="h-52 overflow-hidden relative">
                   {post.image_url ? (
                      <img 
                        src={post.image_url} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                      />
                   ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">Brak zdjęcia</div>
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
                  <span className="font-bold text-sm text-slate-900 underline decoration-gray-300 group-hover:decoration-blue-600 underline-offset-4 transition">
                    Czytaj dalej &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;