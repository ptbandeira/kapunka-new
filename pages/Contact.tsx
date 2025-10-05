import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageSquare, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { getCloudinaryUrl } from '../utils/imageUrl';
import Seo from '../components/Seo';

const FORM_NAME = 'kapunka-contact';

const ContactForm: React.FC = () => {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const contactFormFieldPath = `translations.${language}.contact.form`;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.append('form-name', FORM_NAME);

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(Array.from(formData.entries()) as [string, string][]).toString(),
      });

      if (!response.ok) {
        throw new Error('Network error');
      }

      form.reset();
      setStatus('success');
    } catch (error) {
      console.error('Failed to submit contact form', error);
      setStatus('error');
    }
  };

  return (
    <form
      name={FORM_NAME}
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <input type="hidden" name="form-name" value={FORM_NAME} />
      <div hidden aria-hidden="true">
        <label htmlFor="bot-field" className="block text-sm text-stone-500">
          Do not fill this field
        </label>
        <input id="bot-field" name="bot-field" className="mt-1 w-full rounded-md border border-stone-300 p-2" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <input
          type="text"
          name="name"
          placeholder={t('contact.form.name')}
          required
          className="rounded-md border border-stone-300 p-3 focus:border-stone-500 focus:ring-stone-500"
          {...getVisualEditorAttributes(`${contactFormFieldPath}.name`)}
        />
        <input
          type="email"
          name="email"
          placeholder={t('contact.form.email')}
          required
          className="rounded-md border border-stone-300 p-3 focus:border-stone-500 focus:ring-stone-500"
          {...getVisualEditorAttributes(`${contactFormFieldPath}.email`)}
        />
      </div>
      <textarea
        name="message"
        placeholder={t('contact.form.message')}
        rows={5}
        required
        className="w-full rounded-md border border-stone-300 p-3 focus:border-stone-500 focus:ring-stone-500"
        {...getVisualEditorAttributes(`${contactFormFieldPath}.message`)}
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-md bg-stone-900 py-3 font-semibold text-white transition-colors duration-300 hover:bg-stone-700 disabled:bg-stone-400"
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
      <div className="text-center" aria-live="polite">
        {status === 'success' ? (
          <p className="text-green-600" {...getVisualEditorAttributes(`${contactFormFieldPath}.success`)}>
            {t('contact.form.success')}
          </p>
        ) : null}
        {status === 'error' ? (
          <p className="text-red-600" {...getVisualEditorAttributes(`${contactFormFieldPath}.error`)}>
            {t('contact.form.error')}
          </p>
        ) : null}
      </div>
    </form>
  );
};

const Contact: React.FC = () => {
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();
  const contactSettings = settings.contact ?? {
    email: 'hello@kapunka.com',
    phone: '+1 (234) 567-890',
    whatsapp: 'https://wa.me/1234567890',
  };
  const emailLink = contactSettings.email ? `mailto:${contactSettings.email}` : '#';
  const phoneLink = contactSettings.phone ? `tel:${contactSettings.phone.replace(/[^+\d]/g, '')}` : '#';
  const whatsappLink = contactSettings.whatsapp || '#';
  const contactFieldPath = `translations.${language}.contact`;
  const addressLinesRaw = t<unknown>('contact.addressLines');
  const addressLines = Array.isArray(addressLinesRaw)
    ? (addressLinesRaw.filter((line) => typeof line === 'string' && line.trim().length > 0) as string[])
    : [];
  const rawSocialImage = settings.home?.heroImage?.trim() ?? '';
  const socialImage = rawSocialImage ? getCloudinaryUrl(rawSocialImage) ?? rawSocialImage : undefined;

  const metaTitle = t('contact.metaTitle');
  const pageTitle = `${metaTitle} | Kapunka Skincare`;
  const description = t('contact.metaDescription');

  return (
    <div className="py-16 sm:py-24">
      <Seo title={pageTitle} description={description} image={socialImage} locale={language} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-16 text-center">
          <h1
            className="text-4xl font-semibold tracking-tight sm:text-5xl"
            {...getVisualEditorAttributes(`${contactFieldPath}.headerTitle`)}
          >
            {t('contact.headerTitle')}
          </h1>
          <p
            className="mx-auto mt-4 max-w-2xl text-lg text-stone-600"
            {...getVisualEditorAttributes(`${contactFieldPath}.headerSubtitle`)}
          >
            {t('contact.headerSubtitle')}
          </p>
        </header>

        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <h2
                className="mb-4 text-2xl font-semibold"
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
                <Mail className="mt-1 h-6 w-6 text-stone-600" />
                <div>
                  <h3
                    className="font-semibold"
                    {...getVisualEditorAttributes(`${contactFieldPath}.emailTitle`)}
                  >
                    {t('contact.emailTitle')}
                  </h3>
                  <a
                    href={emailLink}
                    className="text-stone-600 transition-colors hover:text-stone-900"
                    {...getVisualEditorAttributes('site.contact.email')}
                  >
                    {contactSettings.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Phone className="mt-1 h-6 w-6 text-stone-600" />
                <div>
                  <h3
                    className="font-semibold"
                    {...getVisualEditorAttributes(`${contactFieldPath}.phoneTitle`)}
                  >
                    {t('contact.phoneTitle')}
                  </h3>
                  <a
                    href={phoneLink}
                    className="text-stone-600 transition-colors hover:text-stone-900"
                    {...getVisualEditorAttributes('site.contact.phone')}
                  >
                    {contactSettings.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MessageSquare className="mt-1 h-6 w-6 text-stone-600" />
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
                    className="text-stone-600 transition-colors hover:text-stone-900"
                    {...getVisualEditorAttributes('site.contact.whatsapp')}
                  >
                    <span {...getVisualEditorAttributes(`${contactFieldPath}.whatsappAction`)}>
                      {t('contact.whatsappAction')}
                    </span>
                  </a>
                </div>
              </div>
              {addressLines.length > 0 ? (
                <div className="flex items-start space-x-4">
                  <MapPin className="mt-1 h-6 w-6 text-stone-600" />
                  <div>
                    <h3
                      className="font-semibold"
                      {...getVisualEditorAttributes(`${contactFieldPath}.addressTitle`)}
                    >
                      {t('contact.addressTitle')}
                    </h3>
                    <ul className="mt-2 space-y-1 text-stone-600">
                      {addressLines.map((line, index) => (
                        <li
                          key={`${line}-${index}`}
                          {...getVisualEditorAttributes(`${contactFieldPath}.addressLines.${index}`)}
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
