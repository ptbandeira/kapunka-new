import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplet, ShieldCheck, Leaf } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../contexts/LanguageContext';
import type { Product, Review } from '../types';

const Bestsellers: React.FC = () => {
    const { t } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    
    useEffect(() => {
        fetch('/content/products/index.json')
            .then(res => res.json())
            .then(data => setProducts(data.items.slice(0, 3)));
    }, []);

    return (
        <div className="py-16 sm:py-24 bg-stone-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl sm:text-4xl font-semibold text-center mb-12"
                >
                    {t('home.bestsellersTitle')}
                </motion.h2>
                {products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map(product => <ProductCard key={product.id} product={product} />)}
                    </div>
                ) : <p className="text-center">Loading bestsellers...</p>}
            </div>
        </div>
    );
};

const ValueProps: React.FC = () => {
    const { t } = useLanguage();
    const props = [
        { icon: Droplet, text: t('home.value1') },
        { icon: ShieldCheck, text: t('home.value2') },
        { icon: Leaf, text: t('home.value3') },
    ];
    return (
        <div className="py-16 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {props.map((prop, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            <prop.icon className="mx-auto h-10 w-10 text-stone-600 mb-4" />
                            <p className="text-stone-600">{prop.text}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Reviews: React.FC = () => {
    const { t, translate } = useLanguage();
    const [reviews, setReviews] = useState<Review[]>([]);
    
    useEffect(() => {
        fetch('/content/reviews/index.json')
            .then(res => res.json())
            .then(data => setReviews(data.items.slice(0, 3)));
    }, []);

    return (
        <div className="py-16 sm:py-24 bg-stone-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl sm:text-4xl font-semibold text-center mb-12"
                >
                    {t('home.reviewsTitle')}
                </motion.h2>
                {reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {reviews.map((review, index) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="p-8 bg-stone-100 rounded-lg text-center"
                            >
                                <p className="text-stone-700 italic">"{translate(review.text)}"</p>
                                <p className="mt-6 font-semibold">{translate(review.author)}</p>
                                <p className="text-sm text-stone-500">{translate(review.role)}</p>
                            </motion.div>
                        ))}
                    </div>
                ) : <p className="text-center">Loading reviews...</p>}
            </div>
        </div>
    );
};

const NewsletterSignup: React.FC = () => {
    const { t } = useLanguage();
    const [email, setEmail] = React.useState('');
    const [submitted, setSubmitted] = React.useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Newsletter signup:', email);
        setSubmitted(true);
    };

    return (
        <div className="py-16 sm:py-24 bg-stone-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl sm:text-4xl font-semibold mb-4">{t('home.newsletterTitle')}</h2>
                    <p className="text-stone-600 mb-8">{t('home.newsletterSubtitle')}</p>
                    {submitted ? (
                        <p className="text-lg text-green-700">{t('home.newsletterThanks')}</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('home.newsletterPlaceholder')}
                                required
                                className="flex-grow px-4 py-3 rounded-md border-stone-300 focus:ring-stone-500 focus:border-stone-500 transition"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors"
                            >
                                {t('home.newsletterSubmit')}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

const Home: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div>
        <Helmet>
            <title>Kapunka Skincare | {t('home.metaTitle')}</title>
            <meta name="description" content={t('home.metaDescription')} />
        </Helmet>
      <div className="relative h-screen bg-cover bg-center" style={{ backgroundImage: "url('/content/uploads/hero-abstract.jpg')" }}>
        <div className="absolute inset-0 bg-stone-50/30"></div>
        <div className="relative h-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center text-stone-900"
          >
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">{t('home.heroTitle')}</h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">{t('home.heroSubtitle')}</p>
            <div className="mt-8 flex justify-center gap-4">
              <Link to="/shop" className="px-8 py-3 bg-stone-900 text-white font-semibold rounded-md hover:bg-stone-700 transition-colors">
                {t('home.ctaShop')}
              </Link>
              <Link to="/for-clinics" className="px-8 py-3 bg-white/70 backdrop-blur-sm text-stone-900 font-semibold rounded-md hover:bg-white transition-colors">
                {t('home.ctaClinics')}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      <ValueProps />
      <Bestsellers />
      <Reviews />
      <NewsletterSignup />
    </div>
  );
};

export default Home;