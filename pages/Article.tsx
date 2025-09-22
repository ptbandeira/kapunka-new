import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

import { useLanguage } from '../contexts/LanguageContext';
import type { Article, Product } from '../types';
import ProductCard from '../components/ProductCard';

const ArticlePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { translate, t } = useLanguage();

    const [article, setArticle] = useState<Article | null>(null);
    const [relatedProduct, setRelatedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const fetchArticleData = async () => {
            try {
                const articlesRes = await fetch('/content/articles/index.json');
                const articlesData = await articlesRes.json();
                if (!isMounted) return;

                const currentArticle = articlesData.items.find((a: Article) => a.slug === slug);
                setArticle(currentArticle || null);

                if (currentArticle?.relatedProductId) {
                    const productsRes = await fetch('/content/products/index.json');
                    const productsData = await productsRes.json();
                    if (!isMounted) return;

                    const product = productsData.items.find((p: Product) => p.id === currentArticle.relatedProductId);
                    setRelatedProduct(product || null);
                }
            } catch (error) {
                console.error("Failed to fetch article data", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchArticleData();

        return () => { isMounted = false; };
    }, [slug]);

    const formatCategoryLabel = useCallback((category: string) => {
        const key = `learn.categories.${category}`;
        const label = t(key);
        if (label === key) {
            return category.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
        }
        return label;
    }, [t]);

    const formattedContent = useMemo(() => {
        if (!article) return null;
        const content = translate(article.content);
        if (typeof content !== 'string') return null;
        return content.split('\n').map((paragraph, index) => (
            paragraph.trim() ? <p key={index}>{paragraph}</p> : null
        ));
    }, [article, translate]);

    if (loading) {
        return <div className="text-center py-20">{t('article.loading')}</div>;
    }

    if (!article) {
        return <div className="text-center py-20">{t('article.notFound')}</div>;
    }

    return (
        <div>
            <Helmet>
                <title>{translate(article.title)} | Kapunka Skincare</title>
                <meta name="description" content={translate(article.preview)} />
            </Helmet>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12 sm:py-16">
                <motion.header 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <p className="text-sm text-stone-500 uppercase tracking-wider">{formatCategoryLabel(article.category)}</p>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mt-2">{translate(article.title)}</h1>
                </motion.header>
                
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="my-8"
                >
                    <img src={article.imageUrl} alt={translate(article.title)} className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg" />
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="prose prose-stone lg:prose-lg max-w-none text-stone-700 leading-relaxed"
                >
                    {formattedContent}
                </motion.div>
            </div>

            {relatedProduct && (
                <div className="py-16 sm:py-24 bg-stone-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-semibold text-center mb-12">{t('article.featuredProduct')}</h2>
                        <div className="max-w-sm mx-auto">
                           <ProductCard product={relatedProduct} />
                        </div>
                    </div>
                </div>
            )}
            
            <div className="text-center pb-16 sm:pb-24">
                <Link to="/learn" className="px-8 py-3 bg-stone-200 text-stone-800 font-semibold rounded-md hover:bg-stone-300 transition-colors">
                    {t('article.backToLibrary')}
                </Link>
            </div>
        </div>
    );
};

// Fix: The component name in App.tsx is `Article`.
// So we export this component as `Article`.
export default ArticlePage;
