
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useUI } from '../contexts/UIContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [selectedSizeId, setSelectedSizeId] = useState(product.sizes[0].id);
  const { addToCart } = useCart();
  const { openCart } = useUI();
  const { translate } = useLanguage();

  const selectedSize = useMemo(() => {
    return product.sizes.find(s => s.id === selectedSizeId) || product.sizes[0];
  }, [selectedSizeId, product.sizes]);

  const pricePerMl = useMemo(() => {
    return (selectedSize.price / selectedSize.size).toFixed(2);
  }, [selectedSize]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product.id, selectedSizeId);
    openCart();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="group"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={product.imageUrl}
            alt={translate(product.name)}
            className="w-full h-auto aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-105"
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
          <h3 className="font-semibold text-stone-800">{translate(product.name)}</h3>
          <p className="text-sm text-stone-500 mt-1">{translate(product.tagline)}</p>
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-center space-x-2">
              {product.sizes.map(size => (
                <button
                  key={size.id}
                  onClick={(e) => { e.preventDefault(); setSelectedSizeId(size.id); }}
                  className={`text-xs px-2 py-1 border rounded-full transition-colors duration-300 ${
                    selectedSizeId === size.id
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'border-stone-300 text-stone-500 hover:border-stone-800 hover:text-stone-800'
                  }`}
                >
                  {size.size}ml
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-stone-800">
              ${selectedSize.price.toFixed(2)}
              <span className="text-xs text-stone-400 ml-1">(${pricePerMl}/ml)</span>
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
