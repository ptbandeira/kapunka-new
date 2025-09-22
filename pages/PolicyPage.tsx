import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../contexts/LanguageContext';
import type { Policy } from '../types';

const PolicyPage: React.FC = () => {
    const { type } = useParams<{ type: string }>();
    const { t, translate } = useLanguage();
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/content/policies.json')
            .then((res) => res.json())
            .then((data) => {
                setPolicies(data.items);
            })
            .catch((error) => {
                console.error('Failed to load policies', error);
            })
            .finally(() => setLoading(false));
    }, []);

    const policy = useMemo(() => {
        return policies.find((item) => item.id === type);
    }, [policies, type]);

    if (loading) {
        return <div className="text-center py-20">{t('policy.loading')}</div>;
    }

    if (!policy) {
        return <div className="text-center py-20">{t('policy.notFound')}</div>;
    }

    const title = translate(policy.title);
    const content = translate(policy.content);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12 sm:py-16">
            <Helmet>
                <title>{title} | Kapunka Skincare</title>
            </Helmet>
            <header className="mb-12">
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">{title}</h1>
            </header>
            <div className="prose prose-stone lg:prose-lg max-w-none text-stone-700 leading-relaxed space-y-4">
                {typeof content === 'string' ? (
                    <p>{content}</p>
                ) : Array.isArray(content) ? (
                    content.map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)
                ) : null}
                <p>{t('policy.contactPrompt')}</p>
                <p>
                    <Link to="/contact" className="text-stone-700 underline hover:text-stone-900">
                        {t('footer.contact')}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default PolicyPage;
