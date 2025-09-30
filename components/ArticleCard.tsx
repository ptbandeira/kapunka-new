import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import type { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  index: number;
  fieldPath?: string;
  categoryLabel?: string;
  categoryFieldPath?: string;
}

const fallbackCategoryLabel = (category: string): string => (
  category.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
);

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  index,
  fieldPath,
  categoryLabel,
  categoryFieldPath,
}) => {
  const { translate, t, language } = useLanguage();

  const translationCategoryKey = `learn.categories.${article.category}`;
  const translatedCategory = t(translationCategoryKey);
  const displayCategory = categoryLabel
    ?? (translatedCategory === translationCategoryKey
      ? fallbackCategoryLabel(article.category)
      : translatedCategory);

  const resolvedCategoryFieldPath = categoryFieldPath
    ?? `translations.${language}.learn.categories.${article.category}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      data-nlv-field-path={fieldPath}
      data-sb-field-path={fieldPath}
    >
      <Link to={`/learn/${article.slug}`} className="group block">
        <div className="overflow-hidden rounded-lg">
          <img
            src={article.imageUrl}
            alt={translate(article.title)}
            className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
            data-nlv-field-path={fieldPath ? `${fieldPath}.imageUrl` : undefined}
            data-sb-field-path={fieldPath ? `${fieldPath}.imageUrl` : undefined}
          />
        </div>
        <div className="mt-4">
          <p
            className="text-sm text-stone-500 uppercase tracking-wider"
            data-nlv-field-path={resolvedCategoryFieldPath}
            data-sb-field-path={resolvedCategoryFieldPath}
          >
            {displayCategory}
          </p>
          <h3
            className="font-semibold text-xl mt-2 text-stone-800 group-hover:text-stone-900 transition-colors"
            data-nlv-field-path={fieldPath ? `${fieldPath}.title.${language}` : undefined}
            data-sb-field-path={fieldPath ? `${fieldPath}.title.${language}` : undefined}
          >
            {translate(article.title)}
          </h3>
          <p
            className="text-sm text-stone-600 mt-2"
            data-nlv-field-path={fieldPath ? `${fieldPath}.preview.${language}` : undefined}
            data-sb-field-path={fieldPath ? `${fieldPath}.preview.${language}` : undefined}
          >
            {translate(article.preview)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default ArticleCard;
