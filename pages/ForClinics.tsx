import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import PartnerCarousel from '../components/PartnerCarousel';
import type { Doctor } from '../types';

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

  const clinicsFieldPath = `translations.${language}.clinics`;
  const commonFieldPath = `translations.${language}.common`;

  const clinicsCtaLink = clinics?.ctaLink ?? '#/contact';

  const protocolSection = t<unknown>('clinics.protocolSection');
  const referencesSection = t<unknown>('clinics.referencesSection');
  const faqSection = t<unknown>('clinics.faqSection');
  const keywordSection = t<unknown>('clinics.keywordSection');

  const protocolSectionData: ClinicProtocolSection = isProtocolSection(protocolSection)
    ? protocolSection
    : {
        title: '',
        subtitle: '',
        cards: [],
      };
  const referencesSectionData: ClinicReferencesSection = isReferencesSection(referencesSection)
    ? referencesSection
    : {
        title: '',
        studiesTitle: '',
        studies: [],
        testimonialsTitle: '',
        testimonials: [],
      };
  const faqSectionData: ClinicFAQSection = isFaqSection(faqSection)
    ? faqSection
    : {
        title: '',
        subtitle: '',
        items: [],
      };
  const keywordSectionData: ClinicKeywordSection = isKeywordSection(keywordSection)
    ? keywordSection
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

  useEffect(() => {
    fetch('/content/doctors.json')
      .then((res) => res.json())
      .then((data) => setDoctors(data.doctors));
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
            data-nlv-field-path={`${clinicsFieldPath}.headerTitle`}
          >
            {t('clinics.headerTitle')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto"
            data-nlv-field-path={`${clinicsFieldPath}.headerSubtitle`}
          >
            {t('clinics.headerSubtitle')}
          </motion.p>
        </div>
      </header>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2
              className="text-3xl font-semibold mb-6"
              data-nlv-field-path={`${clinicsFieldPath}.section1Title`}
            >
              {t('clinics.section1Title')}
            </h2>
            <div className="text-stone-600 leading-relaxed space-y-4">
              <p data-nlv-field-path={`${clinicsFieldPath}.section1Text1`}>
                {t('clinics.section1Text1')}
              </p>
              <p data-nlv-field-path={`${clinicsFieldPath}.section1Text2`}>
                {t('clinics.section1Text2')}
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
                data-nlv-field-path={`${clinicsFieldPath}.protocolSection.title`}
              >
                {protocolSectionData.title}
              </h2>
              <p
                className="text-stone-600"
                data-nlv-field-path={`${clinicsFieldPath}.protocolSection.subtitle`}
              >
                {protocolSectionData.subtitle}
              </p>
            </div>
            <div
              className="mt-12 grid gap-10 lg:grid-cols-3"
              data-nlv-field-path={`${clinicsFieldPath}.protocolSection.cards`}
            >
              {protocolCards.map((protocol, index) => (
                <motion.div
                  key={protocol.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-8 bg-stone-50 border border-stone-200 rounded-2xl shadow-sm text-left h-full flex flex-col"
                  data-nlv-field-path={`${clinicsFieldPath}.protocolSection.cards.${index}`}
                >
                  <h3
                    className="text-2xl font-semibold text-stone-900"
                    data-nlv-field-path={`${clinicsFieldPath}.protocolSection.cards.${index}.title`}
                  >
                    {protocol.title}
                  </h3>
                  <p
                    className="mt-2 text-sm uppercase tracking-wide text-stone-500"
                    data-nlv-field-path={`${clinicsFieldPath}.protocolSection.cards.${index}.focus`}
                  >
                    {protocol.focus}
                  </p>
                  <ul className="mt-6 space-y-4 text-stone-600 flex-1">
                    {protocol.steps.map((step, stepIndex) => (
                      <li
                        key={`${protocol.title}-${stepIndex}`}
                        className="relative pl-6"
                        data-nlv-field-path={`${clinicsFieldPath}.protocolSection.cards.${index}.steps.${stepIndex}`}
                      >
                        <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-stone-400" />
                        {step}
                      </li>
                    ))}
                  </ul>
                  <p
                    className="mt-6 text-sm text-stone-500 italic"
                    data-nlv-field-path={`${clinicsFieldPath}.protocolSection.cards.${index}.evidence`}
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
                data-nlv-field-path={`${clinicsFieldPath}.referencesSection.title`}
              >
                {referencesSectionData.title}
              </h2>
            </div>
            <div className="mt-12 grid gap-12 md:grid-cols-2">
              {studies.length > 0 && (
                <div data-nlv-field-path={`${clinicsFieldPath}.referencesSection.studies`}>
                  <h3
                    className="text-xl font-semibold text-stone-900"
                    data-nlv-field-path={`${clinicsFieldPath}.referencesSection.studiesTitle`}
                  >
                    {referencesSectionData.studiesTitle}
                  </h3>
                  <ul className="mt-4 space-y-4 text-stone-700">
                    {studies.map((study, index) => (
                      <li
                        key={study.title}
                        className="border-l-2 border-stone-400 pl-4"
                        data-nlv-field-path={`${clinicsFieldPath}.referencesSection.studies.${index}`}
                      >
                        <p
                          className="font-medium"
                          data-nlv-field-path={`${clinicsFieldPath}.referencesSection.studies.${index}.title`}
                        >
                          {study.title}
                        </p>
                        <p
                          className="text-sm text-stone-500"
                          data-nlv-field-path={`${clinicsFieldPath}.referencesSection.studies.${index}.details`}
                        >
                          {study.details}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {testimonials.length > 0 && (
                <div data-nlv-field-path={`${clinicsFieldPath}.referencesSection.testimonials`}>
                  <h3
                    className="text-xl font-semibold text-stone-900"
                    data-nlv-field-path={`${clinicsFieldPath}.referencesSection.testimonialsTitle`}
                  >
                    {referencesSectionData.testimonialsTitle}
                  </h3>
                  <div className="mt-4 space-y-6">
                    {testimonials.map((testimonial, index) => (
                      <blockquote
                        key={testimonial.quote}
                        className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm"
                        data-nlv-field-path={`${clinicsFieldPath}.referencesSection.testimonials.${index}`}
                      >
                        <p
                          className="text-stone-700 leading-relaxed"
                          data-nlv-field-path={`${clinicsFieldPath}.referencesSection.testimonials.${index}.quote`}
                        >
                          {testimonial.quote}
                        </p>
                        <footer className="mt-4 text-sm text-stone-500">
                          <span
                            className="font-semibold text-stone-700"
                            data-nlv-field-path={`${clinicsFieldPath}.referencesSection.testimonials.${index}.name`}
                          >
                            {testimonial.name}
                          </span>
                          <span
                            className="block"
                            data-nlv-field-path={`${clinicsFieldPath}.referencesSection.testimonials.${index}.credentials`}
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
            data-nlv-field-path={`${clinicsFieldPath}.doctorsTitle`}
          >
            {t('clinics.doctorsTitle')}
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
                  data-nlv-field-path={`doctors.doctors.${index}`}
                >
                  <img
                    src={doctor.imageUrl}
                    alt={doctor.name}
                    className="w-24 h-24 rounded-full mx-auto object-cover shadow-md"
                    data-nlv-field-path={`doctors.doctors.${index}.imageUrl`}
                  />
                  <p
                    className="mt-4 font-semibold text-sm"
                    data-nlv-field-path={`doctors.doctors.${index}.name`}
                  >
                    {doctor.name}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center" data-nlv-field-path={`${commonFieldPath}.loadingProfessionals`}>
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
              data-nlv-field-path={`${clinicsFieldPath}.keywordSection.title`}
            >
              {keywordSectionData.title}
            </h2>
            <p
              className="mt-4 text-stone-600 max-w-2xl mx-auto"
              data-nlv-field-path={`${clinicsFieldPath}.keywordSection.subtitle`}
            >
              {keywordSectionData.subtitle}
            </p>
            <div
              className="mt-8 flex flex-wrap justify-center gap-3"
              data-nlv-field-path={`${clinicsFieldPath}.keywordSection.keywords`}
            >
              {keywordPhrases.map((keyword, index) => (
                <span
                  key={`${keyword}-${index}`}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-full border border-stone-200 text-sm"
                  data-nlv-field-path={`${clinicsFieldPath}.keywordSection.keywords.${index}`}
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
                data-nlv-field-path={`${clinicsFieldPath}.faqSection.title`}
              >
                {faqSectionData.title}
              </h2>
              <p
                className="mt-4 text-stone-600"
                data-nlv-field-path={`${clinicsFieldPath}.faqSection.subtitle`}
              >
                {faqSectionData.subtitle}
              </p>
            </div>
            <div className="mt-12 space-y-6" data-nlv-field-path={`${clinicsFieldPath}.faqSection.items`}>
              {faqItems.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-stone-50 border border-stone-200 rounded-2xl p-6"
                  data-nlv-field-path={`${clinicsFieldPath}.faqSection.items.${index}`}
                >
                  <h3
                    className="text-xl font-semibold text-stone-900"
                    data-nlv-field-path={`${clinicsFieldPath}.faqSection.items.${index}.question`}
                  >
                    {faq.question}
                  </h3>
                  <p
                    className="mt-3 text-stone-600 leading-relaxed"
                    data-nlv-field-path={`${clinicsFieldPath}.faqSection.items.${index}.answer`}
                  >
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <PartnerCarousel />

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-2xl">
          <h2
            className="text-3xl font-semibold mb-4"
            data-nlv-field-path={`${clinicsFieldPath}.ctaTitle`}
          >
            {t('clinics.ctaTitle')}
          </h2>
          <p
            className="text-stone-600 mb-8"
            data-nlv-field-path={`${clinicsFieldPath}.ctaSubtitle`}
          >
            {t('clinics.ctaSubtitle')}
          </p>
          <a
            href={clinicsCtaLink}
            className="px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors"
          >
            <span data-nlv-field-path={`${clinicsFieldPath}.ctaButton`}>
              {t('clinics.ctaButton')}
            </span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default ForClinics;