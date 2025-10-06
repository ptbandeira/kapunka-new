import React, { useEffect, useMemo, useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import ContactForm from '../components/ContactForm';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { getCloudinaryUrl } from '../utils/imageUrl';
import Seo from '../src/components/Seo';
import {
  loadContactPageContent,
  type ContactPageContentResult,
} from '../utils/loadContactPageContent';

const sanitizePhoneHref = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const digits = value.replace(/[^+\d]/g, '');
  return digits.length > 0 ? `tel:${digits}` : undefined;
};

const splitAddressLines = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const Contact: React.FC = () => {
  const { language, t } = useLanguage();
  const { settings } = useSiteSettings();
  const { contentVersion } = useVisualEditorSync();
  const [pageContent, setPageContent] = useState<ContactPageContentResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    setPageContent(null);

    loadContactPageContent(language)
      .then((result) => {
        if (!isMounted) {
          return;
        }
        setPageContent(result);
      })
      .catch((error) => {
        console.error('Failed to load Contact page content', error);
        if (isMounted) {
          setPageContent(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [language, contentVersion]);

  const contactFieldPath = useMemo(() => {
    if (!pageContent) {
      return `pages.contact_${language}`;
    }

    return pageContent.source === 'visual-editor'
      ? `site.content.${pageContent.locale}.pages.contact`
      : `pages.contact_${pageContent.locale}`;
  }, [language, pageContent]);

  const heroTitle = pageContent?.data.heroTitle?.trim() || t('contact.headerTitle');
  const heroSubtitle = pageContent?.data.heroSubtitle?.trim() || t('contact.headerSubtitle');
  const contactEmail = pageContent?.data.contactEmail?.trim() || settings.contact?.email || '';
  const phone = pageContent?.data.phone?.trim() || settings.contact?.phone || '';
  const address = pageContent?.data.address?.trim() || '';
  const mapEmbedUrl = pageContent?.data.mapEmbedUrl?.trim() || '';

  const emailHref = contactEmail ? `mailto:${contactEmail}` : undefined;
  const phoneHref = sanitizePhoneHref(phone);
  const translationAddressLinesRaw = t<unknown>('contact.addressLines');
  const translationAddressLines = Array.isArray(translationAddressLinesRaw)
    ? translationAddressLinesRaw
      .map((line) => (typeof line === 'string' ? line.trim() : ''))
      .filter((line): line is string => line.length > 0)
    : [];
  const addressLines = splitAddressLines(address);
  const displayAddressLines = addressLines.length > 0 ? addressLines : translationAddressLines;

  const metaTitle = pageContent?.data.metaTitle?.trim() || heroTitle || 'Contact Kapunka';
  const metaDescription = pageContent?.data.metaDescription?.trim() || heroSubtitle || t('contact.headerSubtitle');
  const pageTitle = `${metaTitle} | Kapunka Skincare`;

  const socialImageSource = settings.home?.heroImage?.trim() || '';
  const socialImage = socialImageSource ? getCloudinaryUrl(socialImageSource) ?? socialImageSource : undefined;

  const translationFieldPath = `translations.${language}.contact`;

  const heroTitleFieldPath = pageContent ? `${contactFieldPath}.heroTitle` : undefined;
  const heroSubtitleFieldPath = pageContent ? `${contactFieldPath}.heroSubtitle` : undefined;
  const emailFieldPath = pageContent ? `${contactFieldPath}.contactEmail` : undefined;
  const phoneFieldPath = pageContent ? `${contactFieldPath}.phone` : undefined;
  const addressFieldPath = pageContent ? `${contactFieldPath}.address` : undefined;
  const mapEmbedFieldPath = pageContent ? `${contactFieldPath}.mapEmbedUrl` : undefined;

  return (
    <div className="py-16 sm:py-24">
      <Seo title={pageTitle} description={metaDescription} image={socialImage} locale={language} />
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {(heroTitle || heroSubtitle) && (
          <header className="mb-16 text-center space-y-4">
            {heroTitle ? (
              <h1
                className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl"
                {...getVisualEditorAttributes(heroTitleFieldPath)}
              >
                {heroTitle}
              </h1>
            ) : null}
            {heroSubtitle ? (
              <p
                className="mx-auto max-w-2xl text-lg text-stone-600"
                {...getVisualEditorAttributes(heroSubtitleFieldPath)}
              >
                {heroSubtitle}
              </p>
            ) : null}
          </header>
        )}

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-10">
            <section className="space-y-8">
              <div className="space-y-3">
                <h2
                  className="text-2xl font-semibold text-stone-900"
                  {...getVisualEditorAttributes(`${translationFieldPath}.infoTitle`)}
                >
                  {t('contact.infoTitle')}
                </h2>
              </div>

              <div className="space-y-6">
                {contactEmail ? (
                  <div className="flex items-start gap-4">
                    <Mail className="mt-1 h-6 w-6 text-stone-500" aria-hidden="true" />
                    <div className="space-y-1">
                      <h3
                        className="font-semibold text-stone-900"
                        {...getVisualEditorAttributes(`${translationFieldPath}.emailTitle`)}
                      >
                        {t('contact.emailTitle')}
                      </h3>
                      <a
                        href={emailHref}
                        className="text-stone-600 transition-colors hover:text-stone-900"
                        {...getVisualEditorAttributes(emailFieldPath)}
                      >
                        {contactEmail}
                      </a>
                    </div>
                  </div>
                ) : null}

                {phone ? (
                  <div className="flex items-start gap-4">
                    <Phone className="mt-1 h-6 w-6 text-stone-500" aria-hidden="true" />
                    <div className="space-y-1">
                      <h3
                        className="font-semibold text-stone-900"
                        {...getVisualEditorAttributes(`${translationFieldPath}.phoneTitle`)}
                      >
                        {t('contact.phoneTitle')}
                      </h3>
                      {phoneHref ? (
                        <a
                          href={phoneHref}
                          className="text-stone-600 transition-colors hover:text-stone-900"
                          {...getVisualEditorAttributes(phoneFieldPath)}
                        >
                          {phone}
                        </a>
                      ) : (
                        <p className="text-stone-600" {...getVisualEditorAttributes(phoneFieldPath)}>
                          {phone}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}

                {displayAddressLines.length > 0 ? (
                  <div className="flex items-start gap-4">
                    <MapPin className="mt-1 h-6 w-6 text-stone-500" aria-hidden="true" />
                    <div className="space-y-1">
                      <h3
                        className="font-semibold text-stone-900"
                        {...getVisualEditorAttributes(`${translationFieldPath}.addressTitle`)}
                      >
                        {t('contact.addressTitle')}
                      </h3>
                      <address
                        className="not-italic text-stone-600"
                        {...getVisualEditorAttributes(addressFieldPath)}
                      >
                        {displayAddressLines.map((line, index) => (
                          <div key={`${line}-${index}`}>{line}</div>
                        ))}
                      </address>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <div className="lg:pl-8">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2
                className="mb-6 text-2xl font-semibold text-stone-900"
                {...getVisualEditorAttributes(`${translationFieldPath}.formTitle`)}
              >
                {t('contact.formTitle')}
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>

        {mapEmbedUrl ? (
          <div className="mt-16">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg">
              <iframe
                src={mapEmbedUrl}
                title="Kapunka location map"
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                {...getVisualEditorAttributes(mapEmbedFieldPath)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Contact;
