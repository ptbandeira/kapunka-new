import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { fetchVisualEditorMarkdown } from '../utils/fetchVisualEditorMarkdown';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';

interface ContactPageMeta {
    metaTitle?: string;
    metaDescription?: string;
}

const isContactPageMeta = (value: unknown): value is ContactPageMeta => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const { metaTitle, metaDescription } = value as Record<string, unknown>;

    return (
        (metaTitle === undefined || typeof metaTitle === 'string')
        && (metaDescription === undefined || typeof metaDescription === 'string')
    );
};

const ContactForm: React.FC = () => {
    const { t, language } = useLanguage();
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const contactFormFieldPath = `translations.${language}.contact.form`;

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
                <input
                    type="text"
                    name="name"
                    placeholder={t('contact.form.name')}
                    required
                    className="p-3 border border-stone-300 rounded-md focus:ring-stone-500 focus:border-stone-500"
                    {...getVisualEditorAttributes(`${contactFormFieldPath}.name`)}
                />
                <input
                    type="email"
                    name="email"
                    placeholder={t('contact.form.email')}
                    required
                    className="p-3 border border-stone-300 rounded-md focus:ring-stone-500 focus:border-stone-500"
                    {...getVisualEditorAttributes(`${contactFormFieldPath}.email`)}
                />
            </div>
            <textarea
                name="message"
                placeholder={t('contact.form.message')}
                rows={5}
                required
                className="w-full p-3 border border-stone-300 rounded-md focus:ring-stone-500 focus:border-stone-500"
                {...getVisualEditorAttributes(`${contactFormFieldPath}.message`)}
            ></textarea>

            <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-stone-900 text-white py-3 rounded-md font-semibold hover:bg-stone-700 transition-colors duration-300 disabled:bg-stone-400"
            >
                {status === 'submitting' ? (
                    <span {...getVisualEditorAttributes(`${contactFormFieldPath}.sending`)}>
                        {t('contact.form.sending')}
                    </span>
                ) : (
                    <span {...getVisualEditorAttributes(`${contactFormFieldPath}.submit`)}>
                        {t('contact.form.submit')}
                    </span>
                )}
            </button>

            {status === 'success' && (
                <p className="text-center text-green-600" {...getVisualEditorAttributes(`${contactFormFieldPath}.success`)}>
                    {t('contact.form.success')}
                </p>
            )}
            {status === 'error' && (
                <p className="text-center text-red-600" {...getVisualEditorAttributes(`${contactFormFieldPath}.error`)}>
                    {t('contact.form.error')}
                </p>
            )}
        </form>
    );
};

const Contact: React.FC = () => {
    const { t, language } = useLanguage();
    const { settings } = useSiteSettings();
    const { contentVersion } = useVisualEditorSync();
    const contactSettings = settings.contact ?? { email: 'hello@kapunka.com', phone: '+1 (234) 567-890', whatsapp: 'https://wa.me/1234567890' };
    const emailLink = contactSettings.email ? `mailto:${contactSettings.email}` : '#';
    const phoneLink = contactSettings.phone ? `tel:${contactSettings.phone.replace(/[^+\d]/g, '')}` : '#';
    const whatsappLink = contactSettings.whatsapp || '#';
    const contactFieldPath = `translations.${language}.contact`;
    const [pageMeta, setPageMeta] = useState<ContactPageMeta | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadMeta = async () => {
            const localesToTry = [language, 'en'].filter((locale, index, arr) => arr.indexOf(locale) === index);

            for (const locale of localesToTry) {
                try {
                    const { data } = await fetchVisualEditorMarkdown<unknown>(
                        `/content/pages/${locale}/contact.md`,
                        { cache: 'no-store' },
                    );

                    if (!isMounted) {
                        return;
                    }

                    if (isContactPageMeta(data)) {
                        setPageMeta(data);
                        return;
                    }
                } catch (error) {
                    if (locale === localesToTry[localesToTry.length - 1]) {
                        console.error('Failed to load contact page meta', error);
                    }
                }
            }

            if (isMounted) {
                setPageMeta(null);
            }
        };

        loadMeta().catch((error) => {
            console.error('Unhandled error while loading contact page meta', error);
        });

        return () => {
            isMounted = false;
        };
    }, [language, contentVersion]);

    const sanitize = (value?: string | null): string | undefined => {
        if (typeof value !== 'string') {
            return undefined;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    };

    const metaTitleBase = sanitize(pageMeta?.metaTitle) ?? t('contact.metaTitle');
    const metaDescription = sanitize(pageMeta?.metaDescription) ?? t('contact.metaDescription');
    const pageTitle = metaTitleBase.includes('Kapunka') ? metaTitleBase : `${metaTitleBase} | Kapunka Skincare`;
    const socialImage = sanitize(settings.home?.heroImage);

    return (
        <div className="py-16 sm:py-24">
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={metaDescription} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={metaDescription} />
                {socialImage ? <meta property="og:image" content={socialImage} /> : null}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={metaDescription} />
                {socialImage ? <meta name="twitter:image" content={socialImage} /> : null}
            </Head>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <header className="text-center mb-16">
                <h1
                    className="text-4xl sm:text-5xl font-semibold tracking-tight"
                    {...getVisualEditorAttributes(`${contactFieldPath}.headerTitle`)}
                >
                    {t('contact.headerTitle')}
                </h1>
                <p
                    className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto"
                    {...getVisualEditorAttributes(`${contactFieldPath}.headerSubtitle`)}
                >
                    {t('contact.headerSubtitle')}
                </p>
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
                        <h2
                            className="text-2xl font-semibold mb-4"
                            {...getVisualEditorAttributes(`${contactFieldPath}.formTitle`)}
                        >
                            {t('contact.formTitle')}
                        </h2>
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
                    <h2
                        className="text-2xl font-semibold"
                        {...getVisualEditorAttributes(`${contactFieldPath}.infoTitle`)}
                    >
                        {t('contact.infoTitle')}
                    </h2>
                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <Mail className="h-6 w-6 text-stone-600 mt-1" />
                            <div>
                                <h3
                                    className="font-semibold"
                                    {...getVisualEditorAttributes(`${contactFieldPath}.emailTitle`)}
                                >
                                    {t('contact.emailTitle')}
                                </h3>
                                <a
                                    href={emailLink}
                                    className="text-stone-600 hover:text-stone-900 transition-colors"
                                    {...getVisualEditorAttributes('site.contact.email')}
                                >
                                    {contactSettings.email}
                                </a>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <Phone className="h-6 w-6 text-stone-600 mt-1" />
                            <div>
                                <h3
                                    className="font-semibold"
                                    {...getVisualEditorAttributes(`${contactFieldPath}.phoneTitle`)}
                                >
                                    {t('contact.phoneTitle')}
                                </h3>
                                <a
                                    href={phoneLink}
                                    className="text-stone-600 hover:text-stone-900 transition-colors"
                                    {...getVisualEditorAttributes('site.contact.phone')}
                                >
                                    {contactSettings.phone}
                                </a>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <MessageSquare className="h-6 w-6 text-stone-600 mt-1" />
                            <div>
                                <h3
                                    className="font-semibold"
                                    {...getVisualEditorAttributes(`${contactFieldPath}.whatsappTitle`)}
                                >
                                    {t('contact.whatsappTitle')}
                                </h3>
                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-stone-600 hover:text-stone-900 transition-colors"
                                    {...getVisualEditorAttributes('site.contact.whatsapp')}
                                >
                                    <span {...getVisualEditorAttributes(`${contactFieldPath}.whatsappAction`)}>
                                        {t('contact.whatsappAction')}
                                    </span>
                                </a>
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
