
import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { formatCurrency } from '../utils/currency';
import { getCloudinaryUrl } from '../utils/imageUrl';
import type { Product } from '../types';
import { buildLocalizedPath } from '../utils/localePaths';

interface ProductCardProps {
  product: Product;
  fieldPath?: string;
}

const ProductCard: React.FC<ProductCardProps> = (props) => {
  const { product, fieldPath } = props;
  const [selectedSizeId, setSelectedSizeId] = useState(product.sizes[0].id);
  const { addToCart } = useCart();
  const { openCart } = useUI();
  const { translate, language } = useLanguage();
  const translatedTitleAddition = product.titleAddition
    ? (translate(product.titleAddition) as string)
    : null;
  const translatedTagline = translate(product.tagline) as string;

  const selectedSize = useMemo(() => {
    return product.sizes.find(s => s.id === selectedSizeId) || product.sizes[0];
  }, [selectedSizeId, product.sizes]);

  const pricePerMl = useMemo(() => {
    if (!selectedSize || selectedSize.size === 0) {
      return null;
    }

    return selectedSize.price / selectedSize.size;
  }, [selectedSize]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product.id, selectedSizeId);
    openCart();
  };

  const handleSizeSelection = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const { sizeId } = event.currentTarget.dataset;
    if (sizeId) {
      setSelectedSizeId(sizeId);
    }
  }, [setSelectedSizeId]);

  const productImageSrc = (product.imageUrl ?? '').trim();
  const cloudinaryUrl = productImageSrc ? getCloudinaryUrl(productImageSrc) ?? productImageSrc : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="group"
      {...getVisualEditorAttributes(fieldPath)}
    >
      <Link to={buildLocalizedPath(`/product/${product.id}`, language)} className="block">
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={cloudinaryUrl}
            alt={translate(product.name)}
            className="w-full h-auto aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-105"
            {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.imageUrl` : undefined)}
          />
          <button
            onClick={handleAddToCart}
            className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-full text-stone-800 shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110"
            aria-label={`Add ${translate(product.name)} to cart`}
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="mt-4">
          <h3
            className="font-semibold text-stone-800"
            {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.name.${language}` : undefined)}
          >
            {translate(product.name)}
          </h3>
          {translatedTitleAddition && (
            <p
              className="text-xs uppercase tracking-wide text-stone-500 mt-1"
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.titleAddition.${language}` : undefined)}
            >
              {translatedTitleAddition}
            </p>
          )}
          {(!translatedTitleAddition || translatedTitleAddition !== translatedTagline) && (
            <p
              className="text-sm text-stone-500 mt-1"
              {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.tagline.${language}` : undefined)}
            >
              {translatedTagline}
            </p>
          )}
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-center space-x-2">
              {product.sizes.map((size, sizeIndex) => (
                <button
                  key={size.id}
                  onClick={handleSizeSelection}
                  className={`text-xs px-2 py-1 border rounded-full transition-colors duration-300 ${
                    selectedSizeId === size.id
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'border-stone-300 text-stone-500 hover:border-stone-800 hover:text-stone-800'
                  }`}
                  data-size-id={size.id}
                  {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.sizes.${sizeIndex}` : undefined)}
                >
                  <span
                    {...getVisualEditorAttributes(fieldPath ? `${fieldPath}.sizes.${sizeIndex}.size` : undefined)}
                  >
                    {size.size}
                  </span>
                  ml
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-stone-800">
              <span
                {...getVisualEditorAttributes(
                  fieldPath && selectedSize
                    ? `${fieldPath}.sizes.${product.sizes.findIndex((s) => s.id === selectedSize.id)}.price`
                    : undefined
                )}
              >
                {formatCurrency(selectedSize.price, language)}
              </span>
              {pricePerMl !== null && (
                <span className="text-xs text-stone-400 ml-1">({formatCurrency(pricePerMl, language)}/ml)</span>
              )}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
