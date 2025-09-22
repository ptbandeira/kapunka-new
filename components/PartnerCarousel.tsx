import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import type { Partner } from '../types';

const PartnerCarousel: React.FC = () => {
    const { t } = useLanguage();
    const [partners, setPartners] = useState<Partner[]>([]);

    useEffect(() => {
        fetch('/content/partners.json')
            .then(res => res.json())
            .then(data => setPartners(data.partners));
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    if (partners.length === 0) {
        return null; // Don't render if there are no partners
    }

    return (
        <div className="py-16 sm:py-24 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-semibold text-center text-stone-600 mb-12">
                    {t('clinics.partnersTitle')}
                </h2>
                <motion.div
                    className="flex justify-center items-center flex-wrap gap-x-12 gap-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                >
                    {partners.map(partner => (
                        <motion.div key={partner.id} variants={itemVariants} className="flex-shrink-0">
                            <img
                                src={partner.logoUrl}
                                alt={partner.name}
                                className="h-8 object-contain grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default PartnerCarousel;