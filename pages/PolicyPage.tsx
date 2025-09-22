import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../contexts/LanguageContext';

const getPolicyContent = (type: string | undefined, t: (key: string) => string) => {
    const policies: Record<string, { title: string, content: string }> = {
        shipping: {
            title: t('footer.shipping'),
            content: "We offer standard and express shipping options. All orders are processed within 1-2 business days. Shipping times and costs will be calculated at checkout based on your location. You will receive a tracking number once your order has shipped."
        },
        returns: {
            title: t('footer.returns'),
            content: "We want you to be happy with your purchase. If you are not satisfied, you can return your product within 30 days of receipt for a full refund. Please contact our customer service to initiate a return. Products must be at least half full to be eligible for a refund."
        },
        privacy: {
            title: t('footer.privacy'),
            content: "Your privacy is important to us. We collect personal information to process your orders and improve your experience. We do not sell your data to third parties. Our website uses cookies for functionality and analytics. You can manage your cookie preferences at any time."
        },
        terms: {
            title: t('footer.terms'),
            content: "By using this website, you agree to our terms and conditions. All content on this site is the property of Kapunka Skincare. We reserve the right to refuse service to anyone for any reason at any time. Prices for our products are subject to change without notice."
        }
    };
    return policies[type || ''] || { title: 'Policy Not Found', content: 'The requested policy page could not be found.' };
};

const PolicyPage: React.FC = () => {
    const { type } = useParams<{ type: string }>();
    const { t } = useLanguage();
    const { title, content } = getPolicyContent(type, t);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12 sm:py-16">
            <Helmet>
                <title>{title} | Kapunka Skincare</title>
            </Helmet>
            <header className="mb-12">
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">{title}</h1>
            </header>
            <div className="prose prose-stone lg:prose-lg max-w-none text-stone-700 leading-relaxed">
                <p>{content}</p>
                <p>For more detailed information or specific questions, please <Link to="/contact">contact us</Link>.</p>
            </div>
        </div>
    );
};

export default PolicyPage;
