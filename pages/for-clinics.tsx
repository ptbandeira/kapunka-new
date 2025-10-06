import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { getCloudinaryUrl } from '../utils/imageUrl';
import {
  loadClinicsPageContent,
  type ClinicsPageContentResult,
} from '../utils/loadClinicsPageContent';
import Seo from '../src/components/Seo';

interface ProtocolCard {
  title?: string;
  focus?: string;
  steps?: string[];
  evidence?: string;
}

interface ProtocolSection {
  title?: string;
  subtitle?: string;
  cards?: ProtocolCard[];
}

interface TextWithFieldPath {
  value: string;
  fieldPath: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isStringArray = (value: unknown): value is string[] => (
  Array.isArray(value) && value.every((item) => typeof item === 'string')
);

const isProtocolCard = (value: unknown): value is ProtocolCard => {
  if (!isRecord(value)) {
    return false;
  }

  const { title, focus, steps, evidence } = value as Record<string, unknown>;

  const titleValid = title === undefined || typeof title === 'string';
  const focusValid = focus === undefined || typeof focus === 'string';
  const stepsValid = steps === undefined || isStringArray(steps);
  const evidenceValid = evidence === undefined || typeof evidence === 'string';

  return titleValid && focusValid && stepsValid && evidenceValid;
};

const isProtocolSection = (value: unknown): value is ProtocolSection => {
  if (!isRecord(value)) {
    return false;
  }

  const { title, subtitle, cards } = value as Record<string, unknown>;

  const titleValid = title === undefined || typeof title === 'string';
  const subtitleValid = subtitle === undefined || typeof subtitle === 'string';
  const cardsValid = cards === undefined || (
    Array.isArray(cards) && cards.every(isProtocolCard)
  );

  return titleValid && subtitleValid && cardsValid;
};

const hasContent = (value: unknown): value is string => (
  typeof value === 'string' && value.trim().length > 0
);

const ForClinics: React.FC = () => {
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();
  const { contentVersion } = useVisualEditorSync();
  const [pageContent, setPageContent] = useState<ClinicsPageContentResult | null>(null);

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

  const clinicsFieldPath = useMemo(() => {
    if (!pageContent) {
      return `pages.clinics_${language}`;
    }

    return pageContent.source === 'visual-editor'
      ? `site.content.${pageContent.locale}.pages.clinics`
      : `pages.clinics_${pageContent.locale}`;
  }, [language, pageContent]);

  const translationsFieldPath = `translations.${language}.clinics`;

  const baseMetaTitle = hasContent(pageContent?.data.metaTitle)
    ? pageContent?.data.metaTitle ?? ''
    : hasContent(t<string>('clinics.metaTitle'))
      ? t<string>('clinics.metaTitle')
      : t<string>('clinics.title');

  const pageTitle = baseMetaTitle.includes('Kapunka')
    ? baseMetaTitle
    : `${baseMetaTitle} | Kapunka Skincare`;

  const metaDescription = hasContent(pageContent?.data.metaDescription)
    ? pageContent?.data.metaDescription
    : t<string>('clinics.metaDescription');

  const heroTitleSource = (() => {
    if (hasContent(pageContent?.data.heroTitle)) {
      return {
        value: pageContent?.data.heroTitle ?? '',
        fieldPath: `${clinicsFieldPath}.heroTitle`,
      };
    }

    if (hasContent(pageContent?.data.headerTitle)) {
      return {
        value: pageContent?.data.headerTitle ?? '',
        fieldPath: `${clinicsFieldPath}.headerTitle`,
      };
    }

    if (hasContent(t<string>('clinics.heroTitle'))) {
      return {
        value: t<string>('clinics.heroTitle'),
        fieldPath: `${translationsFieldPath}.heroTitle`,
      };
    }

    return {
      value: t<string>('clinics.headerTitle'),
      fieldPath: `${translationsFieldPath}.headerTitle`,
    };
  })();

  const heroSubtitleSource = (() => {
    if (hasContent(pageContent?.data.heroSubtitle)) {
      return {
        value: pageContent?.data.heroSubtitle ?? '',
        fieldPath: `${clinicsFieldPath}.heroSubtitle`,
      };
    }

    if (hasContent(pageContent?.data.headerSubtitle)) {
      return {
        value: pageContent?.data.headerSubtitle ?? '',
        fieldPath: `${clinicsFieldPath}.headerSubtitle`,
      };
    }

    if (hasContent(t<string>('clinics.heroSubtitle'))) {
      return {
        value: t<string>('clinics.heroSubtitle'),
        fieldPath: `${translationsFieldPath}.heroSubtitle`,
      };
    }

    return {
      value: t<string>('clinics.headerSubtitle'),
      fieldPath: `${translationsFieldPath}.headerSubtitle`,
    };
  })();

  const protocolSectionSource = (() => {
    if (isProtocolSection(pageContent?.data.protocolSection)) {
      return {
        data: pageContent?.data.protocolSection as ProtocolSection,
        fieldPath: `${clinicsFieldPath}.protocolSection`,
      };
    }

    const translationProtocolSection = t<unknown>('clinics.protocolSection');
    if (isProtocolSection(translationProtocolSection)) {
      return {
        data: translationProtocolSection,
        fieldPath: `${translationsFieldPath}.protocolSection`,
      };
    }

    return null;
  })();

  const hasProtocolHeading = protocolSectionSource
    ? hasContent(protocolSectionSource.data.title) || hasContent(protocolSectionSource.data.subtitle)
    : false;

  const protocolCards = useMemo(() => {
    if (!protocolSectionSource) {
      return [] as ProtocolCard[];
    }

    const cards = protocolSectionSource.data.cards;
    if (!Array.isArray(cards) || cards.length === 0) {
      return [] as ProtocolCard[];
    }

    return cards.filter((card) => (
      Boolean(card)
      && (
        hasContent(card?.title)
        || hasContent(card?.focus)
        || (Array.isArray(card?.steps) && card.steps.some((step) => hasContent(step)))
        || hasContent(card?.evidence)
      )
    ));
  }, [protocolSectionSource]);

  const benefitsTitleSource = hasContent(pageContent?.data.section1Title)
    ? {
        value: pageContent?.data.section1Title ?? '',
        fieldPath: `${clinicsFieldPath}.section1Title`,
      }
    : {
        value: t<string>('clinics.section1Title'),
        fieldPath: `${translationsFieldPath}.section1Title`,
      };

  const section1Text1Source: TextWithFieldPath = hasContent(pageContent?.data.section1Text1)
    ? {
        value: pageContent?.data.section1Text1 ?? '',
        fieldPath: `${clinicsFieldPath}.section1Text1`,
      }
    : {
        value: t<string>('clinics.section1Text1'),
        fieldPath: `${translationsFieldPath}.section1Text1`,
      };

  const section1Text2Source: TextWithFieldPath = hasContent(pageContent?.data.section1Text2)
    ? {
        value: pageContent?.data.section1Text2 ?? '',
        fieldPath: `${clinicsFieldPath}.section1Text2`,
      }
    : {
        value: t<string>('clinics.section1Text2'),
        fieldPath: `${translationsFieldPath}.section1Text2`,
      };

  const benefitsParagraphs: TextWithFieldPath[] = [];
  if (hasContent(section1Text1Source.value)) {
    benefitsParagraphs.push(section1Text1Source);
  }
  if (
    hasContent(section1Text2Source.value)
    && section1Text2Source.value !== section1Text1Source.value
  ) {
    benefitsParagraphs.push(section1Text2Source);
  }

  const introContent = pageContent?.data.intro;
  const curriculumTitleSource = hasContent(introContent?.title)
    ? {
        value: introContent?.title ?? '',
        fieldPath: `${clinicsFieldPath}.intro.title`,
      }
    : benefitsTitleSource;

  const introText1Source: TextWithFieldPath = hasContent(introContent?.text1)
    ? {
        value: introContent?.text1 ?? '',
        fieldPath: `${clinicsFieldPath}.intro.text1`,
      }
    : section1Text1Source;

  const introText2Source: TextWithFieldPath = hasContent(introContent?.text2)
    ? {
        value: introContent?.text2 ?? '',
        fieldPath: `${clinicsFieldPath}.intro.text2`,
      }
    : section1Text2Source;

  const curriculumParagraphs: TextWithFieldPath[] = [];
  if (hasContent(introText1Source.value)) {
    curriculumParagraphs.push(introText1Source);
  }
  if (
    hasContent(introText2Source.value)
    && introText2Source.value !== introText1Source.value
  ) {
    curriculumParagraphs.push(introText2Source);
  }

  const ctaTitleSource = hasContent(pageContent?.data.ctaTitle)
    ? {
        value: pageContent?.data.ctaTitle ?? '',
        fieldPath: `${clinicsFieldPath}.ctaTitle`,
      }
    : {
        value: t<string>('clinics.ctaTitle'),
        fieldPath: `${translationsFieldPath}.ctaTitle`,
      };

  const ctaSubtitleSource = hasContent(pageContent?.data.ctaSubtitle)
    ? {
        value: pageContent?.data.ctaSubtitle ?? '',
        fieldPath: `${clinicsFieldPath}.ctaSubtitle`,
      }
    : {
        value: t<string>('clinics.ctaSubtitle'),
        fieldPath: `${translationsFieldPath}.ctaSubtitle`,
      };

  const ctaButtonSource = hasContent(pageContent?.data.ctaButton)
    ? {
        value: pageContent?.data.ctaButton ?? '',
        fieldPath: `${clinicsFieldPath}.ctaButton`,
      }
    : {
        value: t<string>('clinics.ctaButton'),
        fieldPath: `${translationsFieldPath}.ctaButton`,
      };

  const ctaLink = settings.clinics?.ctaLink ?? '#/contact';
  const rawSocialImage = settings.home?.heroImage?.trim() ?? '';
  const socialImage = rawSocialImage ? getCloudinaryUrl(rawSocialImage) ?? rawSocialImage : undefined;
  const rootObjectId = getVisualEditorAttributes(clinicsFieldPath)['data-sb-object-id'];

  return (
    <div className="bg-white text-stone-900" data-sb-object-id={rootObjectId}>
      <Seo
        title={pageTitle}
        description={metaDescription}
        image={socialImage}
        locale={language}
      />

      <main>
        <section className="bg-stone-100 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <motion.h1
              className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              {...getVisualEditorAttributes(heroTitleSource.fieldPath)}
            >
              {heroTitleSource.value}
            </motion.h1>
            <motion.p
              className="mt-5 text-lg text-stone-600 sm:text-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              {...getVisualEditorAttributes(heroSubtitleSource.fieldPath)}
            >
              {heroSubtitleSource.value}
            </motion.p>
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <a
                href={ctaLink}
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2"
                {...getVisualEditorAttributes(ctaButtonSource.fieldPath)}
              >
                {ctaButtonSource.value}
              </a>
            </motion.div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <motion.h2
              className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              {...getVisualEditorAttributes(benefitsTitleSource.fieldPath)}
            >
              {benefitsTitleSource.value}
            </motion.h2>
            <div className="mt-6 space-y-4 text-base text-stone-600 sm:text-lg">
              {benefitsParagraphs.map((paragraph, index) => (
                <motion.p
                  key={`${paragraph.fieldPath}-${index}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                  {...getVisualEditorAttributes(paragraph.fieldPath)}
                >
                  {paragraph.value}
                </motion.p>
              ))}
            </div>
          </div>
        </section>

        {protocolSectionSource && (hasProtocolHeading || protocolCards.length > 0) ? (
          <section className="bg-stone-50 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {hasContent(protocolSectionSource.data.title) ? (
                  <h2
                    className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl"
                    {...getVisualEditorAttributes(`${protocolSectionSource.fieldPath}.title`)}
                  >
                    {protocolSectionSource.data.title}
                  </h2>
                ) : null}
                {hasContent(protocolSectionSource.data.subtitle) ? (
                  <p
                    className="mt-4 max-w-3xl text-base text-stone-600 sm:text-lg"
                    {...getVisualEditorAttributes(`${protocolSectionSource.fieldPath}.subtitle`)}
                  >
                    {protocolSectionSource.data.subtitle}
                  </p>
                ) : null}
              </motion.div>

              {protocolCards.length > 0 ? (
                <div className="mt-10 grid gap-6 sm:grid-cols-2">
                  {protocolCards.map((card, index) => {
                    const cardFieldPath = `${protocolSectionSource.fieldPath}.cards.${index}`;
                    const title = card.title?.trim();
                    const focus = card.focus?.trim();
                    const evidence = card.evidence?.trim();
                    const steps = Array.isArray(card.steps)
                      ? card.steps
                        .map((step) => (typeof step === 'string' ? step.trim() : ''))
                        .filter((step) => step.length > 0)
                      : [];

                    return (
                      <motion.article
                        key={cardFieldPath}
                        className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        {...getVisualEditorAttributes(cardFieldPath)}
                      >
                        {title ? (
                          <h3
                            className="text-2xl font-semibold text-stone-900"
                            {...getVisualEditorAttributes(`${cardFieldPath}.title`)}
                          >
                            {title}
                          </h3>
                        ) : null}
                        {focus ? (
                          <p
                            className="mt-2 text-sm font-medium uppercase tracking-wide text-stone-500"
                            {...getVisualEditorAttributes(`${cardFieldPath}.focus`)}
                          >
                            {focus}
                          </p>
                        ) : null}
                        {steps.length > 0 ? (
                          <ul className="mt-4 space-y-3 text-sm text-stone-600">
                            {steps.map((step, stepIndex) => (
                              <li
                                key={`${cardFieldPath}.steps.${stepIndex}`}
                                className="flex gap-3"
                                {...getVisualEditorAttributes(`${cardFieldPath}.steps.${stepIndex}`)}
                              >
                                <span className="mt-1 inline-flex h-2 w-2 flex-none rounded-full bg-stone-900" aria-hidden="true" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {evidence ? (
                          <p
                            className="mt-4 text-sm text-stone-500"
                            {...getVisualEditorAttributes(`${cardFieldPath}.evidence`)}
                          >
                            {evidence}
                          </p>
                        ) : null}
                      </motion.article>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <motion.h2
              className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              {...getVisualEditorAttributes(curriculumTitleSource.fieldPath)}
            >
              {curriculumTitleSource.value}
            </motion.h2>
            <div className="mt-6 space-y-4 text-base text-stone-600 sm:text-lg">
              {curriculumParagraphs.map((paragraph, index) => (
                <motion.p
                  key={`${paragraph.fieldPath}-${index}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                  {...getVisualEditorAttributes(paragraph.fieldPath)}
                >
                  {paragraph.value}
                </motion.p>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-stone-900 py-16 text-white sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <motion.h2
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              {...getVisualEditorAttributes(ctaTitleSource.fieldPath)}
            >
              {ctaTitleSource.value}
            </motion.h2>
            <motion.p
              className="mt-4 text-base text-stone-200 sm:text-lg"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              {...getVisualEditorAttributes(ctaSubtitleSource.fieldPath)}
            >
              {ctaSubtitleSource.value}
            </motion.p>
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <a
                href={ctaLink}
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-stone-900 transition hover:bg-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
                {...getVisualEditorAttributes(ctaButtonSource.fieldPath)}
              >
                {ctaButtonSource.value}
              </a>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForClinics;
