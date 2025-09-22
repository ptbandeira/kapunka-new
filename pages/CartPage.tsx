import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';

import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { CartItem, Product } from '../types';

const CartItemRow: React.FC<{ item: CartItem; product?: Product }> = ({ item, product }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { translate } = useLanguage();
  
  const size = product?.sizes.find(s => s.id === item.sizeId);

  if (!product || !size) return null;

  return (
    <div className="grid grid-cols-12 gap-4 items-center py-4 border-b border-stone-200">
      <div className="col-span-2">
        <img src={product.imageUrl} alt={translate(product.name)} className="w-20 h-20 object-cover rounded-md"/>
      </div>
      <div className="col-span-4">
        <p className="font-semibold">{translate(product.name)}</p>
        <p className="text-sm text-stone-500">{size.size}ml</p>
      </div>
      <div className="col-span-3 flex items-center">
        <button onClick={() => updateQuantity(item.productId, item.sizeId, item.quantity - 1)} className="p-1 text-stone-500 hover:text-stone-900"><Minus size={16} /></button>
        <span className="px-4 text-center">{item.quantity}</span>
        <button onClick={() => updateQuantity(item.productId, item.sizeId, item.quantity + 1)} className="p-1 text-stone-500 hover:text-stone-900"><Plus size={16} /></button>
      </div>
      <div className="col-span-2 text-right">
        <p className="font-semibold">${(size.price * item.quantity).toFixed(2)}</p>
      </div>
      <div className="col-span-1 text-right">
        <button onClick={() => removeFromCart(item.productId, item.sizeId)} className="text-stone-400 hover:text-red-500"><Trash2 size={18} /></button>
      </div>
    </div>
  );
};

const CartPage: React.FC = () => {
    const { cart, cartCount } = useCart();
    const { t } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetch('/content/products/index.json')
          .then(res => res.json())
          .then(data => {
            setProducts(data.items);
            setLoading(false);
          });
      }, []);

    const subtotal = cart.reduce((total, item) => {
        const product = products.find(p => p.id === item.productId);
        const size = product?.sizes.find(s => s.id === item.sizeId);
        return total + (size ? size.price * item.quantity : 0);
    }, 0);
    
    if (loading) {
        return <div className="text-center py-20">{t('common.loadingCart')}</div>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <Helmet>
                <title>{t('cart.pageTitle')} | Kapunka Skincare</title>
            </Helmet>
            <header className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">{t('cart.pageTitle')}</h1>
            </header>
            
            {cartCount > 0 ? (
                <div className="grid lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                        {cart.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            return <CartItemRow key={`${item.productId}-${item.sizeId}`} item={item} product={product} />
                        })}
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-stone-100 p-8 rounded-lg">
                            <h2 className="text-2xl font-semibold mb-6">{t('cart.summary')}</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span>{t('cart.subtotal')}</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('cart.shipping')}</span>
                                    <span>{t('cart.shippingCalculated')}</span>
                                </div>
                                <div className="border-t border-stone-300 my-4"></div>
                                <div className="flex justify-between font-bold text-lg">
                                    <span>{t('cart.total')}</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                            </div>
                            <button className="mt-8 w-full bg-stone-900 text-white py-3 rounded-md font-semibold hover:bg-stone-700 transition-colors">
                                {t('cart.checkout')}
                            </button>
                             <p className="text-xs text-stone-500 text-center mt-2">{t('cart.checkoutRedirect')}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                >
                    <p className="text-xl text-stone-600 mb-6">{t('cart.empty')}</p>
                    <Link to="/shop" className="px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors">
                        {t('cart.continueShopping')}
                    </Link>
                </motion.div>
            )}
        </div>
    );
};

export default CartPage;