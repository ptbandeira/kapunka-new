import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import type { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  index: number;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, index }) => {
  const { translate } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Link to={`/learn/${article.slug}`} className="group block">
        <div className="overflow-hidden rounded-lg">
          <img
            src={article.imageUrl}
            alt={translate(article.title)}
            className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="mt-4">
          <p className="text-sm text-stone-500 uppercase tracking-wider">{article.category.replace('-', ' ')}</p>
          <h3 className="font-semibold text-xl mt-2 text-stone-800 group-hover:text-stone-900 transition-colors">{translate(article.title)}</h3>
          <p className="text-sm text-stone-600 mt-2">{translate(article.preview)}</p>
        </div>
      </Link>
    </motion.div>
  );
};

export default ArticleCard;
