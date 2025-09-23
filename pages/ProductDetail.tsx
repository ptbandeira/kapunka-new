import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import type { Product } from '../types';
import ProductCard from '../components/ProductCard';

const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t, translate } = useLanguage();
    const { addToCart } = useCart();
    const { openCart } = useUI();

    const [product, setProduct] = useState<Product | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('benefits');

    useEffect(() => {
        fetch('/content/products/index.json')
            .then(res => res.json())
            .then(data => {
                const products: Product[] = data.items;
                setAllProducts(products);
                const currentProduct = products.find(p => p.id === id);
                if (currentProduct) {
                    setProduct(currentProduct);
                    setSelectedSizeId(currentProduct.sizes[0].id);
                }
                setLoading(false);
            });
    }, [id]);

    const selectedSize = useMemo(() => {
        if (!product || !selectedSizeId) return null;
        return product.sizes.find(s => s.id === selectedSizeId);
    }, [product, selectedSizeId]);

    const handleAddToCart = () => {
        if (product && selectedSizeId) {
            addToCart(product.id, selectedSizeId, 1);
            openCart();
        }
    };
    
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

    const productIndex = allProducts.findIndex((p) => p.id === product.id);
    const productFieldPath = productIndex >= 0 ? `products.items.${productIndex}` : undefined;
    const selectedSizeIndex = product.sizes.findIndex((size) => size.id === selectedSizeId);

    const tabs = [
        { id: 'benefits', label: t('pdp.tabs.benefits'), fieldPath: 'translations.en.pdp.tabs.benefits' },
        { id: 'howToUse', label: t('pdp.tabs.howToUse'), fieldPath: 'translations.en.pdp.tabs.howToUse' },
        { id: 'ingredients', label: t('pdp.tabs.ingredients'), fieldPath: 'translations.en.pdp.tabs.ingredients' },
        { id: 'labTested', label: t('pdp.tabs.labTested'), fieldPath: 'translations.en.pdp.tabs.labTested' },
    ];

    return (
        <div>
            <Helmet>
                <title>{translate(product.name)} | Kapunka Skincare</title>
                <meta name="description" content={translate(product.tagline)} />
            </Helmet>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16" data-nlv-field-path={productFieldPath}>
                <div className="grid md:grid-cols-2 gap-12 items-start">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                        <img
                            src={product.imageUrl}
                            alt={translate(product.name)}
                            className="w-full rounded-lg shadow-lg aspect-[3/4] object-cover"
                            data-nlv-field-path={productFieldPath ? `${productFieldPath}.imageUrl` : undefined}
                        />
                    </motion.div>

                    <div className="space-y-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                            <h1 className="text-3xl sm:text-4xl font-semibold" data-nlv-field-path={productFieldPath ? `${productFieldPath}.name.en` : undefined}>{translate(product.name)}</h1>
                            <p className="text-lg text-stone-500 mt-2" data-nlv-field-path={productFieldPath ? `${productFieldPath}.tagline.en` : undefined}>{translate(product.tagline)}</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                            <div className="flex items-center gap-2">
                                {(translate(product.badges) as string[]).map((badge: string, index: number) => (
                                    <span
                                        key={index}
                                        className="text-xs font-semibold bg-stone-100 text-stone-700 px-3 py-1 rounded-full"
                                        data-nlv-field-path={productFieldPath ? `${productFieldPath}.badges.en.${index}` : undefined}
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2" data-nlv-field-path="translations.en.pdp.size">{t('pdp.size')}</label>
                                <div className="flex items-center space-x-2">
                                    {product.sizes.map((size, index) => (
                                        <button
                                            key={size.id}
                                            onClick={() => setSelectedSizeId(size.id)}
                                            className={`px-4 py-2 border rounded-md transition-colors duration-300 ${
                                                selectedSizeId === size.id
                                                    ? 'bg-stone-800 text-white border-stone-800'
                                                    : 'border-stone-300 text-stone-600 hover:border-stone-800'
                                            }`}
                                            data-nlv-field-path={productFieldPath ? `${productFieldPath}.sizes.${index}` : undefined}
                                        >
                                            <span data-nlv-field-path={productFieldPath ? `${productFieldPath}.sizes.${index}.size` : undefined}>
                                                {size.size}
                                            </span>
                                            {String(size.id).includes('ml') ? 'ml' : 'g'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-3xl font-bold" data-nlv-field-path={productFieldPath && selectedSizeIndex >= 0 ? `${productFieldPath}.sizes.${selectedSizeIndex}.price` : undefined}>${selectedSize?.price.toFixed(2)}</p>
                                <button
                                    onClick={handleAddToCart}
                                    className="flex items-center gap-2 px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors"
                                >
                                    <Plus size={18} /> <span data-nlv-field-path="translations.en.pdp.addToCart">{t('pdp.addToCart')}</span>
                                </button>
                            </div>
                        </motion.div>
                        
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
                            <div className="border-b border-stone-200">
                                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`${
                                                activeTab === tab.id
                                                    ? 'border-stone-800 text-stone-900'
                                                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                        >
                                            <span data-nlv-field-path={tab.fieldPath}>{tab.label}</span>
                                        </button>
                                    ))}
                                </nav>
                            </div>
                            <div className="mt-6 prose prose-stone max-w-none text-stone-700">
                                {activeTab === 'benefits' && (
                                    <ul className="list-disc pl-5 space-y-2">
                                        {(translate(product.benefits) as string[]).map((benefit: string, index: number) => (
                                            <li
                                                key={index}
                                                data-nlv-field-path={productFieldPath ? `${productFieldPath}.benefits.en.${index}` : undefined}
                                            >
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {activeTab === 'howToUse' && (
                                    <p data-nlv-field-path={productFieldPath ? `${productFieldPath}.howToUse.en` : undefined}>{translate(product.howToUse)}</p>
                                )}
                                {activeTab === 'ingredients' && (
                                    <p data-nlv-field-path={productFieldPath ? `${productFieldPath}.ingredients.en` : undefined}>{translate(product.ingredients)}</p>
                                )}
                                {activeTab === 'labTested' && (
                                    <p data-nlv-field-path={productFieldPath ? `${productFieldPath}.labTestedNote.en` : undefined}>{translate(product.labTestedNote)}</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
            
            {relatedProducts.length > 0 && (
                <div className="py-16 sm:py-24 bg-stone-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-semibold text-center mb-12" data-nlv-field-path="translations.en.pdp.relatedProducts">{t('pdp.relatedProducts')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
