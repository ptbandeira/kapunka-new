import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import ArticleCard from '../components/ArticleCard';
import { useLanguage } from '../contexts/LanguageContext';
import type { Article } from '../types';

const Learn: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/content/articles/index.json')
        .then(res => res.json())
        .then(data => {
            setArticles(data.items);
            setLoading(false);
        });
  }, []);

  const categories = useMemo(() => {
    const allCategories = ['all', ...Array.from(new Set(articles.map(a => a.category)))];
    return allCategories;
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'all') {
      return articles;
    }
    return articles.filter(article => article.category === activeCategory);
  }, [activeCategory, articles]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Helmet>
        <title>Learn | Kapunka Skincare</title>
        <meta name="description" content="Explore articles and guides on skincare, ingredients, and maintaining a healthy skin barrier." />
      </Helmet>
      
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Skincare Library</h1>
        <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">Guides and insights to help you understand your skin better.</p>
      </motion.header>

      <div className="flex justify-center flex-wrap gap-2 mb-12">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`text-sm px-4 py-2 border rounded-full transition-colors duration-300 ${
              activeCategory === category
                ? 'bg-stone-800 text-white border-stone-800'
                : 'border-stone-300 text-stone-500 hover:border-stone-800 hover:text-stone-800'
            }`}
          >
            {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center py-10">Loading articles...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredArticles.map((article, index) => (
            <ArticleCard key={article.id} article={article} index={index} />
            ))}
        </div>
      )}
    </div>
  );
};

export default Learn;