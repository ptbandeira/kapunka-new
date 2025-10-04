import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import type { Partner } from '../types';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';

interface PartnerCarouselProps {
  title?: string;
  fieldPath?: string;
}

interface PartnerResponse {
    partners?: Partner[];
}

const PartnerCarousel: React.FC<PartnerCarouselProps> = ({ title, fieldPath }) => {
    const { t, language } = useLanguage();
    const [partners, setPartners] = useState<Partner[]>([]);
    const resolvedTitle = title ?? t('clinics.partnersTitle');
    const resolvedFieldPath = fieldPath ?? `translations.${language}.clinics.partnersTitle`;
    const { contentVersion } = useVisualEditorSync();

    useEffect(() => {
        let isMounted = true;

        const loadPartners = async () => {
            try {
                const data = await fetchVisualEditorJson<PartnerResponse>('/content/partners.json');
                if (!isMounted) {
                    return;
                }
                setPartners(Array.isArray(data.partners) ? data.partners : []);
            } catch (error) {
                console.error('Failed to load partners', error);
            }
        };

        loadPartners().catch(error => {
            console.error('Unhandled error while loading partners', error);
        });

        return () => {
            isMounted = false;
        };
    }, [contentVersion]);

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
                <h2
                    className="text-2xl font-semibold text-center text-stone-600 mb-12"
                    {...getVisualEditorAttributes(resolvedFieldPath)}
                >
                    {resolvedTitle}
                </h2>
                <motion.div
                    className="flex justify-center items-center flex-wrap gap-x-12 gap-y-10"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    {...getVisualEditorAttributes('partners.partners')}
                >
                    {partners.map((partner, index) => (
                        <motion.div
                            key={partner.id}
                            variants={itemVariants}
                            className="flex-shrink-0 flex flex-col items-center text-center max-w-[12rem]"
                            {...getVisualEditorAttributes(`partners.partners.${index}`)}
                        >
                            <img
                                src={partner.logoUrl}
                                alt={partner.name}
                                title={partner.description ?? partner.name}
                                className="h-8 object-contain grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                                {...getVisualEditorAttributes(`partners.partners.${index}.logoUrl`)}
                            />
                            {partner.description && (
                                <p
                                    className="mt-3 text-xs text-stone-500"
                                    {...getVisualEditorAttributes(`partners.partners.${index}.description`)}
                                >
                                    {partner.description}
                                </p>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default PartnerCarousel;
