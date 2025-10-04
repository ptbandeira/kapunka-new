import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { fetchVisualEditorMarkdown } from '../utils/fetchVisualEditorMarkdown';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';

interface BenefitItem {
  title?: string;
  description?: string;
}

interface UsageStep {
  step?: number;
  title?: string;
  guidance?: string;
}

interface FaqItem {
  question?: string;
  answer?: string;
}

interface ProductEducationContent {
  headline?: string;
  subheadline?: string;
  composition?: string;
  certifications?: string[];
  benefits?: BenefitItem[];
  usageInstructions?: UsageStep[];
  faqs?: FaqItem[];
}

const PRODUCT_EDUCATION_PATH = '/content/pages/product/index.md';
const PRODUCT_EDUCATION_OBJECT_ID = 'ProductEducationPage:content/pages/product/index.md';

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');

const isBenefitItem = (value: unknown): value is BenefitItem => {
  if (!isRecord(value)) {
    return false;
  }

  const { title, description } = value;
  return (
    (title === undefined || typeof title === 'string')
    && (description === undefined || typeof description === 'string')
  );
};

const isUsageStep = (value: unknown): value is UsageStep => {
  if (!isRecord(value)) {
    return false;
  }

  const { step, title, guidance } = value;
  return (
    (step === undefined || typeof step === 'number')
    && (title === undefined || typeof title === 'string')
    && (guidance === undefined || typeof guidance === 'string')
  );
};

const isFaqItem = (value: unknown): value is FaqItem => {
  if (!isRecord(value)) {
    return false;
  }

  const { question, answer } = value;
  return (
    (question === undefined || typeof question === 'string')
    && (answer === undefined || typeof answer === 'string')
  );
};

const isProductEducationContent = (value: unknown): value is ProductEducationContent => {
  if (!isRecord(value)) {
    return false;
  }

  const { certifications, benefits, usageInstructions, faqs, headline, subheadline, composition } = value;

  if (certifications !== undefined && !isStringArray(certifications)) {
    return false;
  }

  if (benefits !== undefined) {
    if (!Array.isArray(benefits) || !benefits.every(isBenefitItem)) {
      return false;
    }
  }

  if (usageInstructions !== undefined) {
    if (!Array.isArray(usageInstructions) || !usageInstructions.every(isUsageStep)) {
      return false;
    }
  }

  if (faqs !== undefined) {
    if (!Array.isArray(faqs) || !faqs.every(isFaqItem)) {
      return false;
    }
  }

  return (
    (headline === undefined || typeof headline === 'string')
    && (subheadline === undefined || typeof subheadline === 'string')
    && (composition === undefined || typeof composition === 'string')
  );
};

const ProductEducation: React.FC = () => {
  const [content, setContent] = useState<ProductEducationContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { contentVersion } = useVisualEditorSync();

  useEffect(() => {
    let isMounted = true;
    setContent(null);
    setError(null);

    const loadContent = async () => {
      try {
        const { data } = await fetchVisualEditorMarkdown<unknown>(PRODUCT_EDUCATION_PATH, { cache: 'no-store' });
        if (!isMounted) {
          return;
        }

        if (isProductEducationContent(data)) {
          setContent(data);
        } else {
          setError('Invalid product education content structure.');
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load product education content.');
      }
    };

    loadContent().catch((err) => {
      if (!isMounted) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load product education content.');
    });

    return () => {
      isMounted = false;
    };
  }, [contentVersion]);

  const benefits = content?.benefits?.filter((benefit) => benefit && (benefit.title?.trim() || benefit.description?.trim())) ?? [];
  const usageSteps = content?.usageInstructions?.filter((step) => step && (step.title?.trim() || step.guidance?.trim())) ?? [];
  const faqs = content?.faqs?.filter((faq) => faq && (faq.question?.trim() || faq.answer?.trim())) ?? [];
  const certifications = content?.certifications?.filter((cert) => cert.trim().length > 0) ?? [];

  const metaTitle = content?.headline ?? 'Product Education';
  const metaDescription = content?.subheadline ?? 'Learn how Kapunka products are composed, certified, and used.';

  const compositionParagraphs = useMemo(() => {
    if (!content?.composition) {
      return [];
    }

    return content.composition
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }, [content?.composition]);

  return (
    <div className="bg-white text-stone-900" data-sb-object-id={PRODUCT_EDUCATION_OBJECT_ID}>
      <Helmet>
        <title>{metaTitle} | Kapunka Skincare</title>
        <meta name="description" content={metaDescription} />
      </Helmet>

      <section className="bg-stone-100 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl font-semibold tracking-tight sm:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            data-sb-field-path="headline"
          >
            {content?.headline ?? 'Product Education'}
          </motion.h1>
          <motion.p
            className="mt-6 text-lg text-stone-600 sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            data-sb-field-path="subheadline"
          >
            {content?.subheadline ?? 'Understand Kapunka formulations, certifications, and rituals.'}
          </motion.p>
        </div>
      </section>

      {compositionParagraphs.length > 0 ? (
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white p-8 shadow-sm" data-sb-field-path="composition">
              <h2 className="text-2xl font-semibold text-stone-900">Composition</h2>
              <div className="mt-4 space-y-4 text-base text-stone-600">
                {compositionParagraphs.map((paragraph, index) => (
                  <p key={[paragraph, index].join('|')}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {certifications.length > 0 ? (
        <section className="bg-stone-900 py-16 sm:py-24" data-sb-field-path="certifications">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-stone-100">
            <h2 className="text-2xl font-semibold">Certifications</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {certifications.map((certification, index) => (
                <div
                  key={[certification, index].join('|')}
                  className="rounded-xl border border-stone-700 bg-stone-950 p-5 text-sm"
                  data-sb-field-path={`${index}`}
                >
                  {certification}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {benefits.length > 0 ? (
        <section className="py-16 sm:py-24" data-sb-field-path="benefits">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-stone-900">Benefits</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={[benefit.title, index].join('|')}
                  className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  data-sb-field-path={`${index}`}
                >
                  {benefit.title ? (
                    <h3 className="text-lg font-semibold text-stone-900">{benefit.title}</h3>
                  ) : null}
                  {benefit.description ? (
                    <p className="mt-3 text-sm text-stone-600">{benefit.description}</p>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {usageSteps.length > 0 ? (
        <section className="bg-stone-50 py-16 sm:py-24" data-sb-field-path="usageInstructions">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-stone-900">Usage instructions</h2>
            <ol className="mt-10 space-y-6">
              {usageSteps.map((step, index) => (
                <li
                  key={[step.title, step.step, index].join('|')}
                  className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
                  data-sb-field-path={`${index}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {step.title ? (
                      <h3 className="text-lg font-semibold text-stone-900">{step.title}</h3>
                    ) : null}
                    {(step.step ?? index + 1) ? (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
                        {step.step ?? index + 1}
                      </span>
                    ) : null}
                  </div>
                  {step.guidance ? (
                    <p className="mt-3 text-sm text-stone-600">{step.guidance}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {faqs.length > 0 ? (
        <section className="py-16 sm:py-24" data-sb-field-path="faqs">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-stone-900">FAQs</h2>
            <div className="mt-10 space-y-6">
              {faqs.map((faq, index) => (
                <div key={[faq.question, index].join('|')} className="rounded-2xl bg-white p-6 shadow-sm" data-sb-field-path={`${index}`}>
                  {faq.question ? (
                    <h3 className="text-lg font-semibold text-stone-900">{faq.question}</h3>
                  ) : null}
                  {faq.answer ? (
                    <p className="mt-2 text-sm text-stone-600">{faq.answer}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-red-600">{error}</div>
      ) : null}
    </div>
  );
};

export default ProductEducation;
