import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

import { useLanguage } from '../contexts/LanguageContext';
import type { Article, Product } from '../types';
import ProductCard from '../components/ProductCard';
import {
  loadLearnPageContent,
  type LearnPageContentResult,
} from '../utils/loadLearnPageContent';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { buildLocalizedPath } from '../utils/localePaths';
import { getCloudinaryUrl } from '../utils/imageUrl';

interface ArticlesResponse {
    items?: Article[];
}

interface ProductsResponse {
    items?: Product[];
}

const ArticlePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { translate, t, language } = useLanguage();
    const { contentVersion } = useVisualEditorSync();

    const [article, setArticle] = useState<Article | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [articleIndex, setArticleIndex] = useState<number>(-1);
    const [loading, setLoading] = useState(true);
    const [learnContent, setLearnContent] = useState<LearnPageContentResult | null>(null);

    useEffect(() => {
        let isMounted = true;

        setLearnContent(null);

        loadLearnPageContent(language)
            .then((result) => {
                if (!isMounted) {
                    return;
                }
                setLearnContent(result);
            })
            .catch((error) => {
                console.error('Failed to load Learn page content for article view', error);
                if (isMounted) {
                    setLearnContent(null);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [language, contentVersion]);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const fetchArticleData = async () => {
            try {
                const articlesData = await fetchVisualEditorJson<ArticlesResponse>('/content/articles/index.json');
                if (!isMounted) return;

                const articleItems: Article[] = Array.isArray(articlesData.items) ? articlesData.items : [];
                const currentArticleIndex = articleItems.findIndex((a: Article) => a.slug === slug);
                const currentArticle = currentArticleIndex >= 0 ? articleItems[currentArticleIndex] : null;
                setArticle(currentArticle);
                setArticleIndex(currentArticleIndex);

                const productIds = currentArticle?.relatedProductIds ??
                    (currentArticle?.relatedProductId ? [currentArticle.relatedProductId] : []);

                if (productIds.length > 0) {
                    try {
                        const productsData = await fetchVisualEditorJson<ProductsResponse>('/content/products/index.json');
                        if (!isMounted) return;

                        const productItems: Product[] = Array.isArray(productsData.items) ? productsData.items : [];
                        setAllProducts(productItems);

                        const matchedProducts = productIds
                            .map((id: string) => productItems.find((p: Product) => p.id === id))
                            .filter((product): product is Product => Boolean(product));

                        setRelatedProducts(matchedProducts);
                    } catch (productError) {
                        console.error("Failed to fetch related products", productError);
                        if (isMounted) {
                            setAllProducts([]);
                            setRelatedProducts([]);
                        }
                    }
                } else if (isMounted) {
                    setAllProducts([]);
                    setRelatedProducts([]);
                }
            } catch (error) {
                console.error("Failed to fetch article data", error);
                if (isMounted) {
                    setArticle(null);
                    setArticleIndex(-1);
                    setRelatedProducts([]);
                    setAllProducts([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchArticleData();

        return () => { isMounted = false; };
    }, [slug, contentVersion]);

    const learnFieldPath = useMemo(() => {
        if (!learnContent) {
            return `pages.learn_${language}`;
        }
        return learnContent.source === 'visual-editor'
            ? `site.content.${learnContent.locale}.pages.learn`
            : `pages.learn_${learnContent.locale}`;
    }, [language, learnContent]);

    const learnCategories = useMemo(() => {
        const categories = new Map<string, { label: string; fieldPath?: string }>();

        if (learnContent?.data.categories) {
            learnContent.data.categories.forEach((category, index) => {
                categories.set(category.id, {
                    label: category.label,
                    fieldPath: `${learnFieldPath}.categories.${index}.label`,
                });
            });
        }

        const translationCategories = t<Record<string, string>>('learn.categories');
        if (translationCategories && typeof translationCategories === 'object' && !Array.isArray(translationCategories)) {
            for (const [id, label] of Object.entries(translationCategories)) {
                if (!categories.has(id)) {
                    categories.set(id, { label });
                }
            }
        }

        return categories;
    }, [learnContent, learnFieldPath, t]);

    const formatCategoryLabel = useCallback((category: string) => {
        const matched = learnCategories.get(category);
        if (matched) {
            return matched.label;
        }

        return category.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    }, [learnCategories]);

    const formattedContent = useMemo(() => {
        if (!article) return null;
        const content = translate(article.content);
        if (typeof content !== 'string') return null;
        return content.split('\n').map((paragraph) => (
            paragraph.trim() ? <p key={paragraph}>{paragraph}</p> : null
        ));
    }, [article, translate]);

    const translatedFaqs = useMemo(() => {
        if (!article?.faqs) return [];
        return article.faqs.map((faq) => {
            const question = translate(faq.question);
            const answer = translate(faq.answer);
            return {
                question: typeof question === 'string' ? question : '',
                answer: typeof answer === 'string' ? answer : '',
            };
        }).filter((faq) => faq.question && faq.answer);
    }, [article, translate]);

    const faqSchema = useMemo(() => {
        if (!article?.faqs || article.faqs.length === 0) return null;

        const mainEntity = article.faqs.map((faq) => {
            const question = translate(faq.question);
            const answer = translate(faq.answer);
            const questionText = typeof question === 'string' ? question : '';
            const answerText = typeof answer === 'string' ? answer : '';

            return questionText && answerText ? {
                "@type": "Question",
                name: questionText,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: answerText,
                },
            } : null;
        }).filter((entity): entity is { "@type": string; name: string; acceptedAnswer: { "@type": string; text: string; }; } => Boolean(entity));

        if (mainEntity.length === 0) {
            return null;
        }

        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity,
        };
    }, [article, translate]);

    if (loading) {
        return (
            <div className="text-center py-20" {...getVisualEditorAttributes(`translations.${language}.article.loading`)}>
                {t('article.loading')}
            </div>
        );
    }

    if (!article) {
        return (
            <div className="text-center py-20" {...getVisualEditorAttributes(`translations.${language}.article.notFound`)}>
                {t('article.notFound')}
            </div>
        );
    }

    const articleFieldPath = articleIndex >= 0 ? `articles.items.${articleIndex}` : undefined;
    const categoryFieldPath = article.category
        ? learnCategories.get(article.category)?.fieldPath
            ?? `translations.${language}.learn.categories.${article.category}`
        : undefined;
    const articleImageSrc = (article.imageUrl ?? '').trim();
    const articleImageUrl = articleImageSrc ? getCloudinaryUrl(articleImageSrc) ?? articleImageSrc : '';

    return (
        <div>
            <Helmet>
                <title>{translate(article.title)} | Kapunka Skincare</title>
                <meta name="description" content={translate(article.preview)} />
                {faqSchema && (
                    <script type="application/ld+json">
                        {JSON.stringify(faqSchema)}
                    </script>
                )}
            </Helmet>

            <div
                className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12 sm:py-16"
                {...getVisualEditorAttributes(articleFieldPath)}
            >
                <motion.header 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <p
                        className="text-sm text-stone-500 uppercase tracking-wider"
                        {...getVisualEditorAttributes(categoryFieldPath)}
                    >
                        {formatCategoryLabel(article.category)}
                    </p>
                    <h1
                        className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mt-2"
                        {...getVisualEditorAttributes(articleFieldPath ? `${articleFieldPath}.title.${language}` : undefined)}
                    >
                        {translate(article.title)}
                    </h1>
                </motion.header>
                
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="my-8"
                >
                    <img
                        src={articleImageUrl}
                        alt={translate(article.title)}
                        className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg"
                        {...getVisualEditorAttributes(articleFieldPath ? `${articleFieldPath}.imageUrl` : undefined)}
                    />
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="prose prose-stone lg:prose-lg max-w-none text-stone-700 leading-relaxed"
                    {...getVisualEditorAttributes(articleFieldPath ? `${articleFieldPath}.content.${language}` : undefined)}
                >
                    {formattedContent}
                </motion.div>

                {translatedFaqs.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mt-12"
                        {...getVisualEditorAttributes(articleFieldPath ? `${articleFieldPath}.faqs` : undefined)}
                    >
                        <h2
                            className="text-2xl font-semibold text-stone-800"
                            {...getVisualEditorAttributes(`translations.${language}.article.faqTitle`)}
                        >
                            {t('article.faqTitle')}
                        </h2>
                        <div className="mt-6 space-y-6">
                            {translatedFaqs.map((faq, index) => (
                                <div key={faq.question} className="border-t border-stone-200 pt-6">
                                    <h3
                                        className="text-lg font-medium text-stone-800"
                                        {...getVisualEditorAttributes(
                                            articleFieldPath
                                                ? `${articleFieldPath}.faqs.${index}.question.${language}`
                                                : undefined
                                        )}
                                    >
                                        {faq.question}
                                    </h3>
                                    <p
                                        className="mt-2 text-stone-600"
                                        {...getVisualEditorAttributes(
                                            articleFieldPath
                                                ? `${articleFieldPath}.faqs.${index}.answer.${language}`
                                                : undefined
                                        )}
                                    >
                                        {faq.answer}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}
            </div>

            {relatedProducts.length > 0 && (
                <div className="py-16 sm:py-24 bg-stone-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <h2
                            className="text-3xl font-semibold text-center mb-12"
                            {...getVisualEditorAttributes(`translations.${language}.article.featuredProduct`)}
                        >
                            {t('article.featuredProduct')}
                        </h2>
                        <div className={relatedProducts.length > 1
                            ? 'mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10'
                            : 'mt-12 max-w-sm mx-auto'}>
                            {relatedProducts.map((product, index) => {
                                const productIndex = allProducts.findIndex((item) => item.id === product.id);
                                const productFieldPath = productIndex >= 0 ? `products.items.${productIndex}` : undefined;
                                return (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        fieldPath={productFieldPath}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="text-center pb-16 sm:pb-24">
                <Link to={buildLocalizedPath('/learn', language)} className="px-8 py-3 bg-stone-200 text-stone-800 font-semibold rounded-md hover:bg-stone-300 transition-colors">
                    <span {...getVisualEditorAttributes(`translations.${language}.article.backToLibrary`)}>
                        {t('article.backToLibrary')}
                    </span>
                </Link>
            </div>
        </div>
    );
};

// Fix: The component name in App.tsx is `Article`.
// So we export this component as `Article`.
export default ArticlePage;
