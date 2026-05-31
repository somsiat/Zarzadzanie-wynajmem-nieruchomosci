import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const FAQ = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchFAQ();
  }, []);

  const fetchFAQ = async () => {
    const { data, error } = await supabase.from('faq_items').select('*');
    if (!error) setItems(data || []);
  };

  if (items.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-10 text-slate-900">Najczęściej zadawane pytania</h2>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-slate-800 mb-2">{item.question}</h3>
              <p className="text-gray-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;