import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../types';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';

interface SpecialtyItem {
  title: string;
  bullets: string[];
}

interface ClinicalNote {
  title: string;
  bullets: string[];
}

type MethodSection =
  | {
      type: 'facts';
      title: string;
      text: string;
    }
  | {
      type: 'bullets';
      title: string;
      items: string[];
    }
  | {
      type: 'specialties';
      title?: string;
      items?: SpecialtyItem[];
      specialties?: SpecialtyItem[];
    };

interface MethodPageContent {
  metaTitle?: string;
  metaDescription?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  sections?: MethodSection[];
  clinicalNotes?: ClinicalNote[];
}

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

const isSpecialtyItem = (value: unknown): value is SpecialtyItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return typeof item.title === 'string' && Array.isArray(item.bullets) && item.bullets.every((bullet) => typeof bullet === 'string');
};

const isClinicalNote = (value: unknown): value is ClinicalNote => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const note = value as Record<string, unknown>;
  return (
    typeof note.title === 'string'
    && Array.isArray(note.bullets)
    && note.bullets.every((bullet) => typeof bullet === 'string')
  );
};

const isMethodSection = (value: unknown): value is MethodSection => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;
  const type = section.type;

  if (type === 'facts') {
    return typeof section.title === 'string' && typeof section.text === 'string';
  }

  if (type === 'bullets') {
    return typeof section.title === 'string' && Array.isArray(section.items) && section.items.every((item) => typeof item === 'string');
  }

  if (type === 'specialties') {
    const items = section.items ?? section.specialties;
    return (
      (section.title === undefined || typeof section.title === 'string') &&
      Array.isArray(items) &&
      items.every(isSpecialtyItem)
    );
  }

  return false;
};

const isMethodPageContent = (value: unknown): value is MethodPageContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const content = value as Record<string, unknown>;

  if (content.sections !== undefined) {
    if (!Array.isArray(content.sections) || !content.sections.every(isMethodSection)) {
      return false;
    }
  }

  if (content.clinicalNotes !== undefined) {
    if (!Array.isArray(content.clinicalNotes) || !content.clinicalNotes.every(isClinicalNote)) {
      return false;
    }
  }

  return true;
};

const Method: React.FC = () => {
  const { language, t } = useLanguage();
  const [content, setContent] = useState<MethodPageContent | null>(null);
  const { contentVersion } = useVisualEditorSync();

  useEffect(() => {
    let isMounted = true;
    setContent(null);

    const loadContent = async () => {
      const localesToTry: Language[] = [language, 'en'].filter(
        (locale, index, arr) => arr.indexOf(locale) === index,
      ) as Language[];

      for (const locale of localesToTry) {
        try {
          const data = await fetchVisualEditorJson<unknown>(
            `/content/pages/${locale}/method.json`,
          );
          if (!isMounted) {
            return;
          }

          if (isMethodPageContent(data)) {
            setContent(data);
            return;
          }
        } catch (error) {
          if (locale === localesToTry[localesToTry.length - 1]) {
            console.error('Failed to load Method page content', error);
          }
        }
      }

      if (isMounted) {
        setContent(null);
      }
    };

    loadContent().catch((error) => {
      console.error('Unhandled error while loading Method page content', error);
    });

    return () => {
      isMounted = false;
    };
  }, [language, contentVersion]);

  const heroTitle = content?.heroTitle ?? fallbackHeroTitles[language];
  const heroSubtitle = content?.heroSubtitle ?? fallbackMetaDescriptions[language];
  const metaTitle = content?.metaTitle ?? heroTitle;
  const metaDescription = content?.metaDescription ?? fallbackMetaDescriptions[language];
  const sections = content?.sections ?? [];
  const clinicalNotes = content?.clinicalNotes?.filter((note) => {
    const hasTitle = note.title.trim().length > 0;
    const hasBullets = note.bullets.some((bullet) => bullet.trim().length > 0);
    return hasTitle || hasBullets;
  }) ?? [];
  const hasClinicalNotes = clinicalNotes.length > 0;
  const hasSections = sections.length > 0;

  const baseFieldPath = `pages.method_${language}`;
  const sectionsFieldPath = `${baseFieldPath}.sections`;
const clinicalNotesFieldPath = `${baseFieldPath}.clinicalNotes`;

const createMethodKey = (prefix: string, parts: Array<string | null | undefined>): string => {
  const key = parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0)
    .join('|');

  return key.length > 0 ? `${prefix}-${key}` : prefix;
};

  const renderSection = (section: MethodSection, index: number): React.ReactNode => {
    const sectionFieldPath = `${sectionsFieldPath}.${index}`;
    const animationDelay = index * 0.05;

    if (section.type === 'facts') {
      return (
        <motion.article
          key={createMethodKey('method-facts', [section.title, section.text])}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: animationDelay }}
          className="max-w-3xl mx-auto text-center"
          {...getVisualEditorAttributes(sectionFieldPath)}
        >
          <h3
            className="text-2xl font-semibold text-stone-900"
            {...getVisualEditorAttributes(`${sectionFieldPath}.title`)}
          >
            {section.title}
          </h3>
          <p
            className="mt-4 text-stone-700 leading-relaxed"
            {...getVisualEditorAttributes(`${sectionFieldPath}.text`)}
          >
            {section.text}
          </p>
        </motion.article>
      );
    }

    if (section.type === 'bullets') {
      const bulletItems = section.items ?? [];
      return (
        <motion.article
          key={createMethodKey('method-bullets', [section.title, bulletItems.join('|')])}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: animationDelay }}
          className="max-w-3xl mx-auto"
          {...getVisualEditorAttributes(sectionFieldPath)}
        >
          <h3
            className="text-2xl font-semibold text-stone-900"
            {...getVisualEditorAttributes(`${sectionFieldPath}.title`)}
          >
            {section.title}
          </h3>
          <ul className="mt-4 space-y-2 text-stone-700" {...getVisualEditorAttributes(`${sectionFieldPath}.items`)}>
            {bulletItems.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-stone-400" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.article>
      );
    }

    const specialtyItems = section.specialties ?? section.items ?? [];
    const specialtyKeyParts = specialtyItems.map((item) =>
      [item.title, ...(item.bullets ?? [])]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .join('|'),
    );

    return (
      <motion.article
        key={createMethodKey('method-specialties', [section.title, ...specialtyKeyParts])}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: animationDelay }}
        className="max-w-3xl mx-auto"
        {...getVisualEditorAttributes(sectionFieldPath)}
      >
        {section.title ? (
          <h3
            className="text-2xl font-semibold text-stone-900"
            {...getVisualEditorAttributes(`${sectionFieldPath}.title`)}
          >
            {section.title}
          </h3>
        ) : null}
        <div
          className={`mt-6 space-y-4 ${section.title ? '' : 'mt-0'}`}
          {...getVisualEditorAttributes(`${sectionFieldPath}.items`)}
        >
          {specialtyItems.map((item, itemIndex) => (
            <details
              key={createMethodKey('method-specialty', [item.title, ...(item.bullets ?? [])])}
              className="group border border-stone-200 rounded-2xl px-4 py-3 bg-white/60 backdrop-blur-sm"
            >
              <summary className="cursor-pointer text-lg font-medium text-stone-900 list-none flex items-center justify-between gap-4">
                <span {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}.title`)}>{item.title}</span>
                <span className="transition-transform duration-200 group-open:rotate-45 text-stone-400" aria-hidden="true">
                  +
                </span>
              </summary>
              <ul
                className="mt-3 pl-4 space-y-2 text-stone-700"
                {...getVisualEditorAttributes(`${sectionFieldPath}.items.${itemIndex}.bullets`)}
              >
                {(item.bullets ?? []).map((bullet, bulletIndex) => (
                  <li key={`${item.title ?? 'bullet'}-${bullet}`} className="list-disc">
                    {bullet}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </motion.article>
    );
  };

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
            {...getVisualEditorAttributes(`${baseFieldPath}.heroTitle`)}
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-lg text-stone-600 max-w-3xl mx-auto"
            {...getVisualEditorAttributes(`${baseFieldPath}.heroSubtitle`)}
          >
            {heroSubtitle}
          </motion.p>
        </div>
      </header>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-16">
          {hasClinicalNotes ? (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
              {...getVisualEditorAttributes(clinicalNotesFieldPath)}
            >
              <div className="grid gap-12 md:grid-cols-2">
                {clinicalNotes.map((note, noteIndex) => (
                  <div
                    key={`${note.title}-${noteIndex}`}
                    className="space-y-4"
                    {...getVisualEditorAttributes(`${clinicalNotesFieldPath}.${noteIndex}`)}
                  >
                    <h3
                      className="text-2xl font-semibold text-stone-900"
                      {...getVisualEditorAttributes(`${clinicalNotesFieldPath}.${noteIndex}.title`)}
                    >
                      {note.title}
                    </h3>
                    <ul
                      className="space-y-2 text-stone-700"
                      {...getVisualEditorAttributes(`${clinicalNotesFieldPath}.${noteIndex}.bullets`)}
                    >
                      {note.bullets.map((bullet, bulletIndex) => (
                        <li key={`${note.title}-${bulletIndex}`} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-stone-400" aria-hidden="true" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.section>
          ) : null}

          {hasSections ? (
            sections.map(renderSection)
          ) : !hasClinicalNotes ? (
            <p
              className="text-center text-stone-600"
              {...getVisualEditorAttributes(`translations.${language}.common.loading`)}
            >
              {t('common.loading')}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default Method;
