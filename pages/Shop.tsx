
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../contexts/LanguageContext';
import type { Product } from '../types';

const Shop: React.FC = () => {
  const [sortOption, setSortOption] = useState('featured');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, translate } = useLanguage();

  useEffect(() => {
      fetch('/content/products/index.json')
          .then(res => res.json())
          .then(data => {
              setProducts(data.items);
              setLoading(false);
          });
  }, []);

  const sortedProducts = useMemo(() => {
    let sorted = [...products];
    switch (sortOption) {
      case 'price-asc':
        sorted.sort((a, b) => a.sizes[0].price - b.sizes[0].price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.sizes[0].price - a.sizes[0].price);
        break;
      case 'name-asc':
        sorted.sort((a, b) => translate(a.name).localeCompare(translate(b.name)));
        break;
      case 'name-desc':
        sorted.sort((a, b) => translate(b.name).localeCompare(translate(a.name)));
        break;
      default:
        break;
    }
    return sorted;
  }, [sortOption, translate, products]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Helmet>
            <title>{t('shop.title')} | Kapunka Skincare</title>
            <meta name="description" content={t('shop.metaDescription')} />
        </Helmet>
      <header className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight" data-nlv-field-path="translations.en.shop.title">{t('shop.title')}</h1>
        <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto" data-nlv-field-path="translations.en.shop.subtitle">{t('shop.subtitle')}</p>
      </header>

      <div className="flex justify-end mb-8">
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="border-stone-300 rounded-md shadow-sm focus:border-stone-500 focus:ring-stone-500"
        >
          <option value="featured" data-nlv-field-path="translations.en.shop.sortFeatured">{t('shop.sortFeatured')}</option>
          <option value="price-asc" data-nlv-field-path="translations.en.shop.sortPriceAsc">{t('shop.sortPriceAsc')}</option>
          <option value="price-desc" data-nlv-field-path="translations.en.shop.sortPriceDesc">{t('shop.sortPriceDesc')}</option>
          <option value="name-asc" data-nlv-field-path="translations.en.shop.sortNameAsc">{t('shop.sortNameAsc')}</option>
          <option value="name-desc" data-nlv-field-path="translations.en.shop.sortNameDesc">{t('shop.sortNameDesc')}</option>
        </select>
      </div>

      {loading ? (
        <p className="text-center py-10">{t('common.loadingProducts')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sortedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
            ))}
        </div>
      )}
    </div>
  );
};

export default Shop;