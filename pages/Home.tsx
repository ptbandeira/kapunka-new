import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import ProductCard from '../components/ProductCard';
import SectionRenderer from '../components/SectionRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import type {
  Product,
  Review,
  PageSection,
  TimelineEntry,
  TimelineSectionContent,
  ImageTextHalfSectionContent,
  ImageGridItem,
  ImageGridSectionContent,
  PageContent,
} from '../types';

const isTimelineEntry = (value: unknown): value is TimelineEntry => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.year === 'string'
    && typeof entry.title === 'string'
    && typeof entry.description === 'string'
    && (entry.image === undefined || typeof entry.image === 'string')
  );
};

const isTimelineSection = (value: unknown): value is TimelineSectionContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;
  return section.type === 'timeline' && Array.isArray(section.entries) && section.entries.every(isTimelineEntry);
};

const isImageTextHalfSection = (value: unknown): value is ImageTextHalfSectionContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;

  return (
    section.type === 'imageTextHalf'
    && (section.image === undefined || typeof section.image === 'string')
    && (section.title === undefined || typeof section.title === 'string')
    && (section.text === undefined || typeof section.text === 'string')
  );
};

const isImageGridItem = (value: unknown): value is ImageGridItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    (item.image === undefined || typeof item.image === 'string')
    && (item.title === undefined || typeof item.title === 'string')
    && (item.subtitle === undefined || typeof item.subtitle === 'string')
  );
};

const isImageGridSection = (value: unknown): value is ImageGridSectionContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;

  return section.type === 'imageGrid' && Array.isArray(section.items) && section.items.every(isImageGridItem);
};

const isPageSection = (value: unknown): value is PageSection => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as Record<string, unknown>;

  if (section.type === 'timeline') {
    return isTimelineSection(section);
  }

  if (section.type === 'imageTextHalf') {
    return isImageTextHalfSection(section);
  }

  if (section.type === 'imageGrid') {
    return isImageGridSection(section);
  }

  return false;
};

const isPageContent = (value: unknown): value is PageContent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const content = value as Record<string, unknown>;

  if (!Array.isArray(content.sections)) {
    return false;
  }

  return content.sections.every(isPageSection);
};

const Bestsellers: React.FC = () => {
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const { settings } = useSiteSettings();

    useEffect(() => {
        fetch('/content/products/index.json')
            .then(res => res.json())
            .then(data => setProducts(data.items ?? []));
    }, []);

    const featuredProductIds = useMemo(() => {
        const ids = settings.home?.featuredProductIds ?? [];

        return ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
    }, [settings]);

    const curatedProducts = useMemo(() => {
        if (featuredProductIds.length === 0 || products.length === 0) {
            return [];
        }

        const productMap = new Map(products.map(product => [product.id, product]));
        const uniqueIds = Array.from(new Set(featuredProductIds));

        return uniqueIds
            .map(id => productMap.get(id))
            .filter((product): product is Product => Boolean(product));
    }, [products, featuredProductIds]);

    const fallbackProducts = useMemo(() => products.slice(0, 3), [products]);

    const featuredProducts = curatedProducts.length > 0 ? curatedProducts : fallbackProducts;

    return (
        <div className="py-16 sm:py-24 bg-stone-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl sm:text-4xl font-semibold text-center mb-12"
                    data-nlv-field-path={`translations.${language}.home.bestsellersTitle`}
                >
                    {t('home.bestsellersTitle')}
                </motion.h2>
                {featuredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredProducts.map((product) => {
                            const productIndex = products.findIndex((item) => item.id === product.id);
                            const productFieldPath = productIndex >= 0 ? `products.items.${productIndex}` : undefined;
                            return <ProductCard key={product.id} product={product} fieldPath={productFieldPath} />;
                        })}
                    </div>
                ) : (
                    <p
                        className="text-center"
                        data-nlv-field-path={`translations.${language}.common.loadingBestsellers`}
                    >
                        {t('common.loadingBestsellers')}
                    </p>
                )}
            </div>
        </div>
    );
};

const Reviews: React.FC = () => {
    const { t, translate, language } = useLanguage();
    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        fetch('/content/reviews/index.json')
            .then(res => res.json())
            .then(data => setReviews(data.items.slice(0, 3)));
    }, []);

    return (
        <div className="py-16 sm:py-24 bg-stone-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl sm:text-4xl font-semibold text-center mb-12"
                    data-nlv-field-path={`translations.${language}.home.reviewsTitle`}
                >
                    {t('home.reviewsTitle')}
                </motion.h2>
                {reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {reviews.map((review, index) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="p-8 bg-stone-100 rounded-lg text-center"
                                data-nlv-field-path={`reviews.items.${index}`}
                            >
                                <p className="text-stone-700 italic">
                                    &ldquo;
                                    <span data-nlv-field-path={`reviews.items.${index}.text.${language}`}>
                                        {translate(review.text)}
                                    </span>
                                    &rdquo;
                                </p>
                                <p
                                    className="mt-6 font-semibold"
                                    data-nlv-field-path={`reviews.items.${index}.author.${language}`}
                                >
                                    {translate(review.author)}
                                </p>
                                <p
                                    className="text-sm text-stone-500"
                                    data-nlv-field-path={`reviews.items.${index}.role.${language}`}
                                >
                                    {translate(review.role)}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <p
                        className="text-center"
                        data-nlv-field-path={`translations.${language}.common.loadingReviews`}
                    >
                        {t('common.loadingReviews')}
                    </p>
                )}
            </div>
        </div>
    );
};

const NewsletterSignup: React.FC = () => {
    const { t, language } = useLanguage();
    const [email, setEmail] = React.useState('');
    const [submitted, setSubmitted] = React.useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Newsletter signup:', email);
        setSubmitted(true);
    };

    return (
        <div className="py-16 sm:py-24 bg-stone-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2
                        className="text-3xl sm:text-4xl font-semibold mb-4"
                        data-nlv-field-path={`translations.${language}.home.newsletterTitle`}
                    >
                        {t('home.newsletterTitle')}
                    </h2>
                    <p
                        className="text-stone-600 mb-8"
                        data-nlv-field-path={`translations.${language}.home.newsletterSubtitle`}
                    >
                        {t('home.newsletterSubtitle')}
                    </p>
                    {submitted ? (
                        <p
                            className="text-lg text-green-700"
                            data-nlv-field-path={`translations.${language}.home.newsletterThanks`}
                        >
                            {t('home.newsletterThanks')}
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('home.newsletterPlaceholder')}
                                required
                                className="flex-grow px-4 py-3 rounded-md border-stone-300 focus:ring-stone-500 focus:border-stone-500 transition"
                                data-nlv-field-path={`translations.${language}.home.newsletterPlaceholder`}
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors"
                            >
                                <span data-nlv-field-path={`translations.${language}.home.newsletterSubmit`}>
                                    {t('home.newsletterSubmit')}
                                </span>
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

const Home: React.FC = () => {
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();
  const heroImage = settings.home?.heroImage ?? '/content/uploads/hero-abstract.jpg';
  const [pageContent, setPageContent] = useState<PageContent | null>(null);

  useEffect(() => {
    let isMounted = true;
    setPageContent(null);

    const loadSections = async () => {
      const localesToTry = [language, 'en'].filter((locale, index, arr) => arr.indexOf(locale) === index);

      for (const locale of localesToTry) {
        try {
          const response = await fetch(`/content/pages/${locale}/home.json`);
          if (!response.ok) {
            continue;
          }

          const data = (await response.json()) as unknown;

          if (!isMounted) {
            return;
          }

          if (isPageContent(data)) {
            setPageContent(data);
            return;
          }
        } catch (error) {
          if (locale === localesToTry[localesToTry.length - 1]) {
            console.error('Failed to load home sections', error);
          }
        }
      }

      if (isMounted) {
        setPageContent(null);
      }
    };

    void loadSections();

    return () => {
      isMounted = false;
    };
  }, [language]);

  const homeSections = pageContent?.sections ?? [];
  const homeSectionsFieldPath = `pages.home_${language}.sections`;
  const computedTitle = pageContent?.metaTitle ?? `Kapunka Skincare | ${t('home.metaTitle')}`;
  const computedDescription = pageContent?.metaDescription ?? t('home.metaDescription');

  return (
    <div>
        <Helmet>
            <title>{computedTitle}</title>
            <meta name="description" content={computedDescription} />
        </Helmet>
      <div className="relative h-screen bg-cover bg-center" style={{ backgroundImage: `url('${heroImage}')` }} data-nlv-field-path="site.home.heroImage">
        <div className="absolute inset-0 bg-stone-50/30"></div>
        <div className="relative h-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center text-stone-900"
          >
            <h1
              className="text-4xl md:text-6xl font-semibold tracking-tight"
              data-nlv-field-path={`translations.${language}.home.heroTitle`}
            >
              {t('home.heroTitle')}
            </h1>
            <p
              className="mt-4 text-lg md:text-xl max-w-2xl mx-auto"
              data-nlv-field-path={`translations.${language}.home.heroSubtitle`}
            >
              {t('home.heroSubtitle')}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link to="/shop" className="px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors">
                <span data-nlv-field-path={`translations.${language}.home.ctaShop`}>
                  {t('home.ctaShop')}
                </span>
              </Link>
              <Link to="/for-clinics" className="px-8 py-3 bg-white/70 backdrop-blur-sm text-stone-900 font-semibold rounded-md hover:bg-white transition-colors">
                <span data-nlv-field-path={`translations.${language}.home.ctaClinics`}>
                  {t('home.ctaClinics')}
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      {homeSections.length > 0 && (
        <SectionRenderer sections={homeSections} fieldPath={homeSectionsFieldPath} />
      )}
      <Bestsellers />
      <Reviews />
      <NewsletterSignup />
    </div>
  );
};

export default Home;