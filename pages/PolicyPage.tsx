import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../contexts/LanguageContext';
import type { Policy, PolicySection } from '../types';
import { fetchVisualEditorJson } from '../utils/fetchVisualEditorJson';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';

interface PoliciesResponse {
    items?: Policy[];
}

const PolicyPage: React.FC = () => {
    const { type } = useParams<{ type: string }>();
    const { t, translate, language } = useLanguage();
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadPolicies = async () => {
            try {
                const data = await fetchVisualEditorJson<PoliciesResponse>('/content/policies.json');
                if (!isMounted) {
                    return;
                }
                setPolicies(Array.isArray(data.items) ? data.items : []);
            } catch (error) {
                if (isMounted) {
                    console.error('Failed to load policies', error);
                    setPolicies([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadPolicies().catch((error) => {
            console.error('Unhandled error while loading policies', error);
        });

        return () => {
            isMounted = false;
        };
    }, []);

    const policyIndex = useMemo(() => policies.findIndex((item) => item.id === type), [policies, type]);
    const policy = useMemo(() => {
        return policyIndex >= 0 ? policies[policyIndex] : undefined;
    }, [policies, policyIndex]);

    if (loading) {
        return (
            <div className="text-center py-20" {...getVisualEditorAttributes(`translations.${language}.policy.loading`)}>
                {t('policy.loading')}
            </div>
        );
    }

    if (!policy) {
        return (
            <div className="text-center py-20" {...getVisualEditorAttributes(`translations.${language}.policy.notFound`)}>
                {t('policy.notFound')}
            </div>
        );
    }

    const title = translate(policy.title);
    const introContent = policy.content ? translate(policy.content) : null;
    const sections = (policy.sections ?? []).filter((section): section is PolicySection => Boolean(section));

    const policyFieldPath = policyIndex >= 0 ? `policies.items.${policyIndex}` : undefined;

    const metaTitle = policy.metaTitle ? (translate(policy.metaTitle) as string) : undefined;
    const metaDescription = policy.metaDescription ? (translate(policy.metaDescription) as string) : undefined;
    const toPlainText = (value: unknown): string | undefined => {
        if (typeof value === 'string') {
            return value;
        }

        if (Array.isArray(value)) {
            return value.filter((item): item is string => typeof item === 'string').join(' ');
        }

        return undefined;
    };
    const fallbackDescription = toPlainText(introContent);
    const helmetTitle = metaTitle || `${title} | Kapunka Skincare`;
    const helmetDescription = metaDescription || fallbackDescription;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12 sm:py-16" {...getVisualEditorAttributes(policyFieldPath)}>
            <Helmet>
                <title>{helmetTitle}</title>
                {helmetDescription && <meta name="description" content={helmetDescription} />}
            </Helmet>
            <header className="mb-12">
                <h1
                    className="text-4xl sm:text-5xl font-semibold tracking-tight"
                    {...getVisualEditorAttributes(policyFieldPath ? `${policyFieldPath}.title.${language}` : undefined)}
                >
                    {title}
                </h1>
            </header>
            <div className="prose prose-stone lg:prose-lg max-w-none text-stone-700 leading-relaxed space-y-8">
                {typeof introContent === 'string' && introContent.trim().length > 0 && (
                    <ReactMarkdown {...getVisualEditorAttributes(policyFieldPath ? `${policyFieldPath}.content.${language}` : undefined)}>
                        {introContent}
                    </ReactMarkdown>
                )}
                {sections.map((section, index) => {
                    const translatedHeading = translate(section.title) as string;
                    const translatedBody = translate(section.body) as string;
                    const sectionFieldPath = policyFieldPath ? `${policyFieldPath}.sections.${index}` : undefined;
                    const sectionKey = section.id
                        || translatedHeading
                        || translatedBody
                        || JSON.stringify(section.title)
                        || JSON.stringify(section.body)
                        || 'policy-section';
                    return (
                        <div key={sectionKey} className="space-y-3" {...getVisualEditorAttributes(sectionFieldPath)}>
                            <h2 className="text-2xl font-semibold text-stone-900" {...getVisualEditorAttributes(sectionFieldPath ? `${sectionFieldPath}.title.${language}` : undefined)}>
                                {translatedHeading}
                            </h2>
                            <ReactMarkdown className="leading-relaxed" {...getVisualEditorAttributes(sectionFieldPath ? `${sectionFieldPath}.body.${language}` : undefined)}>
                                {translatedBody}
                            </ReactMarkdown>
                        </div>
                    );
                })}
                <p {...getVisualEditorAttributes(`translations.${language}.policy.contactPrompt`)}>
                    {t('policy.contactPrompt')}
                </p>
                <p>
                    <Link to="/contact" className="text-stone-700 underline hover:text-stone-900">
                        <span {...getVisualEditorAttributes(`translations.${language}.footer.contact`)}>
                            {t('footer.contact')}
                        </span>
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default PolicyPage;
