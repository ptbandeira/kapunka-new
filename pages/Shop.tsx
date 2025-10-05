import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Stethoscope } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import ProductCard from '../components/ProductCard';
import { useLanguage } from '../contexts/LanguageContext';
import type { Product, ShopCategory, ShopCategoryLink, ShopContent } from '../types';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { buildLocalizedPath } from '../utils/localePaths';
import Seo from '../src/components/Seo';
import { getCloudinaryUrl } from '../utils/imageUrl';

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

  const siteUrl = useMemo(() => {
    const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim();
    if (raw.length > 0) {
      return raw.replace(/\/+$/, '');
    }

    if (typeof window !== 'undefined') {
      return window.location.origin;
    }

    return undefined;
  }, []);

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

  const featuredProductImage = useMemo(() => {
    if (displayedProducts.length === 0) {
      return undefined;
    }

    const normalized = getCloudinaryUrl(displayedProducts[0].imageUrl) ?? displayedProducts[0].imageUrl;
    if (!normalized) {
      return undefined;
    }

    const trimmed = normalized.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, [displayedProducts]);

  const productJsonLd = useMemo(() => {
    if (displayedProducts.length === 0) {
      return undefined;
    }

    const nodes = displayedProducts
      .map((product) => {
        const name = (translate(product.name) as string | undefined)?.trim();
        if (!name) {
          return null;
        }

        const descriptionCandidate = product.description
          ? (translate(product.description) as string | undefined)
          : (translate(product.tagline) as string | undefined);
        const descriptionText = descriptionCandidate?.trim();

        const rawImage = getCloudinaryUrl(product.imageUrl) ?? product.imageUrl;
        if (!rawImage) {
          return null;
        }

        const trimmedImage = rawImage.trim();
        if (trimmedImage.length === 0) {
          return null;
        }

        const node: Record<string, unknown> = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name,
          image: trimmedImage,
        };

        if (descriptionText) {
          node.description = descriptionText;
        }

        if (siteUrl) {
          node.url = `${siteUrl}${buildLocalizedPath(`/product/${product.id}`, language)}`;
        }

        return node;
      })
      .filter((node): node is Record<string, unknown> => Boolean(node));

    return nodes.length > 0 ? nodes : undefined;
  }, [displayedProducts, language, siteUrl, translate]);

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

  const pageTitle = `${t('shop.title')} | Kapunka Skincare`;
  const description = t('shop.metaDescription');

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Seo
        title={pageTitle}
        description={description}
        locale={language}
        image={featuredProductImage}
        jsonLd={productJsonLd}
      />
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
                    const isInternalLink = Boolean(link.url?.startsWith('/') || link.url?.startsWith('#/'));
                    const normalizedUrl = isInternalLink
                      ? buildLocalizedPath(link.url?.startsWith('#/') ? link.url.slice(1) : link.url, language)
                      : link.url;
                    const commonProps = {
                      className: 'inline-flex items-center gap-2 px-3 py-2 bg-stone-100 text-stone-700 rounded-full text-sm font-medium hover:bg-stone-200 transition-colors',
                      ...getVisualEditorAttributes(
                        activeCategoryIndex >= 0
                          ? `shop.categories.${activeCategoryIndex}.links.${linkIndex}.label.${language}`
                          : undefined,
                      ),
                    } as const;

                    if (!normalizedUrl) {
                      return null;
                    }

                    return isInternalLink ? (
                      <Link key={link.id} to={normalizedUrl} {...commonProps}>
                        <Icon className="w-4 h-4" />
                        <span>{translate(link.label)}</span>
                      </Link>
                    ) : (
                      <a
                        key={link.id}
                        href={normalizedUrl}
                        target="_blank"
                        rel="noreferrer"
                        {...commonProps}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{translate(link.label)}</span>
                      </a>
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
