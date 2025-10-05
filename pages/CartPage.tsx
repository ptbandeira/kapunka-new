import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';

import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { CartItem, Product } from '../types';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';
import { useVisualEditorSync } from '../contexts/VisualEditorSyncContext';
import { formatCurrency } from '../utils/currency';
import { buildLocalizedPath } from '../utils/localePaths';
import { getCloudinaryUrl } from '../utils/imageUrl';
import Seo from '../components/Seo';

interface ProductsResponse {
  items?: Product[];
}

const CartItemRow: React.FC<{ item: CartItem; product?: Product; productFieldPath?: string }> = ({ item, product, productFieldPath }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { translate, language } = useLanguage();

  const size = product?.sizes.find(s => s.id === item.sizeId);
  const sizeIndex = product?.sizes.findIndex(s => s.id === item.sizeId) ?? -1;
  const imageSrc = (product?.imageUrl ?? '').trim();
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

  if (!product || !size) return null;

  return (
    <div className="grid grid-cols-12 gap-4 items-center py-4 border-b border-stone-200" {...getVisualEditorAttributes(productFieldPath)}>
      <div className="col-span-2">
        <img
          src={cloudinaryUrl}
          alt={translate(product.name)}
          className="w-20 h-20 object-cover rounded-md"
          {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.imageUrl` : undefined)}
        />
      </div>
      <div className="col-span-4">
        <p className="font-semibold" {...getVisualEditorAttributes(productFieldPath ? `${productFieldPath}.name.en` : undefined)}>
          {translate(product.name)}
        </p>
        <p
          className="text-sm text-stone-500"
          {...getVisualEditorAttributes(
            productFieldPath && sizeIndex >= 0 ? `${productFieldPath}.sizes.${sizeIndex}.size` : undefined
          )}
        >
          {size.size}ml
        </p>
      </div>
      <div className="col-span-3 flex items-center">
        <button onClick={handleDecreaseQuantity} className="p-1 text-stone-500 hover:text-stone-900"><Minus size={16} /></button>
        <span className="px-4 text-center">{item.quantity}</span>
        <button onClick={handleIncreaseQuantity} className="p-1 text-stone-500 hover:text-stone-900"><Plus size={16} /></button>
      </div>
      <div className="col-span-2 text-right">
        <p
          className="font-semibold"
          {...getVisualEditorAttributes(
            productFieldPath && sizeIndex >= 0 ? `${productFieldPath}.sizes.${sizeIndex}.price` : undefined
          )}
        >
          {formatCurrency(size.price * item.quantity, language)}
        </p>
      </div>
      <div className="col-span-1 text-right">
        <button onClick={handleRemoveItem} className="text-stone-400 hover:text-red-500"><Trash2 size={18} /></button>
      </div>
    </div>
  );
};

const CartPage: React.FC = () => {
    const { cart, cartCount } = useCart();
    const { t, language } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { contentVersion } = useVisualEditorSync();

    const cartFieldPath = `translations.${language}.cart`;
    const commonFieldPath = `translations.${language}.common`;
    
    useEffect(() => {
        let isMounted = true;

        const loadProducts = async () => {
          setLoading(true);
          try {
            const data = await fetchVisualEditorJson<ProductsResponse>('/content/products/index.json');
            if (!isMounted) {
              return;
            }
            setProducts(Array.isArray(data.items) ? data.items : []);
          } catch (error) {
            if (isMounted) {
              console.error('Failed to load cart products', error);
              setProducts([]);
            }
          } finally {
            if (isMounted) {
              setLoading(false);
            }
          }
        };

        loadProducts().catch((error) => {
          console.error('Unhandled error while loading cart products', error);
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
    
    if (loading) {
        return (
            <div className="text-center py-20" {...getVisualEditorAttributes(`${commonFieldPath}.loadingCart`)}>
                {t('common.loadingCart')}
            </div>
        );
    }

    const pageTitle = `${t('cart.pageTitle')} | Kapunka Skincare`;
    const description = t('cart.shippingNote');

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <Seo title={pageTitle} description={description} locale={language} />
            <header className="text-center mb-12">
                <h1
                    className="text-4xl sm:text-5xl font-semibold tracking-tight"
                    {...getVisualEditorAttributes(`${cartFieldPath}.pageTitle`)}
                >
                    {t('cart.pageTitle')}
                </h1>
            </header>

            {cartCount > 0 ? (
                <div className="grid lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                        {cart.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            const productIndex = products.findIndex(p => p.id === item.productId);
                            const productFieldPath = productIndex >= 0 ? `products.items.${productIndex}` : undefined;
                            return (
                                <CartItemRow
                                    key={`${item.productId}-${item.sizeId}`}
                                    item={item}
                                    product={product}
                                    productFieldPath={productFieldPath}
                                />
                            );
                        })}
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-stone-100 p-8 rounded-lg">
                            <h2
                                className="text-2xl font-semibold mb-6"
                                {...getVisualEditorAttributes(`${cartFieldPath}.summary`)}
                            >
                                {t('cart.summary')}
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span {...getVisualEditorAttributes(`${cartFieldPath}.subtotal`)}>
                                        {t('cart.subtotal')}
                                    </span>
                                    <span>{formatCurrency(subtotal, language)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span {...getVisualEditorAttributes(`${cartFieldPath}.shipping`)}>
                                        {t('cart.shipping')}
                                    </span>
                                    <span {...getVisualEditorAttributes(`${cartFieldPath}.shippingCalculated`)}>
                                        {t('cart.shippingCalculated')}
                                    </span>
                                </div>
                                <div className="border-t border-stone-300 my-4"></div>
                                <div className="flex justify-between font-bold text-lg">
                                    <span {...getVisualEditorAttributes(`${cartFieldPath}.total`)}>
                                        {t('cart.total')}
                                    </span>
                                    <span>{formatCurrency(subtotal, language)}</span>
                                </div>
                            </div>
                            <button className="mt-8 w-full bg-stone-900 text-white py-3 rounded-md font-semibold hover:bg-stone-700 transition-colors">
                                <span {...getVisualEditorAttributes(`${cartFieldPath}.checkout`)}>
                                    {t('cart.checkout')}
                                </span>
                            </button>
                             <p
                                className="text-xs text-stone-500 text-center mt-2"
                                {...getVisualEditorAttributes(`${cartFieldPath}.checkoutRedirect`)}
                             >
                                {t('cart.checkoutRedirect')}
                             </p>
                        </div>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                >
                    <p
                        className="text-xl text-stone-600 mb-6"
                        {...getVisualEditorAttributes(`${cartFieldPath}.empty`)}
                    >
                        {t('cart.empty')}
                    </p>
                    <Link
                        to={buildLocalizedPath('/shop', language)}
                        className="px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors"
                    >
                        <span {...getVisualEditorAttributes(`${cartFieldPath}.continueShopping`)}>
                            {t('cart.continueShopping')}
                        </span>
                    </Link>
                </motion.div>
            )}
        </div>
    );
};

export default CartPage;
