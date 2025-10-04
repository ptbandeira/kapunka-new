import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import PartnerCarousel from '../components/PartnerCarousel';
import type { Doctor } from '../types';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import {
  loadClinicsPageContent,
  type ClinicsPageContentResult,
} from '../utils/loadClinicsPageContent';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';

interface ClinicProtocol {
  title: string;
  focus: string;
  steps: string[];
  evidence: string;
}

interface ClinicProtocolSection {
  title: string;
  subtitle: string;
  cards: ClinicProtocol[];
}

interface ClinicStudy {
  title: string;
  details: string;
}

interface ClinicTestimonial {
  quote: string;
  name: string;
  credentials: string;
}

interface ClinicReferencesSection {
  title: string;
  studiesTitle: string;
  studies: ClinicStudy[];
  testimonialsTitle: string;
  testimonials: ClinicTestimonial[];
}

interface DoctorsResponse {
  doctors?: Doctor[];
}

interface ClinicFAQ {
  question: string;
  answer: string;
}

interface ClinicFAQSection {
  title: string;
  subtitle: string;
  items: ClinicFAQ[];
}

interface ClinicKeywordSection {
  title: string;
  subtitle: string;
  keywords: string[];
}

const isProtocolSection = (value: unknown): value is ClinicProtocolSection => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const section = value as Record<string, unknown>;
  return (
    typeof section.title === 'string' &&
    typeof section.subtitle === 'string' &&
    Array.isArray(section.cards)
  );
};

const isReferencesSection = (value: unknown): value is ClinicReferencesSection => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const section = value as Record<string, unknown>;
  return (
    typeof section.title === 'string' &&
    typeof section.studiesTitle === 'string' &&
    Array.isArray(section.studies) &&
    typeof section.testimonialsTitle === 'string' &&
    Array.isArray(section.testimonials)
  );
};

const isFaqSection = (value: unknown): value is ClinicFAQSection => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const section = value as Record<string, unknown>;
  return (
    typeof section.title === 'string' &&
    typeof section.subtitle === 'string' &&
    Array.isArray(section.items)
  );
};

const isKeywordSection = (value: unknown): value is ClinicKeywordSection => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const section = value as Record<string, unknown>;
  return (
    typeof section.title === 'string' &&
    typeof section.subtitle === 'string' &&
    Array.isArray(section.keywords)
  );
};

const ForClinics: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    settings: { clinics },
  } = useSiteSettings();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pageContent, setPageContent] = useState<ClinicsPageContentResult | null>(null);
  const { contentVersion } = useVisualEditorSync();

  const clinicsFieldPath = useMemo(() => {
    if (!pageContent) {
      return `pages.clinics_${language}`;
    }

    return pageContent.source === 'visual-editor'
      ? `site.content.${pageContent.locale}.pages.clinics`
      : `pages.clinics_${pageContent.locale}`;
  }, [language, pageContent]);

  const commonFieldPath = `translations.${language}.common`;

  const clinicsCtaLink = clinics?.ctaLink ?? '#/contact';

  useEffect(() => {
    let isMounted = true;

    setPageContent(null);

    loadClinicsPageContent(language)
      .then((result) => {
        if (!isMounted) {
          return;
        }
        setPageContent(result);
      })
      .catch((error) => {
        console.error('Failed to load clinics page content', error);
        if (isMounted) {
          setPageContent(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [language, contentVersion]);

  const translationProtocolSection = t<unknown>('clinics.protocolSection');
  const translationReferencesSection = t<unknown>('clinics.referencesSection');
  const translationFaqSection = t<unknown>('clinics.faqSection');
  const translationKeywordSection = t<unknown>('clinics.keywordSection');

  const metaTitle = pageContent?.data.metaTitle ?? t('clinics.title');
  const metaDescription = pageContent?.data.metaDescription ?? t('clinics.metaDescription');

  const headerTitle = pageContent?.data.headerTitle ?? t('clinics.headerTitle');
  const headerSubtitle = pageContent?.data.headerSubtitle ?? t('clinics.headerSubtitle');

  const introBlock = pageContent?.data.intro ?? {
    title: pageContent?.data.section1Title,
    text1: pageContent?.data.section1Text1,
    text2: pageContent?.data.section1Text2,
  };

  const introTitle = introBlock?.title ?? pageContent?.data.section1Title ?? t('clinics.section1Title');
  const introText1 = introBlock?.text1 ?? pageContent?.data.section1Text1 ?? t('clinics.section1Text1');
  const introText2 = introBlock?.text2 ?? pageContent?.data.section1Text2 ?? t('clinics.section1Text2');

  const pageProtocolSection = pageContent?.data.protocolSection;
  const protocolSectionData: ClinicProtocolSection = isProtocolSection(pageProtocolSection)
    ? pageProtocolSection
    : isProtocolSection(translationProtocolSection)
      ? translationProtocolSection
      : {
          title: '',
          subtitle: '',
          cards: [],
        };
  const pageReferencesSection = pageContent?.data.referencesSection;
  const referencesSectionData: ClinicReferencesSection = isReferencesSection(pageReferencesSection)
    ? pageReferencesSection
    : isReferencesSection(translationReferencesSection)
      ? translationReferencesSection
      : {
          title: '',
          studiesTitle: '',
          studies: [],
          testimonialsTitle: '',
          testimonials: [],
        };
  const pageFaqSection = pageContent?.data.faqSection;
  const faqSectionData: ClinicFAQSection = isFaqSection(pageFaqSection)
    ? pageFaqSection
    : isFaqSection(translationFaqSection)
      ? translationFaqSection
      : {
          title: '',
          subtitle: '',
          items: [],
        };
  const pageKeywordSection = pageContent?.data.keywordSection;
  const keywordSectionData: ClinicKeywordSection = isKeywordSection(pageKeywordSection)
    ? pageKeywordSection
    : isKeywordSection(translationKeywordSection)
      ? translationKeywordSection
      : {
          title: '',
          subtitle: '',
          keywords: [],
        };

  const protocolCards = protocolSectionData.cards;
  const studies = referencesSectionData.studies;
  const testimonials = referencesSectionData.testimonials;
  const faqItems = faqSectionData.items;
  const keywordPhrases = keywordSectionData.keywords;

  const doctorsTitle = pageContent?.data.doctorsTitle ?? t('clinics.doctorsTitle');
  const ctaTitle = pageContent?.data.ctaTitle ?? t('clinics.ctaTitle');
  const ctaSubtitle = pageContent?.data.ctaSubtitle ?? t('clinics.ctaSubtitle');
  const ctaButtonLabel = pageContent?.data.ctaButton ?? t('clinics.ctaButton');
  const partnersTitle = pageContent?.data.partnersTitle ?? t('clinics.partnersTitle');

  const headerTitleFieldPath = `${clinicsFieldPath}.headerTitle`;
  const headerSubtitleFieldPath = `${clinicsFieldPath}.headerSubtitle`;
  const introTitleFieldPath = `${clinicsFieldPath}.intro.title`;
  const introText1FieldPath = `${clinicsFieldPath}.intro.text1`;
  const introText2FieldPath = `${clinicsFieldPath}.intro.text2`;
  const doctorsTitleFieldPath = `${clinicsFieldPath}.doctorsTitle`;
  const ctaTitleFieldPath = `${clinicsFieldPath}.ctaTitle`;
  const ctaSubtitleFieldPath = `${clinicsFieldPath}.ctaSubtitle`;
  const ctaButtonFieldPath = `${clinicsFieldPath}.ctaButton`;
  const partnersTitleFieldPath = `${clinicsFieldPath}.partnersTitle`;

  useEffect(() => {
    let isMounted = true;

    const loadDoctors = async () => {
      try {
        const data = await fetchVisualEditorJson<DoctorsResponse>('/content/doctors.json');
        if (!isMounted) {
          return;
        }
        setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load doctors', error);
        }
      }
    };

    loadDoctors().catch((error) => {
      console.error('Unhandled error while loading doctors', error);
    });

    return () => {
      isMounted = false;
    };
  }, [contentVersion]);

  return (
    <div>
      <Helmet>
        <title>{metaTitle} | Kapunka Skincare</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      <header className="py-20 sm:py-32 bg-stone-100 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight"
            {...getVisualEditorAttributes(headerTitleFieldPath)}
          >
            {headerTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto"
            {...getVisualEditorAttributes(headerSubtitleFieldPath)}
          >
            {headerSubtitle}
          </motion.p>
        </div>
      </header>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2
              className="text-3xl font-semibold mb-6"
              {...getVisualEditorAttributes(introTitleFieldPath)}
            >
              {introTitle}
            </h2>
            <div className="text-stone-600 leading-relaxed space-y-4">
              <p {...getVisualEditorAttributes(introText1FieldPath)}>
                {introText1}
              </p>
              <p {...getVisualEditorAttributes(introText2FieldPath)}>
                {introText2}
              </p>
            </div>
          </div>
        </div>
      </section>

      {protocolCards.length > 0 && (
        <section className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2
                className="text-3xl font-semibold mb-4"
                {...getVisualEditorAttributes(`${clinicsFieldPath}.protocolSection.title`)}
              >
                {protocolSectionData.title}
              </h2>
              <p
                className="text-stone-600"
                {...getVisualEditorAttributes(`${clinicsFieldPath}.protocolSection.subtitle`)}
              >
                {protocolSectionData.subtitle}
              </p>
            </div>
            <div
              className="mt-12 grid gap-10 lg:grid-cols-3"
              {...getVisualEditorAttributes(`${clinicsFieldPath}.protocolSection.cards`)}
            >
              {protocolCards.map((protocol, index) => (
                <motion.div
                  key={protocol.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-8 bg-stone-50 border border-stone-200 rounded-2xl shadow-sm text-left h-full flex flex-col"
                  {...getVisualEditorAttributes(`${clinicsFieldPath}.protocolSection.cards.${index}`)}
                >
                  <h3
                    className="text-2xl font-semibold text-stone-900"
                    {...getVisualEditorAttributes(`${clinicsFieldPath}.protocolSection.cards.${index}.title`)}
                  >
                    {protocol.title}
                  </h3>
                  <p
                    className="mt-2 text-sm uppercase tracking-wide text-stone-500"
                    {...getVisualEditorAttributes(`${clinicsFieldPath}.protocolSection.cards.${index}.focus`)}
                  >
                    {protocol.focus}
                  </p>
                  <ul className="mt-6 space-y-4 text-stone-600 flex-1">
                    {protocol.steps.map((step, stepIndex) => (
                      <li
                        key={`${protocol.title}-${step}`}
                        className="relative pl-6"
                        {...getVisualEditorAttributes(`${clinicsFieldPath}.protocolSection.cards.${index}.steps.${stepIndex}`)}
                      >
                        <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-stone-400" />
                        {step}
                      </li>
                    ))}
                  </ul>
                  <p
                    className="mt-6 text-sm text-stone-500 italic"
                    {...getVisualEditorAttributes(`${clinicsFieldPath}.protocolSection.cards.${index}.evidence`)}
                  >
                    {protocol.evidence}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {(studies.length > 0 || testimonials.length > 0) && (
        <section className="py-16 sm:py-24 bg-stone-100/70">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2
                className="text-3xl font-semibold"
                {...getVisualEditorAttributes(`${clinicsFieldPath}.referencesSection.title`)}
              >
                {referencesSectionData.title}
              </h2>
            </div>
            <div className="mt-12 grid gap-12 md:grid-cols-2">
              {studies.length > 0 && (
                <div {...getVisualEditorAttributes(`${clinicsFieldPath}.referencesSection.studies`)}>
                  <h3
                    className="text-xl font-semibold text-stone-900"
                    {...getVisualEditorAttributes(`${clinicsFieldPath}.referencesSection.studiesTitle`)}
                  >
                    {referencesSectionData.studiesTitle}
                  </h3>
                  <ul className="mt-4 space-y-4 text-stone-700">
                    {studies.map((study, index) => (
                      <li
                        key={study.title}
                        className="border-l-2 border-stone-400 pl-4"
                        {...getVisualEditorAttributes(`${clinicsFieldPath}.referencesSection.studies.${index}`)}
                      >
                        <p
                          className="font-medium"
                          {...getVisualEditorAttributes(`${clinicsFieldPath}.referencesSection.studies.${index}.title`)}
                        >
                          {study.title}
                        </p>
                        <p
                          className="text-sm text-stone-500"
                          {...getVisualEditorAttributes(`${clinicsFieldPath}.referencesSection.studies.${index}.details`)}
                        >
                          {study.details}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {testimonials.length > 0 && (
                <div {...getVisualEditorAttributes(`${clinicsFieldPath}.referencesSection.testimonials`)}>
                  <h3
                    className="text-xl font-semibold text-stone-900"
                    {...getVisualEditorAttributes(`${clinicsFieldPath}.referencesSection.testimonialsTitle`)}
                  >
                    {referencesSectionData.testimonialsTitle}
                  </h3>
                  <div className="mt-4 space-y-6">
                    {testimonials.map((testimonial, index) => (
                      <blockquote
                        key={testimonial.quote}
                        className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm"
                        {...getVisualEditorAttributes(`${clinicsFieldPath}.referencesSection.testimonials.${index}`)}
                      >
                        <p
                          className="text-stone-700 leading-relaxed"
                          {...getVisualEditorAttributes(`${clinicsFieldPath}.referencesSection.testimonials.${index}.quote`)}
                        >
                          {testimonial.quote}
                        </p>
                        <footer className="mt-4 text-sm text-stone-500">
                          <span
                            className="font-semibold text-stone-700"
                            {...getVisualEditorAttributes(`${clinicsFieldPath}.referencesSection.testimonials.${index}.name`)}
                          >
                            {testimonial.name}
                          </span>
                          <span
                            className="block"
                            {...getVisualEditorAttributes(`${clinicsFieldPath}.referencesSection.testimonials.${index}.credentials`)}
                          >
                            {testimonial.credentials}
                          </span>
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 sm:py-24 bg-stone-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-3xl font-semibold text-center mb-12"
            {...getVisualEditorAttributes(doctorsTitleFieldPath)}
          >
            {doctorsTitle}
          </h2>
          {doctors.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
              {doctors.map((doctor, index) => (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  {...getVisualEditorAttributes(`doctors.doctors.${index}`)}
                >
                  <img
                    src={doctor.imageUrl}
                    alt={doctor.name}
                    className="w-24 h-24 rounded-full mx-auto object-cover shadow-md"
                    {...getVisualEditorAttributes(`doctors.doctors.${index}.imageUrl`)}
                  />
                  <p
                    className="mt-4 font-semibold text-sm"
                    {...getVisualEditorAttributes(`doctors.doctors.${index}.name`)}
                  >
                    {doctor.name}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center" {...getVisualEditorAttributes(`${commonFieldPath}.loadingProfessionals`)}>
              {t('common.loadingProfessionals')}
            </p>
          )}
        </div>
      </section>

      {keywordPhrases.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2
              className="text-3xl font-semibold"
              {...getVisualEditorAttributes(`${clinicsFieldPath}.keywordSection.title`)}
            >
              {keywordSectionData.title}
            </h2>
            <p
              className="mt-4 text-stone-600 max-w-2xl mx-auto"
              {...getVisualEditorAttributes(`${clinicsFieldPath}.keywordSection.subtitle`)}
            >
              {keywordSectionData.subtitle}
            </p>
            <div
              className="mt-8 flex flex-wrap justify-center gap-3"
              {...getVisualEditorAttributes(`${clinicsFieldPath}.keywordSection.keywords`)}
            >
              {keywordPhrases.map((keyword, index) => (
                <span
                  key={keyword}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-full border border-stone-200 text-sm"
                  {...getVisualEditorAttributes(`${clinicsFieldPath}.keywordSection.keywords.${index}`)}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {faqItems.length > 0 && (
        <section className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center">
              <h2
                className="text-3xl font-semibold"
                {...getVisualEditorAttributes(`${clinicsFieldPath}.faqSection.title`)}
              >
                {faqSectionData.title}
              </h2>
              <p
                className="mt-4 text-stone-600"
                {...getVisualEditorAttributes(`${clinicsFieldPath}.faqSection.subtitle`)}
              >
                {faqSectionData.subtitle}
              </p>
            </div>
            <div className="mt-12 space-y-6" {...getVisualEditorAttributes(`${clinicsFieldPath}.faqSection.items`)}>
              {faqItems.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-stone-50 border border-stone-200 rounded-2xl p-6"
                  {...getVisualEditorAttributes(`${clinicsFieldPath}.faqSection.items.${index}`)}
                >
                  <h3
                    className="text-xl font-semibold text-stone-900"
                    {...getVisualEditorAttributes(`${clinicsFieldPath}.faqSection.items.${index}.question`)}
                  >
                    {faq.question}
                  </h3>
                  <p
                    className="mt-3 text-stone-600 leading-relaxed"
                    {...getVisualEditorAttributes(`${clinicsFieldPath}.faqSection.items.${index}.answer`)}
                  >
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <PartnerCarousel title={partnersTitle} fieldPath={partnersTitleFieldPath} />

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-2xl">
          <h2
            className="text-3xl font-semibold mb-4"
            {...getVisualEditorAttributes(ctaTitleFieldPath)}
          >
            {ctaTitle}
          </h2>
          <p
            className="text-stone-600 mb-8"
            {...getVisualEditorAttributes(ctaSubtitleFieldPath)}
          >
            {ctaSubtitle}
          </p>
          <a
            href={clinicsCtaLink}
            className="px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors"
          >
            <span {...getVisualEditorAttributes(ctaButtonFieldPath)}>
              {ctaButtonLabel}
            </span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default ForClinics;
