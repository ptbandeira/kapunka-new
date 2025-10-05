
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { CartItem, Product } from '../types';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { formatCurrency } from '../utils/currency';
import { buildLocalizedPath } from '../utils/localePaths';
import { getCloudinaryUrl } from '../utils/imageUrl';

interface ProductIndexResponse {
  items?: Product[];
}

const MiniCartItem: React.FC<{ item: CartItem; products: Product[]; ['data-sb-field-path']?: string; }> = (props) => {
  const { item, products } = props;
  const dataSbFieldPath = props['data-sb-field-path'];
  const { updateQuantity, removeFromCart } = useCart();
  const { translate, language } = useLanguage();

  const product = products.find(p => p.id === item.productId);
  if (!product) return null;

  const size = product.sizes.find(s => s.id === item.sizeId);
  if (!size) return null;

  const imageSrc = (product.imageUrl ?? '').trim();
  const cloudinaryUrl = imageSrc ? getCloudinaryUrl(imageSrc) ?? imageSrc : '';

  const handleDecreaseQuantity = useCallback(() => {
    updateQuantity(item.productId, item.sizeId, item.quantity - 1);
  }, [updateQuantity, item.productId, item.sizeId, item.quantity]);

  const handleIncreaseQuantity = useCallback(() => {
    updateQuantity(item.productId, item.sizeId, item.quantity + 1);
  }, [updateQuantity, item.productId, item.sizeId, item.quantity]);

  const handleRemoveItem = useCallback(() => {
    removeFromCart(item.productId, item.sizeId);
  }, [removeFromCart, item.productId, item.sizeId]);

  return (
    <div className="flex items-center space-x-4 py-4" data-sb-field-path={dataSbFieldPath}>
      <img src={cloudinaryUrl} alt={translate(product.name)} className="w-16 h-16 object-cover rounded" />
      <div className="flex-grow">
        <h4 className="font-semibold text-sm">{translate(product.name)}</h4>
        <p className="text-xs text-stone-500">{size.size}ml</p>
        <div className="flex items-center mt-2">
          <button onClick={handleDecreaseQuantity} className="p-1 text-stone-500 hover:text-stone-900"><Minus size={14} /></button>
          <span className="px-3 text-sm">{item.quantity}</span>
          <button onClick={handleIncreaseQuantity} className="p-1 text-stone-500 hover:text-stone-900"><Plus size={14} /></button>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-sm">{formatCurrency(size.price * item.quantity, language)}</p>
        <button onClick={handleRemoveItem} className="text-stone-400 hover:text-red-500 mt-2"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};

const MiniCart: React.FC = () => {
  const { isCartOpen, closeCart } = useUI();
  const { cart, cartCount } = useCart();
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const { contentVersion } = useVisualEditorSync();

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const data = await fetchVisualEditorJson<ProductIndexResponse>('/content/products/index.json');
        if (!isMounted) {
          return;
        }
        setProducts(Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        console.error('Failed to load products for mini cart', error);
      }
    };

    loadProducts().catch(error => {
      console.error('Unhandled error while loading mini cart products', error);
    });

    return () => {
      isMounted = false;
    };
  }, [contentVersion]);

  const subtotal = cart.reduce((total, item) => {
    const product = products.find(p => p.id === item.productId);
    const size = product?.sizes.find(s => s.id === item.sizeId);
    return total + (size ? size.price * item.quantity : 0);
  }, 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeCart}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-stone-50 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h3 className="text-lg font-semibold">{t('cart.title')} ({cartCount})</h3>
              <button onClick={closeCart} className="p-2 -mr-2 text-stone-500 hover:text-stone-900"><X size={24} /></button>
            </div>
            {cart.length > 0 && products.length > 0 ? (
              <>
                <div className="flex-grow overflow-y-auto px-6 divide-y divide-stone-200">
                  {cart.map((item, index) => (
                    <MiniCartItem
                      key={`${item.productId}-${item.sizeId}`}
                      item={item}
                      products={products}
                      data-sb-field-path={`.${index}`}
                    />
                  ))}
                </div>
                <div className="p-6 border-t border-stone-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-stone-600">{t('cart.subtotal')}</span>
                    <span className="font-semibold text-lg">{formatCurrency(subtotal, language)}</span>
                  </div>
                  <p className="text-xs text-stone-400 text-center mb-4">{t('cart.shippingNote')}</p>
                  <Link to={buildLocalizedPath('/cart', language)} onClick={closeCart} className="block w-full text-center bg-stone-900 text-white py-3 rounded-md hover:bg-stone-700 transition-colors duration-300">
                    {t('cart.viewCart')}
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                <p className="text-stone-500 mb-4">{t('cart.empty')}</p>
                <Link to={buildLocalizedPath('/shop', language)} onClick={closeCart} className="bg-stone-200 text-stone-800 px-6 py-2 rounded-md hover:bg-stone-300 transition-colors duration-300">
                  {t('cart.continueShopping')}
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MiniCart;
