import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../types';

interface MethodTestimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
}

interface MethodSectionContent {
  title: string;
  body: string;
}

interface MethodSections {
  ourOrigins: MethodSectionContent;
  artisanExtraction: MethodSectionContent;
  clinicalRigor: MethodSectionContent;
  sustainabilityImpact: MethodSectionContent;
}

interface MethodLocaleContent {
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  body: string;
  sections: MethodSections;
  testimonialsTitle: string;
  testimonials: MethodTestimonial[];
}

type MethodContent = Record<Language, MethodLocaleContent>;

type MethodSectionKey = keyof MethodSections;

const fallbackHeroTitles: Record<Language, string> = {
  en: 'Method Kapunka',
  pt: 'Método Kapunka',
  es: 'Método Kapunka',
};

const fallbackMetaDescriptions: Record<Language, string> = {
  en: 'Sensitive care rooted in Berber tradition and modern dermal science.',
  pt: 'Cuidado sensível enraizado na tradição berbere e na ciência dermal moderna.',
  es: 'Cuidado sensible arraigado en la tradición bereber y la ciencia dérmica moderna.',
};

const Method: React.FC = () => {
  const { language, t } = useLanguage();
  const [content, setContent] = useState<MethodContent | null>(null);

  useEffect(() => {
    fetch('/content/method.json')
      .then((res) => res.json())
      .then((data: MethodContent) => {
        setContent(data);
      })
      .catch((error) => {
        console.error('Failed to load Method Kapunka content', error);
      });
  }, []);

  const localeContent = content?.[language];
  const methodFieldPath = `method.${language}`;
  const heroTitle = localeContent?.heroTitle ?? fallbackHeroTitles[language];
  const heroSubtitle = localeContent?.heroSubtitle ?? fallbackMetaDescriptions[language];
  const metaTitle = localeContent?.metaTitle ?? heroTitle;
  const metaDescription = localeContent?.metaDescription ?? fallbackMetaDescriptions[language];
  const paragraphs = localeContent?.body.split('\n\n') ?? [];
  const sectionsContent = localeContent?.sections;
  const testimonials = localeContent?.testimonials ?? [];
  const testimonialsTitle = localeContent?.testimonialsTitle ?? heroTitle;

  const sectionOrder: MethodSectionKey[] = [
    'ourOrigins',
    'artisanExtraction',
    'clinicalRigor',
    'sustainabilityImpact',
  ];

  const fallbackSectionTitles: Record<MethodSectionKey, Record<Language, string>> = {
    ourOrigins: {
      en: 'Our Origins',
      pt: 'Nossas Origens',
      es: 'Nuestros Orígenes',
    },
    artisanExtraction: {
      en: 'Artisan Extraction',
      pt: 'Extração Artesanal',
      es: 'Extracción Artesanal',
    },
    clinicalRigor: {
      en: 'Clinical Rigor',
      pt: 'Rigor Clínico',
      es: 'Rigor Clínico',
    },
    sustainabilityImpact: {
      en: 'Sustainability & Impact',
      pt: 'Sustentabilidade e Impacto',
      es: 'Sostenibilidad e Impacto',
    },
  };

  const orderedSections = sectionOrder
    .map((key) => {
      const section = sectionsContent?.[key];
      if (!section) {
        return null;
      }

      const title = section.title || fallbackSectionTitles[key][language];
      const sectionParagraphs = section.body ? section.body.split('\n\n') : [];

      return {
        key,
        title,
        paragraphs: sectionParagraphs,
      };
    })
    .filter((section): section is { key: MethodSectionKey; title: string; paragraphs: string[] } => section !== null);

  return (
    <div>
      <Helmet>
        <title>{`${metaTitle} | Kapunka Skincare`}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>

      <header className="py-20 sm:py-32 bg-stone-100 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-semibold tracking-tight"
            data-nlv-field-path={`${methodFieldPath}.heroTitle`}
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto"
            data-nlv-field-path={`${methodFieldPath}.heroSubtitle`}
          >
            {heroSubtitle}
          </motion.p>
        </div>
      </header>

      <section className="py-16 sm:py-24">
        <div
          className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl"
          data-nlv-field-path={`${methodFieldPath}.body`}
        >
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <motion.p
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`text-stone-700 leading-relaxed ${index > 0 ? 'mt-6' : ''}`}
              >
                {paragraph}
              </motion.p>
            ))
          ) : (
            <p
              className="text-center text-stone-600"
              data-nlv-field-path={`translations.${language}.common.loading`}
            >
              {t('common.loading')}
            </p>
          )}
        </div>
      </section>

      {orderedSections.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-16">
            {orderedSections.map((section, index) => (
              <motion.article
                key={section.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                data-nlv-field-path={`${methodFieldPath}.sections.${section.key}`}
              >
                <h2
                  className="text-3xl font-semibold text-stone-900"
                  data-nlv-field-path={`${methodFieldPath}.sections.${section.key}.title`}
                >
                  {section.title}
                </h2>
                <div
                  className="mt-4 space-y-6"
                  data-nlv-field-path={`${methodFieldPath}.sections.${section.key}.body`}
                >
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p
                      // eslint-disable-next-line react/no-array-index-key
                      key={paragraphIndex}
                      className="text-stone-700 leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      )}

      <section className="py-16 sm:py-24 bg-stone-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-semibold"
              data-nlv-field-path={`${methodFieldPath}.testimonialsTitle`}
            >
              {testimonialsTitle}
            </motion.h2>
          </div>
          {testimonials.length > 0 ? (
            <div
              className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              data-nlv-field-path={`${methodFieldPath}.testimonials`}
            >
              {testimonials.map((testimonial, index) => (
                <motion.blockquote
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col"
                  data-nlv-field-path={`${methodFieldPath}.testimonials.${index}`}
                >
                  <p
                    className="text-stone-700 leading-relaxed flex-1"
                    data-nlv-field-path={`${methodFieldPath}.testimonials.${index}.quote`}
                  >
                    {testimonial.quote}
                  </p>
                  <footer className="mt-6 text-sm text-stone-500">
                    <span
                      className="block font-semibold text-stone-700"
                      data-nlv-field-path={`${methodFieldPath}.testimonials.${index}.name`}
                    >
                      {testimonial.name}
                    </span>
                    <span
                      className="block"
                      data-nlv-field-path={`${methodFieldPath}.testimonials.${index}.role`}
                    >
                      {testimonial.role}
                    </span>
                  </footer>
                </motion.blockquote>
              ))}
            </div>
          ) : (
            <p
              className="mt-8 text-center text-stone-600"
              data-nlv-field-path={`translations.${language}.common.loading`}
            >
              {t('common.loading')}
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Method;
