import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import SectionRenderer from '../components/SectionRenderer';
import type { Product, ProductKnowledge, ProductTabsSectionContent } from '../types';
import ProductCard from '../components/ProductCard';
import Seo from '../components/Seo';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { formatCurrency } from '../utils/currency';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { getCloudinaryUrl } from '../utils/imageUrl';

interface ProductsResponse {
    items?: Product[];
}

const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t, translate, language } = useLanguage();
    const { addToCart } = useCart();
    const { openCart } = useUI();
    const { contentVersion } = useVisualEditorSync();

    const [product, setProduct] = useState<Product | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadProducts = async () => {
            setLoading(true);
            try {
                const data = await fetchVisualEditorJson<ProductsResponse>('/content/products/index.json');
                if (!isMounted) {
                    return;
                }
                const products: Product[] = Array.isArray(data.items) ? data.items : [];
                setAllProducts(products);
                const currentProduct = products.find(p => p.id === id) ?? null;
                setProduct(currentProduct);
                if (currentProduct && currentProduct.sizes.length > 0) {
                    setSelectedSizeId(currentProduct.sizes[0].id);
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Failed to load product detail data', error);
                    setAllProducts([]);
                    setProduct(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadProducts().catch((error) => {
            console.error('Unhandled error while loading product detail data', error);
        });

        return () => {
            isMounted = false;
        };
    }, [id, contentVersion]);

    const selectedSize = useMemo(() => {
        if (!product || !selectedSizeId) return null;
        return product.sizes.find(s => s.id === selectedSizeId);
    }, [product, selectedSizeId]);

    const productImageSrc = (product?.imageUrl ?? '').trim();
    const productImageUrl = productImageSrc ? getCloudinaryUrl(productImageSrc) ?? productImageSrc : '';

    const handleAddToCart = () => {
        if (product && selectedSizeId) {
            addToCart(product.id, selectedSizeId, 1);
            openCart();
        }
    };

    const handleSizeSelection = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        const { sizeId } = event.currentTarget.dataset;
        if (typeof sizeId === 'string') {
            setSelectedSizeId(sizeId);
        }
    }, [setSelectedSizeId]);
    
    const relatedProducts = useMemo(() => {
        if (!product) return [];
        return allProducts.filter(p => p.id !== product.id).slice(0, 4);
    }, [product, allProducts]);

    if (loading) {
        return <div className="text-center py-20">{t('common.loadingProduct')}</div>;
    }

    if (!product) {
        return <div className="text-center py-20">{t('pdp.notFound')}</div>;
    }

    const translatedTitleAddition = product.titleAddition
        ? (translate(product.titleAddition) as string)
        : null;
    const translatedTagline = translate(product.tagline) as string;
    const pageTitle = `${translate(product.name)} | Kapunka Skincare`;
    const description = translatedTagline;
    const socialImage = productImageUrl || undefined;

    const productIndex = allProducts.findIndex((p) => p.id === product.id);
    const productFieldPath = productIndex >= 0 ? `products.items.${productIndex}` : undefined;
    const selectedSizeIndex = product.sizes.findIndex((size) => size.id === selectedSizeId);

    const productTabsSection = useMemo<ProductTabsSectionContent | null>(() => {
        if (!product) {
            return null;
        }

        const tabs: ProductTabsSectionContent['tabs'] = [];

        const benefits = translate(product.benefits) as string[] | undefined;
        if (benefits && benefits.length > 0) {
            tabs.push({
                id: 'benefits',
                label: t('pdp.tabs.benefits'),
                labelFieldPath: `translations.${language}.pdp.tabs.benefits`,
                content: (
                    <ul className="list-disc pl-5 space-y-2">
                        {benefits.map((benefit: string, index: number) => (
                            <li
                                key={benefit || `${product?.id ?? 'benefit'}-${language}`}
                                {...getVisualEditorAttributes(
                                    productFieldPath
                                        ? `${productFieldPath}.benefits.${language}.${index}`
                                        : undefined
                                )}
                            >
                                {benefit}
                            </li>
                        ))}
                    </ul>
                ),
            });
        }

        const howToUse = translate(product.howToUse) as string | undefined;
        if (howToUse) {
            tabs.push({
                id: 'howToUse',
                label: t('pdp.tabs.howToUse'),
                labelFieldPath: `translations.${language}.pdp.tabs.howToUse`,
                content: (
                    <p {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.howToUse.${language}` : undefined)}>
                        {howToUse}
                    </p>
                ),
            });
        }

        const ingredients = translate(product.ingredients) as string | undefined;
        if (ingredients) {
            tabs.push({
                id: 'ingredients',
                label: t('pdp.tabs.ingredients'),
                labelFieldPath: `translations.${language}.pdp.tabs.ingredients`,
                content: (
                    <p {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.ingredients.${language}` : undefined)}>
                        {ingredients}
                    </p>
                ),
            });
        }

        const labTestedNote = translate(product.labTestedNote) as string | undefined;
        if (labTestedNote) {
            tabs.push({
                id: 'labTested',
                label: t('pdp.tabs.labTested'),
                labelFieldPath: `translations.${language}.pdp.tabs.labTested`,
                content: (
                    <p {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.labTestedNote.${language}` : undefined)}>
                        {labTestedNote}
                    </p>
                ),
            });
        }

        if (product.originStory) {
            const originStory = translate(product.originStory) as string | undefined;
            if (originStory) {
                tabs.push({
                    id: 'originStory',
                    label: t('pdp.tabs.originStory'),
                    labelFieldPath: `translations.${language}.pdp.tabs.originStory`,
                    content: (
                        <p {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.originStory.${language}` : undefined)}>
                            {originStory}
                        </p>
                    ),
                });
            }
        }

        if (product.scientificEvidence) {
            const scientificEvidence = translate(product.scientificEvidence) as string | undefined;
            if (scientificEvidence) {
                tabs.push({
                    id: 'scientificEvidence',
                    label: t('pdp.tabs.scientificEvidence'),
                    labelFieldPath: `translations.${language}.pdp.tabs.scientificEvidence`,
                    content: (
                        <p
                            {...getVisualEditorAttributes(
                                productFieldPath ? `${productFieldPath}.scientificEvidence.${language}` : undefined
                            )}
                        >
                            {scientificEvidence}
                        </p>
                    ),
                });
            }
        }

        if (product.multiUseTips) {
            const tips = translate(product.multiUseTips) as string[] | undefined;
            if (tips && tips.length > 0) {
                tabs.push({
                    id: 'multiUseTips',
                    label: t('pdp.tabs.multiUseTips'),
                    labelFieldPath: `translations.${language}.pdp.tabs.multiUseTips`,
                    content: (
                        <ul className="list-disc pl-5 space-y-2">
                            {tips.map((tip: string, index: number) => (
                                <li
                                    key={tip || `${product?.id ?? 'multi-tip'}-${language}`}
                                    {...getVisualEditorAttributes(
                                        productFieldPath
                                            ? `${productFieldPath}.multiUseTips.${language}.${index}`
                                            : undefined
                                    )}
                                >
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    ),
                });
            }
        }

        if (product.faqs && product.faqs.length > 0) {
            tabs.push({
                id: 'faqs',
                label: t('pdp.tabs.faqs'),
                labelFieldPath: `translations.${language}.pdp.tabs.faqs`,
                content: (
                    <div className="space-y-6">
                        {product.faqs.map((faq, index) => {
                            const translatedQuestion = translate(faq.question) as string;
                            const faqKey = translatedQuestion
                                || faq.question.en
                                || faq.question.pt
                                || faq.question.es
                                || faq.answer.en
                                ||faq.answer.pt
                                ||faq.answer.es
                                || `${product.id}-faq`;

                            return (
                            <div key={faqKey} className="border border-stone-200 rounded-lg p-6">
                                <h3
                                    className="text-lg font-semibold text-stone-900"
                                    {...getVisualEditorAttributes(
                                        productFieldPath
                                            ? `${productFieldPath}.faqs.${index}.question.${language}`
                                            : undefined
                                    )}
                                >
                                    {translatedQuestion}
                                </h3>
                                <p
                                    className="mt-2 text-stone-700 leading-relaxed"
                                    {...getVisualEditorAttributes(
                                        productFieldPath
                                            ? `${productFieldPath}.faqs.${index}.answer.${language}`
                                            : undefined
                                    )}
                                >
                                    {translate(faq.answer) as string}
                                </p>
                            </div>
                        );
                        })}
                    </div>
                ),
            });
        }

        if (tabs.length === 0) {
            return null;
        }

        return {
            type: 'productTabs',
            tabs,
            initialActiveTab: tabs[0].id,
        };
    }, [product, translate, t, language, productFieldPath]);

    const knowledgeSectionConfigs: { id: string; field: keyof ProductKnowledge; titleKey: string }[] = [
        { id: 'whatItIs', field: 'whatItIs', titleKey: 'pdp.knowledge.sections.whatItIs' },
        { id: 'howItWorks', field: 'howItWorks', titleKey: 'pdp.knowledge.sections.howItWorks' },
        { id: 'whoItsFor', field: 'whoItsFor', titleKey: 'pdp.knowledge.sections.whoItsFor' },
        { id: 'scientificBacking', field: 'scientificBacking', titleKey: 'pdp.knowledge.sections.scientificBacking' },
        { id: 'culturalContext', field: 'culturalContext', titleKey: 'pdp.knowledge.sections.culturalContext' },
    ];

    return (
        <div>
            <Seo
                title={pageTitle}
                description={description}
                image={socialImage}
                locale={language}
                type="product"
            />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16" {...getVisualEditorAttributes(productFieldPath)}>
                <div className="grid md:grid-cols-2 gap-12 items-start">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                        <img
                            src={productImageUrl}
                            alt={translate(product.name)}
                            className="w-full rounded-lg shadow-lg aspect-[3/4] object-cover"
                            {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.imageUrl` : undefined)}
                        />
                    </motion.div>

                    <div className="space-y-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                            <h1
                                className="text-3xl sm:text-4xl font-semibold"
                                {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.name.${language}` : undefined)}
                            >
                                {translate(product.name)}
                            </h1>
                            {translatedTitleAddition && (
                                <p
                                    className="text-sm uppercase tracking-wide text-stone-500 mt-3"
                                    {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.titleAddition.${language}` : undefined)}
                                >
                                    {translatedTitleAddition}
                                </p>
                            )}
                            {(!translatedTitleAddition || translatedTitleAddition !== translatedTagline) && (
                                <p
                                    className="text-lg text-stone-500 mt-2"
                                    {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.tagline.${language}` : undefined)}
                                >
                                    {translatedTagline}
                                </p>
                            )}
                            {product.description && (
                                <p
                                    className="mt-4 text-base text-stone-600 leading-relaxed"
                                    {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.description.${language}` : undefined)}
                                >
                                    {translate(product.description)}
                                </p>
                            )}
                            {product.bundleIncludes && (
                                <div className="mt-6">
                                    <h2
                                        className="text-sm font-semibold uppercase tracking-wide text-stone-500"
                                        {...getVisualEditorAttributes(`translations.${language}.pdp.bundleIncludes`)}
                                    >
                                        {t('pdp.bundleIncludes')}
                                    </h2>
                                    <ul className="mt-3 list-disc pl-5 space-y-1">
                                        {(translate(product.bundleIncludes) as string[]).map((item: string, index: number) => (
                                            <li
                                                key={item || `${product?.id ?? 'bundle'}-${language}`}
                                                className="text-sm text-stone-600"
                                                {...getVisualEditorAttributes(
                                                    productFieldPath
                                                        ? `${productFieldPath}.bundleIncludes.${language}.${index}`
                                                        : undefined
                                                )}
                                            >
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                            <div className="flex items-center gap-2">
                                {(translate(product.badges) as string[]).map((badge: string, index: number) => (
                                    <span
                                        key={badge || `${product?.id ?? 'badge'}-${language}`}
                                        className="text-xs font-semibold bg-stone-100 text-stone-700 px-3 py-1 rounded-full"
                                        {...getVisualEditorAttributes(
                                            productFieldPath
                                                ? `${productFieldPath}.badges.${language}.${index}`
                                                : undefined
                                        )}
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="space-y-4">
                            <div>
                                <label
                                    className="block text-sm font-medium text-stone-700 mb-2"
                                    {...getVisualEditorAttributes(`translations.${language}.pdp.size`)}
                                >
                                    {t('pdp.size')}
                                </label>
                                <div className="flex items-center space-x-2">
                                    {product.sizes.map((size, index) => (
                                        <button
                                            key={size.id}
                                            onClick={handleSizeSelection}
                                            className={`px-4 py-2 border rounded-md transition-colors duration-300 ${
                                                selectedSizeId === size.id
                                                    ? 'bg-stone-800 text-white border-stone-800'
                                                    : 'border-stone-300 text-stone-600 hover:border-stone-800'
                                            }`}
                                            data-size-id={size.id}
                                            {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.sizes.${index}` : undefined)}
                                        >
                                            <span {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.sizes.${index}.size` : undefined)}>
                                                {size.size}
                                            </span>
                                            {String(size.id).includes('ml') ? 'ml' : 'g'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <p
                                    className="text-3xl font-bold"
                                    {...getVisualEditorAttributes(
                                        productFieldPath && selectedSizeIndex >= 0
                                            ? `${productFieldPath}.sizes.${selectedSizeIndex}.price`
                                            : undefined
                                    )}
                                >
                                    {selectedSize ? formatCurrency(selectedSize.price, language) : ''}
                                </p>
                                <button
                                    onClick={handleAddToCart}
                                    className="flex items-center gap-2 px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors"
                                >
                                    <Plus size={18} />{' '}
                                    <span {...getVisualEditorAttributes(`translations.${language}.pdp.addToCart`)}>
                                        {t('pdp.addToCart')}
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            {productTabsSection && (
                                <SectionRenderer sections={[productTabsSection]} />
                            )}
                            {product.goodToKnow && (
                                <div className="mt-8">
                                    <h4
                                        className="text-sm font-semibold uppercase tracking-wide text-stone-500"
                                        {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.goodToKnow.title.${language}` : undefined)}
                                    >
                                        {translate(product.goodToKnow.title)}
                                    </h4>
                                    <ul className="mt-3 list-disc pl-5 space-y-2">
                                        {(translate(product.goodToKnow.items) as string[]).map((item: string, index: number) => (
                                            <li
                                                key={item || `${product?.id ?? 'good-to-know'}-${language}`}
                                                {...getVisualEditorAttributes(
                                                    productFieldPath
                                                        ? `${productFieldPath}.goodToKnow.items.${language}.${index}`
                                                        : undefined
                                                )}
                                            >
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {product.knowledge && (
                <section className="bg-stone-50 py-16 sm:py-24">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
                            <h2
                                className="text-3xl sm:text-4xl font-semibold text-stone-900"
                                {...getVisualEditorAttributes(`translations.${language}.pdp.knowledge.title`)}
                            >
                                {t('pdp.knowledge.title')}
                            </h2>
                            <p
                                className="mt-4 text-lg text-stone-600"
                                {...getVisualEditorAttributes(`translations.${language}.pdp.knowledge.subtitle`)}
                            >
                                {t('pdp.knowledge.subtitle')}
                            </p>
                        </motion.div>
                        <div className="mt-12 grid gap-8 md:grid-cols-2">
                            {knowledgeSectionConfigs.map(section => (
                                <motion.div
                                    key={section.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.1 }}
                                    className="bg-white p-6 rounded-lg shadow-sm border border-stone-200"
                                >
                                    <h3
                                        className="text-xl font-semibold text-stone-900"
                                        {...getVisualEditorAttributes(`translations.${language}.pdp.knowledge.sections.${section.field}`)}
                                    >
                                        {t(section.titleKey)}
                                    </h3>
                                    <p
                                        className="mt-4 text-stone-700 leading-relaxed"
                                        {...getVisualEditorAttributes(
                                            productFieldPath
                                                ? `${productFieldPath}.knowledge.${section.field}.${language}`
                                                : undefined
                                        )}
                                    >
                                        {translate(product.knowledge[section.field])}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {product.faqs && product.faqs.length > 0 && !(productTabsSection?.tabs.some((tab) => tab.id === 'faqs')) && (
                <section className="py-16 sm:py-24">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
                            <h2
                                className="text-3xl sm:text-4xl font-semibold text-stone-900"
                                {...getVisualEditorAttributes(`translations.${language}.pdp.faq.title`)}
                            >
                                {t('pdp.faq.title')}
                            </h2>
                            <p
                                className="mt-4 text-lg text-stone-600"
                                {...getVisualEditorAttributes(`translations.${language}.pdp.faq.subtitle`)}
                            >
                                {t('pdp.faq.subtitle')}
                            </p>
                        </motion.div>
                        <div className="mt-10 space-y-6">
                            {product.faqs.map((faq, index) => {
                                const translatedQuestion = translate(faq.question) as string;
                                const translatedAnswer = translate(faq.answer) as string;
                                const faqKey = translatedQuestion
                                    || faq.question.en
                                    || faq.question.pt
                                    || faq.question.es
                                    || translatedAnswer
                                    || `${product.id}-expanded-faq`;

                                return (
                                <motion.div
                                    key={faqKey}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
                                    className="border border-stone-200 rounded-lg p-6 bg-white shadow-sm"
                                >
                                    <h3
                                        className="text-xl font-semibold text-stone-900"
                                        {...getVisualEditorAttributes(
                                            productFieldPath
                                                ? `${productFieldPath}.faqs.${index}.question.${language}`
                                                : undefined
                                        )}
                                    >
                                        {translatedQuestion}
                                    </h3>
                                    <p
                                        className="mt-3 text-stone-700 leading-relaxed"
                                        {...getVisualEditorAttributes(
                                            productFieldPath
                                                ? `${productFieldPath}.faqs.${index}.answer.${language}`
                                                : undefined
                                        )}
                                    >
                                        {translatedAnswer}
                                    </p>
                                </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {relatedProducts.length > 0 && (
                <div className="py-16 sm:py-24 bg-stone-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <h2
                            className="text-3xl font-semibold text-center mb-12"
                            {...getVisualEditorAttributes(`translations.${language}.pdp.relatedProducts`)}
                        >
                            {t('pdp.relatedProducts')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relatedProducts.map((p, index) => {
                                const relatedIndex = allProducts.findIndex((productItem) => productItem.id === p.id);
                                const relatedFieldPath = relatedIndex >= 0 ? `products.items.${relatedIndex}` : undefined;
                                return (
                                    <ProductCard
                                        key={p.id}
                                        product={p}
                                        fieldPath={relatedFieldPath}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
