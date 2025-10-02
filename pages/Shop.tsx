import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Stethoscope } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import ProductCard from '../components/ProductCard';
import { useLanguage } from '../contexts/LanguageContext';
import type { Product, ShopCategory, ShopCategoryLink, ShopContent } from '../types';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';

const linkIcons: Record<ShopCategoryLink['type'], LucideIcon> = {
  product: ArrowUpRight,
  article: BookOpen,
  clinics: Stethoscope,
};

interface ProductsResponse {
  items: Product[];
}

const Shop: React.FC = () => {
  const [sortOption, setSortOption] = useState('featured');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { t, translate, language } = useLanguage();
  const { contentVersion } = useVisualEditorSync();

  const handleCategoryClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const { tabId } = event.currentTarget.dataset;
    if (tabId) {
      setActiveCategoryId(tabId);
    }
  }, [setActiveCategoryId]);

  const handleSortChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(event.target.value);
  }, [setSortOption]);

  useEffect(() => {
    let isMounted = true;

    const loadShopData = async () => {
      setLoading(true);
      try {
        const [productData, shopData] = await Promise.all([
          fetchVisualEditorJson<ProductsResponse>('/content/products/index.json'),
          fetchVisualEditorJson<ShopContent>('/content/shop.json'),
        ]);

        if (!isMounted) {
          return;
        }

        setProducts(Array.isArray(productData?.items) ? productData.items : []);
        setCategories(shopData?.categories ?? []);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load shop content', error);
        setProducts([]);
        setCategories([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadShopData().catch((error) => {
      console.error('Unhandled error while loading shop content', error);
    });

    return () => {
      isMounted = false;
    };
  }, [contentVersion]);

  useEffect(() => {
    if (categories.length === 0) {
      setActiveCategoryId('all');
    } else if (categories.every(category => category.id !== activeCategoryId) && activeCategoryId !== 'all') {
      setActiveCategoryId('all');
    }
  }, [categories, activeCategoryId]);

  const sortProducts = useCallback((list: Product[]) => {
    if (sortOption === 'featured') {
      return list;
    }

    const sorted = [...list];

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
  }, [sortOption, translate]);

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(product => {
      map.set(product.id, product);
    });
    return map;
  }, [products]);

  const activeCategory = useMemo(() => {
    if (activeCategoryId === 'all') {
      return undefined;
    }
    return categories.find(category => category.id === activeCategoryId);
  }, [activeCategoryId, categories]);

  const activeCategoryIndex = activeCategory
    ? categories.findIndex(category => category.id === activeCategory.id)
    : -1;

  const displayedProducts = useMemo(() => {
    if (!activeCategory) {
      return sortProducts(products);
    }

    const categoryProducts = activeCategory.productIds
      .map(productId => productsById.get(productId))
      .filter((product): product is Product => Boolean(product));

    return sortProducts(categoryProducts);
  }, [activeCategory, products, productsById, sortProducts]);

  const categoryTabs = useMemo(() => {
    const tabs = categories.map((category, index) => ({
      id: category.id,
      label: translate(category.title),
      fieldPath: `shop.categories.${index}.title.${language}`,
    }));

    return [
      {
        id: 'all',
        label: t('shop.title'),
        fieldPath: `translations.${language}.shop.title`,
      },
      ...tabs,
    ];
  }, [categories, t, translate, language]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Helmet>
        <title>{t('shop.title')} | Kapunka Skincare</title>
        <meta name="description" content={t('shop.metaDescription')} />
      </Helmet>
      <header className="text-center mb-12">
        <h1
          className="text-4xl sm:text-5xl font-semibold tracking-tight"
          {...getVisualEditorAttributes(`translations.${language}.shop.title`)}
        >
          {t('shop.title')}
        </h1>
        <p
          className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto"
          {...getVisualEditorAttributes(`translations.${language}.shop.subtitle`)}
        >
          {t('shop.subtitle')}
        </p>
      </header>

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-10">
        <div className="md:flex-1">
          <p className="text-xs uppercase tracking-widest text-stone-500">
            <span {...getVisualEditorAttributes(`translations.${language}.shop.categoryFilterLabel`)}>
              {t('shop.categoryFilterLabel')}
            </span>
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={handleCategoryClick}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategoryId === tab.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-300 text-stone-600 hover:border-stone-500 hover:text-stone-900'
                }`}
                data-tab-id={tab.id}
              >
                <span {...getVisualEditorAttributes(tab.fieldPath)}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="md:w-60">
          <label htmlFor="shop-sort" className="sr-only">
            <span {...getVisualEditorAttributes(`translations.${language}.shop.sortLabel`)}>
              {t('shop.sortLabel')}
            </span>
          </label>
          <select
            id="shop-sort"
            value={sortOption}
            onChange={handleSortChange}
            className="w-full border-stone-300 rounded-md shadow-sm focus:border-stone-500 focus:ring-stone-500"
          >
            <option value="featured" {...getVisualEditorAttributes(`translations.${language}.shop.sortFeatured`)}>
              {t('shop.sortFeatured')}
            </option>
            <option value="price-asc" {...getVisualEditorAttributes(`translations.${language}.shop.sortPriceAsc`)}>
              {t('shop.sortPriceAsc')}
            </option>
            <option value="price-desc" {...getVisualEditorAttributes(`translations.${language}.shop.sortPriceDesc`)}>
              {t('shop.sortPriceDesc')}
            </option>
            <option value="name-asc" {...getVisualEditorAttributes(`translations.${language}.shop.sortNameAsc`)}>
              {t('shop.sortNameAsc')}
            </option>
            <option value="name-desc" {...getVisualEditorAttributes(`translations.${language}.shop.sortNameDesc`)}>
              {t('shop.sortNameDesc')}
            </option>
          </select>
        </div>
      </div>

      <div className="mb-12">
        {activeCategory ? (
          <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-sm">
            <h2
              className="text-2xl font-semibold text-stone-900"
              {...getVisualEditorAttributes(
                activeCategoryIndex >= 0 ? `shop.categories.${activeCategoryIndex}.title.${language}` : undefined
              )}
            >
              {translate(activeCategory.title)}
            </h2>
            <p
              className="mt-3 text-stone-600 leading-relaxed"
              {...getVisualEditorAttributes(
                activeCategoryIndex >= 0 ? `shop.categories.${activeCategoryIndex}.intro.${language}` : undefined
              )}
            >
              {translate(activeCategory.intro)}
            </p>
            {activeCategory.links.length > 0 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest text-stone-500 mb-3">
                  <span {...getVisualEditorAttributes(`translations.${language}.shop.relatedResources`)}>
                    {t('shop.relatedResources')}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeCategory.links.map((link, linkIndex) => {
                    const Icon = linkIcons[link.type];
                    return (
                      <Link
                        key={link.id}
                        to={link.url}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-stone-100 text-stone-700 rounded-full text-sm font-medium hover:bg-stone-200 transition-colors"
                        {...getVisualEditorAttributes(
                          activeCategoryIndex >= 0
                            ? `shop.categories.${activeCategoryIndex}.links.${linkIndex}.label.${language}`
                            : undefined
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{translate(link.label)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-stone-600 leading-relaxed max-w-3xl">
            <p {...getVisualEditorAttributes(`translations.${language}.shop.subtitle`)}>
              {t('shop.subtitle')}
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center py-10" {...getVisualEditorAttributes(`translations.${language}.common.loadingProducts`)}>
          {t('common.loadingProducts')}
        </p>
      ) : displayedProducts.length === 0 ? (
        <p className="text-center py-10" {...getVisualEditorAttributes(`translations.${language}.shop.noProducts`)}>
          {t('shop.noProducts')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {displayedProducts.map((product, index) => {
            const productIndex = products.findIndex((item) => item.id === product.id);
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
      )}
    </div>
  );
};

export default Shop;
