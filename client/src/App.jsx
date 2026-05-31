import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';


// Layout
import ScrollToTop from './components/ScrollToTop'; 
import MainLayout from './components/MainLayout';

// Strony
import Home from './pages/Home'; // <--- TERAZ IMPORTUJESZ Z PLIKU
import AllOffers from './pages/AllOffers'; 
import Login from './pages/Login'; 
import Register from './pages/Register';
import TenantDashboard from './components/TenantDashboard'; // To też warto przenieść do pages/
import PricingPage from './pages/PricingPage';
import PropertyDetails from './pages/PropertyDetails';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import ProfileSettings from './pages/ProfileSettings';
import BlogPost from './pages/BlogPost';
import BlogPage from './pages/BlogPage';
import RentalAgreement from './pages/RentalAgreement';
import NotaryAppointment from './pages/NotaryAppointment';
import TermsConditions from './pages/TermsConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DataProtection from './pages/DataProtection';
import Contact from './pages/Contact';
import Payments from './pages/Payments';
import AdminDashboard from './pages/AdminDashboard';


function App() {
  return (
    <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Strony z Navbarem i Footerem */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/oferty" element={<AllOffers />} />
              <Route path="/oferta/:id" element={<PropertyDetails />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/cennik" element={<PricingPage />} />
              
              {/* Strony prawne */}
              <Route path="/regulamin" element={<TermsConditions />} />
              <Route path="/polityka-prywatnosci" element={<PrivacyPolicy />} />
              <Route path="/ochrona-danych" element={<DataProtection />} />
              
              {/* Logowanie/Rejestracja*/}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Dashboard i ustawienia */}
              <Route path="/dashboard" element={<TenantDashboard />} />
              <Route path="/ustawienia" element={<ProfileSettings />} />

              <Route path="/kontakt" element={<Contact />} />
              
            </Route>

            <Route path="/dodaj-ogloszenie" element={<AddProperty />} />
            <Route path="/edytuj-ogloszenie/:id" element={<EditProperty />} />  

            <Route path="/platnosci" element={<Payments />} />
            
            {/* Dokumenty do druku / specjalne widoki */}
            <Route path="/umowa/:id" element={<RentalAgreement />} />
            <Route path="/notariusz/:id" element={<NotaryAppointment />} />
            <Route path="/admin" element={<AdminDashboard/>} />

          </Routes>
        </Router>
    </AuthProvider>
  );
}

export default App;