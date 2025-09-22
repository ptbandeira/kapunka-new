
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

const ContactForm: React.FC = () => {
    const { t } = useLanguage();
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('submitting');
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStatus('success');
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <input type="text" name="name" placeholder={t('contact.form.name')} required className="p-3 border border-stone-300 rounded-md focus:ring-stone-500 focus:border-stone-500" />
                <input type="email" name="email" placeholder={t('contact.form.email')} required className="p-3 border border-stone-300 rounded-md focus:ring-stone-500 focus:border-stone-500" />
            </div>
            <textarea name="message" placeholder={t('contact.form.message')} rows={5} required className="w-full p-3 border border-stone-300 rounded-md focus:ring-stone-500 focus:border-stone-500"></textarea>
            
            <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-stone-900 text-white py-3 rounded-md font-semibold hover:bg-stone-700 transition-colors duration-300 disabled:bg-stone-400"
            >
                {status === 'submitting' ? t('contact.form.sending') : t('contact.form.submit')}
            </button>
            
            {status === 'success' && <p className="text-center text-green-600">{t('contact.form.success')}</p>}
            {status === 'error' && <p className="text-center text-red-600">{t('contact.form.error')}</p>}
        </form>
    );
};

const Contact: React.FC = () => {
    const { t } = useLanguage();
    const { settings } = useSiteSettings();
    const contactSettings = settings.contact ?? { email: 'hello@kapunka.com', phone: '+1 (234) 567-890', whatsapp: 'https://wa.me/1234567890' };
    const emailLink = contactSettings.email ? `mailto:${contactSettings.email}` : '#';
    const phoneLink = contactSettings.phone ? `tel:${contactSettings.phone.replace(/[^+\d]/g, '')}` : '#';
    const whatsappLink = contactSettings.whatsapp || '#';
  return (
    <div className="py-16 sm:py-24">
        <Helmet>
            <title>{t('contact.title')} | Kapunka Skincare</title>
            <meta name="description" content={t('contact.metaDescription')} />
        </Helmet>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-16">
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">{t('contact.headerTitle')}</h1>
                <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">{t('contact.headerSubtitle')}</p>
            </header>
            
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, x: -30 }} 
                    whileInView={{ opacity: 1, x: 0 }} 
                    viewport={{ once: true }} 
                    transition={{ duration: 0.6 }}
                    className="space-y-8"
                >
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">{t('contact.formTitle')}</h2>
                        <ContactForm />
                    </div>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, x: 30 }} 
                    whileInView={{ opacity: 1, x: 0 }} 
                    viewport={{ once: true }} 
                    transition={{ duration: 0.6 }}
                    className="space-y-8"
                >
                    <h2 className="text-2xl font-semibold">{t('contact.infoTitle')}</h2>
                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <Mail className="h-6 w-6 text-stone-600 mt-1" />
                            <div>
                                <h3 className="font-semibold">{t('contact.emailTitle')}</h3>
                                <a href={emailLink} className="text-stone-600 hover:text-stone-900 transition-colors">{contactSettings.email}</a>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <Phone className="h-6 w-6 text-stone-600 mt-1" />
                            <div>
                                <h3 className="font-semibold">{t('contact.phoneTitle')}</h3>
                                <a href={phoneLink} className="text-stone-600 hover:text-stone-900 transition-colors">{contactSettings.phone}</a>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <MessageSquare className="h-6 w-6 text-stone-600 mt-1" />
                            <div>
                                <h3 className="font-semibold">{t('contact.whatsappTitle')}</h3>
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-stone-900 transition-colors">{t('contact.whatsappAction')}</a>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    </div>
  );
};

export default Contact;
