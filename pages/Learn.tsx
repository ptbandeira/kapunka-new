import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import ArticleCard from '../components/ArticleCard';
import { useLanguage } from '../contexts/LanguageContext';
import type { Article } from '../types';
import {
  loadLearnPageContent,
  type LearnPageContentResult,
  type LearnPageCategory,
} from '../utils/loadLearnPageContent';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';

interface ArticlesResponse {
  items?: Article[];
}

const normalizeCategoryLabel = (value: string): string => (
  value.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
);

const Learn: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageContent, setPageContent] = useState<LearnPageContentResult | null>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    let isMounted = true;

    loadLearnPageContent(language)
      .then((result) => {
        if (!isMounted) {
          return;
        }
        setPageContent(result);
      })
      .catch((error) => {
        console.error('Failed to load Learn page content', error);
        if (isMounted) {
          setPageContent(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [language]);

  const handleCategoryClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const { category } = event.currentTarget.dataset;
    if (category) {
      setActiveCategory(category);
    }
  }, [setActiveCategory]);

  useEffect(() => {
    let isMounted = true;

    const loadArticles = async () => {
      try {
        const data = await fetchVisualEditorJson<ArticlesResponse>('/content/articles/index.json');
        if (!isMounted) {
          return;
        }
        setArticles(Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load learn articles', error);
          setArticles([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadArticles().catch((error) => {
      console.error('Unhandled error while loading learn articles', error);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const translationCategories = useMemo(() => {
    const value = t<Record<string, string>>('learn.categories');
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
    return {};
  }, [t]);

  const learnFieldPath = useMemo(() => {
    if (!pageContent) {
      return `pages.learn_${language}`;
    }
    return pageContent.source === 'site'
      ? `site.content.${pageContent.locale}.pages.learn`
      : `pages.learn_${pageContent.locale}`;
  }, [language, pageContent]);

  const baseCategories: Array<LearnPageCategory & { fieldPath?: string }> = useMemo(() => {
    const categoriesFromContent = pageContent?.data.categories ?? [];
    if (categoriesFromContent.length > 0) {
      return categoriesFromContent.map((category, index) => ({
        ...category,
        fieldPath: `${learnFieldPath}.categories.${index}`,
      }));
    }

    return Object.entries(translationCategories).map(([id, label]) => ({ id, label }));
  }, [learnFieldPath, pageContent, translationCategories]);

  const categoriesFromArticles = useMemo(() => {
    const unique = new Set(articles.map((article) => article.category));
    return Array.from(unique);
  }, [articles]);

  const allCategories = useMemo(() => {
    const map = new Map<string, LearnPageCategory & { fieldPath?: string }>();
    for (const category of baseCategories) {
      map.set(category.id, category);
    }

    for (const categoryId of categoriesFromArticles) {
      if (map.has(categoryId)) {
        continue;
      }
      const translationLabel = translationCategories?.[categoryId];
      map.set(categoryId, {
        id: categoryId,
        label: translationLabel ?? normalizeCategoryLabel(categoryId),
      });
    }

    const allEntry = map.get('all') ?? {
      id: 'all',
      label: translationCategories?.all ?? 'All',
    };

    const rest = Array.from(map.values()).filter((category) => category.id !== 'all');

    return [allEntry, ...rest];
  }, [baseCategories, categoriesFromArticles, translationCategories]);

  const categoryLookup = useMemo(() => {
    const lookup = new Map<string, LearnPageCategory & { fieldPath?: string }>();
    allCategories.forEach((category) => {
      lookup.set(category.id, category);
    });
    return lookup;
  }, [allCategories]);

  const formatCategoryLabel = useCallback((category: string) => {
    const matched = categoryLookup.get(category);
    if (matched) {
      return matched.label;
    }

    const key = category === 'all'
      ? 'learn.categories.all'
      : `learn.categories.${category}`;
    const label = t(key);
    if (label === key) {
      return normalizeCategoryLabel(category);
    }

    return label;
  }, [categoryLookup, t]);

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') {
      return articles;
    }
    return articles.filter(article => article.category === activeCategory);
  }, [activeCategory, articles]);

  const metaTitle = pageContent?.data.metaTitle ?? t('learn.metaTitle');
  const metaDescription = pageContent?.data.metaDescription ?? t('learn.metaDescription');
  const heroTitle = pageContent?.data.heroTitle ?? t('learn.title');
  const heroSubtitle = pageContent?.data.heroSubtitle ?? t('learn.subtitle');
  const heroTitleFieldPath = `${learnFieldPath}.heroTitle`;
  const heroSubtitleFieldPath = `${learnFieldPath}.heroSubtitle`;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Helmet>
        <title>{metaTitle} | Kapunka Skincare</title>
        <meta name="description" content={metaDescription} />
      </Helmet>

      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1
          className="text-4xl sm:text-5xl font-semibold tracking-tight"
          {...getVisualEditorAttributes(heroTitleFieldPath)}
        >
          {heroTitle}
        </h1>
        <p
          className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto"
          {...getVisualEditorAttributes(heroSubtitleFieldPath)}
        >
          {heroSubtitle}
        </p>
      </motion.header>

      <div className="flex justify-center flex-wrap gap-2 mb-12">
        {allCategories.map((category) => {
          const categoryFieldPath = category.fieldPath
            ? `${category.fieldPath}.label`
            : undefined;
          return (
            <button
              key={category.id}
              onClick={handleCategoryClick}
              className={`text-sm px-4 py-2 border rounded-full transition-colors duration-300 ${
                activeCategory === category.id
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'border-stone-300 text-stone-500 hover:border-stone-800 hover:text-stone-800'
              }`}
              data-category={category.id}
              {...getVisualEditorAttributes(categoryFieldPath)}
            >
              {formatCategoryLabel(category.id)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-center py-10" {...getVisualEditorAttributes(`translations.${language}.common.loading`)}>
          {t('common.loading')}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredArticles.map((article, index) => {
              const articleIndex = articles.findIndex((item) => item.id === article.id);
              const fieldPath = articleIndex >= 0 ? `articles.items.${articleIndex}` : undefined;
              const categoryDetails = categoryLookup.get(article.category);
              const categoryFieldPath = categoryDetails?.fieldPath
                ? `${categoryDetails.fieldPath}.label`
                : undefined;
              return (
                <ArticleCard
                  key={article.id}
                  article={article}
                  index={index}
                  fieldPath={fieldPath}
                  categoryLabel={categoryDetails?.label}
                  categoryFieldPath={categoryFieldPath}
                  data-sb-field-path={`.${index}`}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};

export default Learn;
