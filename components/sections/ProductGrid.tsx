import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useVisualEditorSync } from '../../contexts/VisualEditorSyncContext';
import ProductCard from '../ProductCard';
import { getVisualEditorAttributes } from '../../utils/stackbitBindings';
import { fetchContentJson } from '../../utils/fetchContentJson';
import { getCloudinaryUrl } from '../../utils/imageUrl';
import { buildLocalizedPath } from '../../utils/localePaths';
import type { Product, ProductGridSectionContent, LocalizedNumber } from '../../types';
import { resolveCmsHref } from '../../utils/cmsLinks';

interface ProductGridProps {
  section: ProductGridSectionContent;
  fieldPath?: string;
}

interface ProductsResponse {
  items?: Product[];
}

const coerceNumber = (
  translate: ReturnType<typeof useLanguage>['translate'],
  value: LocalizedNumber | undefined,
): number | undefined => {
  if (value == null) {
    return undefined;
  }

  const translated = translate<number | string>(value);
  if (typeof translated === 'number') {
    return translated;
  }

  const parsed = Number(translated);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const ProductGrid: React.FC<ProductGridProps> = ({ section, fieldPath }) => {
  const { translate, language } = useLanguage();
  const { contentVersion } = useVisualEditorSync();
  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const data = await fetchContentJson<ProductsResponse>('/content/products/index.json');
        if (!isMounted) {
          return;
        }

        setCatalog(Array.isArray(data?.items) ? data.items : []);
      } catch (error) {
        console.error('Failed to load products for product grid section', error);
        if (isMounted) {
          setCatalog([]);
        }
      }
    };

    loadProducts().catch((error) => {
      console.error('Unhandled product grid load error', error);
    });

    return () => {
      isMounted = false;
    };
  }, [contentVersion]);

  const productIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    catalog.forEach((product, index) => {
      map.set(product.id, index);
    });
    return map;
  }, [catalog]);

  const resolvedTitle = section.title ? translate(section.title) : '';
  const resolvedColumns = coerceNumber(translate, section.columns);

  const referencedProducts = useMemo(() => {
    const ids = (section.products ?? []).map((ref) => {
      const rawId = ref?.id ? translate(ref.id) : '';
      return rawId?.trim();
    }).filter((id): id is string => Boolean(id));

    if (ids.length === 0) {
      return [] as Array<{ product: Product; fieldPath?: string }>;
    }

    return ids
      .map((id) => {
        const product = catalog.find((item) => item.id === id);
        if (!product) {
          return null;
        }
        const productIndex = productIndexMap.get(product.id);
        const productFieldPath = productIndex != null ? `products.items.${productIndex}` : undefined;
        return { product, fieldPath: productFieldPath };
      })
      .filter((entry): entry is { product: Product; fieldPath?: string } => entry !== null);
  }, [section.products, translate, catalog, productIndexMap]);

  const highlightItems = (section.items ?? []).map((item, index) => {
    const eyebrow = item?.eyebrow ? translate(item.eyebrow) : '';
    const title = item?.title ? translate(item.title) : '';
    const label = item?.label ? translate(item.label) : '';
    const description = item?.description ? translate(item.description) : '';
    const body = item?.body ? translate(item.body) : '';
    const ctaLabel = item?.ctaLabel ? translate(item.ctaLabel) : '';
    const ctaHref = item?.ctaHref ? translate(item.ctaHref) : '';
    const imageSrc = item?.image?.trim();
    const imageUrl = imageSrc ? getCloudinaryUrl(imageSrc) ?? imageSrc : undefined;
    const imageAlt = item?.imageAlt ? translate(item.imageAlt) : title || label || eyebrow || 'Highlight image';
    const itemFieldPath = fieldPath ? `${fieldPath}.items.${index}` : undefined;

    return {
      eyebrow,
      title,
      label,
      description,
      body,
      ctaLabel,
      ctaHref,
      imageUrl,
      imageAlt,
      fieldPath: itemFieldPath,
      eyebrowFieldPath: itemFieldPath ? `${itemFieldPath}.eyebrow` : undefined,
      titleFieldPath: itemFieldPath ? `${itemFieldPath}.title` : undefined,
      labelFieldPath: itemFieldPath ? `${itemFieldPath}.label` : undefined,
      descriptionFieldPath: itemFieldPath ? `${itemFieldPath}.description` : undefined,
      bodyFieldPath: itemFieldPath ? `${itemFieldPath}.body` : undefined,
      ctaLabelFieldPath: itemFieldPath ? `${itemFieldPath}.ctaLabel` : undefined,
      ctaHrefFieldPath: itemFieldPath ? `${itemFieldPath}.ctaHref` : undefined,
      imageFieldPath: itemFieldPath ? `${itemFieldPath}.image` : undefined,
      hasContent: Boolean(title?.trim() || label?.trim() || description?.trim() || body?.trim() || imageUrl),
    };
  }).filter((item) => item.hasContent);

  if (!resolvedTitle?.trim() && referencedProducts.length === 0 && highlightItems.length === 0) {
    return null;
  }

  const productGridColumns = referencedProducts.length >= 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2';
  const highlightColumns = (() => {
    const columns = resolvedColumns && resolvedColumns >= 1 ? Math.min(Math.round(resolvedColumns), 4) : undefined;
    switch (columns) {
      case 4:
        return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  })();

  const renderHighlightCta = (item: (typeof highlightItems)[number]) => {
    if (!item.ctaLabel?.trim() || !item.ctaHref?.trim()) {
      return null;
    }

    const { internalPath, externalUrl } = resolveCmsHref(item.ctaHref);

    if (internalPath) {
      return (
        <Link
          to={buildLocalizedPath(internalPath, language)}
          className="inline-flex items-center rounded-full border border-stone-900 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-900 hover:text-white"
          {...getVisualEditorAttributes(item.ctaHrefFieldPath)}
        >
          <span {...getVisualEditorAttributes(item.ctaLabelFieldPath)}>{item.ctaLabel}</span>
        </Link>
      );
    }

    return (
      <a
        href={externalUrl ?? item.ctaHref}
        className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-500 hover:text-stone-900"
        target="_blank"
        rel="noreferrer"
        {...getVisualEditorAttributes(item.ctaHrefFieldPath)}
      >
        <span {...getVisualEditorAttributes(item.ctaLabelFieldPath)}>{item.ctaLabel}</span>
      </a>
    );
  };

  return (
    <section className="py-16 sm:py-24 bg-stone-100" {...getVisualEditorAttributes(fieldPath)} data-sb-field-path={fieldPath}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {resolvedTitle?.trim() ? (
          <div className="mb-12 text-center">
            <h2
              className="text-3xl sm:text-4xl font-semibold text-stone-900"
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.title` : undefined)}
            >
              {resolvedTitle}
            </h2>
          </div>
        ) : null}

        {referencedProducts.length > 0 ? (
          <div className={`grid gap-8 ${productGridColumns}`}>
            {referencedProducts.map(({ product, fieldPath: productField }, index) => (
              <ProductCard key={product.id ?? index} product={product} fieldPath={productField} />
            ))}
          </div>
        ) : null}

        {highlightItems.length > 0 ? (
          <div
            className={`${referencedProducts.length > 0 ? 'mt-14' : ''} grid gap-8 ${highlightColumns}`.trim()}
          >
            {highlightItems.map((item, index) => (
              <article
                key={item.fieldPath ?? index}
                className="rounded-3xl bg-white p-6 shadow-sm"
                {...getVisualEditorAttributes(item.fieldPath)}
                data-sb-field-path={item.fieldPath}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    className="mb-4 h-48 w-full rounded-2xl object-cover"
                    {...getVisualEditorAttributes(item.imageFieldPath)}
                  />
                ) : null}
                {item.eyebrow?.trim() ? (
                  <span
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
                    {...getVisualEditorAttributes(item.eyebrowFieldPath)}
                  >
                    {item.eyebrow}
                  </span>
                ) : null}
                {item.title?.trim() ? (
                  <h3
                    className="mt-2 text-2xl font-semibold text-stone-900"
                    {...getVisualEditorAttributes(item.titleFieldPath)}
                  >
                    {item.title}
                  </h3>
                ) : null}
                {item.label?.trim() ? (
                  <p
                    className="mt-1 text-sm font-medium uppercase tracking-[0.12em] text-stone-500"
                    {...getVisualEditorAttributes(item.labelFieldPath)}
                  >
                    {item.label}
                  </p>
                ) : null}
                {item.description?.trim() ? (
                  <p
                    className="mt-3 text-sm text-stone-600"
                    {...getVisualEditorAttributes(item.descriptionFieldPath)}
                  >
                    {item.description}
                  </p>
                ) : null}
                {item.body?.trim() ? (
                  <div
                    className="mt-4 text-sm leading-relaxed text-stone-600"
                    {...getVisualEditorAttributes(item.bodyFieldPath)}
                  >
                    <ReactMarkdown>{item.body}</ReactMarkdown>
                  </div>
                ) : null}
                {item.ctaLabel?.trim() && item.ctaHref?.trim() ? (
                  <div className="mt-6">{renderHighlightCta(item)}</div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ProductGrid;
