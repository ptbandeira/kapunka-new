import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import PartnerCarousel from '../components/PartnerCarousel';
import type { Doctor } from '../types';

const ForClinics: React.FC = () => {
    const { t } = useLanguage();
    const [doctors, setDoctors] = useState<Doctor[]>([]);

    useEffect(() => {
        fetch('/content/doctors.json')
            .then(res => res.json())
            .then(data => setDoctors(data.doctors));
    }, []);

  return (
    <div>
        <Helmet>
            <title>{t('clinics.title')} | Kapunka Skincare</title>
            <meta name="description" content={t('clinics.metaDescription')} />
        </Helmet>
      <header className="py-20 sm:py-32 bg-stone-100 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight"
          >
            {t('clinics.headerTitle')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto"
          >
            {t('clinics.headerSubtitle')}
          </motion.p>
        </div>
      </header>
      
      <div className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold mb-6">{t('clinics.section1Title')}</h2>
            <p className="text-stone-600 leading-relaxed space-y-4">
              {t('clinics.section1Text1')}
              <br/><br/>
              {t('clinics.section1Text2')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="py-16 sm:py-24 bg-stone-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-center mb-12">{t('clinics.doctorsTitle')}</h2>
          {doctors.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
                {doctors.map((doctor, index) => (
                <motion.div 
                    key={doctor.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                    <img src={doctor.imageUrl} alt={doctor.name} className="w-24 h-24 rounded-full mx-auto object-cover shadow-md" />
                    <p className="mt-4 font-semibold text-sm">{doctor.name}</p>
                </motion.div>
                ))}
            </div>
          ) : <p className="text-center">Loading professionals...</p>}
        </div>
      </div>

      <PartnerCarousel />

      <div className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-2xl">
          <h2 className="text-3xl font-semibold mb-4">{t('clinics.ctaTitle')}</h2>
          <p className="text-stone-600 mb-8">{t('clinics.ctaSubtitle')}</p>
          <a href="#/contact" className="px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors">
            {t('clinics.ctaButton')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForClinics;