require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Połączenie z Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ENDPOINT: Pobierz oferty
app.get('/api/properties', async (req, res) => {
  try {
    const { city, minPrice, maxPrice, type } = req.query;

    //zapytanie bazowe
    let query = supabase
      .from('properties')
      .select('*, property_images(image_url)');

    
    // Filtrowanie po mieście
    if (city) {
      query = query.ilike('address_city', `%${city}%`);
    }

    // Filtrowanie po cenie
    if (minPrice) {
      query = query.gte('price_per_month', minPrice); // gte = greater than or equal
    }
    if (maxPrice) {
      query = query.lte('price_per_month', maxPrice); // lte = less than or equal
    }

    // Filtrowanie po typie (dom/mieszkanie)
    if (type && type !== 'all') {
      query = query.eq('property_type', type);
    }

    //sortowanie od najnowszych
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Błąd:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ENDPOINT: Wyślij wiadomość z formularza kontaktowego
app.post('/api/contact-messages', async (req, res) => {
  try {
    const { full_name, email, subject, message } = req.body || {};

    // Podstawowa walidacja po stronie serwera
    if (!full_name || !email || !message) {
      return res.status(400).json({ error: 'Brak wymaganych pól: full_name, email, message' });
    }

    const { error } = await supabase
      .from('contact_messages')
      .insert([
        {
          full_name: String(full_name).trim(),
          email: String(email).trim(),
          subject: subject ? String(subject).trim() : null,
          message: String(message).trim()
        }
      ]);

    if (error) throw error;

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Błąd zapisu wiadomości kontaktowej:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});