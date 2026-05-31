import React, { useState } from 'react';
import Hero from '../components/Hero';
import LatestOffers from '../components/LatestOffers';
import BlogSection from '../components/BlogSection';
import FAQ from '../components/FAQ';

const Home = () => {
  const [filters, setFilters] = useState({});
  const handleSearch = (newFilters) => setFilters(newFilters);

  return (
    <div>
      <Hero onSearch={handleSearch} />
      <LatestOffers filters={filters} />
      <BlogSection />
      <FAQ />
    </div>  
  );
};

export default Home;