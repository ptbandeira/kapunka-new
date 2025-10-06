import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Facebook, Instagram, Linkedin, Youtube, Globe } from 'lucide-react';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getStackbitAttributes, getStackbitObjectId, getVisualEditorAttributes } from '../utils/stackbitBindings';
import { buildLocalizedPath } from '../utils/localePaths';

const FooterLink: React.FC<{
  to: string;
  children: React.ReactNode;
  fieldPath?: string;
}> = ({ to, children, fieldPath }) => (
  <Link
    to={to}
    className="relative group text-stone-500 hover:text-stone-900 transition-colors duration-300"
  >
    <span {...getVisualEditorAttributes(fieldPath ?? undefined)}>{children}</span>
    <span className="absolute bottom-0 left-0 block h-[1px] w-full bg-stone-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left" />
  </Link>
);

type FooterLinkConfig = {
  path: string;
  labelKey: `footer.${string}`;
};

type FooterSectionConfig = {
  key: `footer.${string}`;
  links: FooterLinkConfig[];
};

const FOOTER_SECTIONS: FooterSectionConfig[] = [
  {
    key: 'footer.shop',
    links: [
      { path: '/shop', labelKey: 'footer.allProducts' },
      { path: '/learn', labelKey: 'footer.guides' },
    ],
  },
  {
    key: 'footer.about',
    links: [
      { path: '/story', labelKey: 'footer.ourStory' },
      { path: '/contact', labelKey: 'footer.contact' },
    ],
  },
  {
    key: 'footer.policies',
    links: [
      { path: '/policy/shipping', labelKey: 'footer.shipping' },
      { path: '/policy/returns', labelKey: 'footer.returns' },
      { path: '/policy/privacy', labelKey: 'footer.privacy' },
      { path: '/policy/terms', labelKey: 'footer.terms' },
    ],
  },
];

const Footer: React.FC = () => {
  const { t, language, translate } = useLanguage();
  const { settings } = useSiteSettings();
  const socialLinks = settings.footer?.socialLinks ?? [];
  const legalName = translate(settings.footer?.legalName ?? 'Kapunka Skincare');
  const brandName = translate(settings.brand?.name ?? 'KAPUNKA');
  const footerTranslationsObjectId = getStackbitObjectId('translations.en.footer.tagline');
  const socialLinksAttributes = getStackbitAttributes('site.footer.socialLinks');

  const socialIconMap: Record<string, React.ComponentType<{ size?: number }>> = {
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
    globe: Globe,
  };

  const translationFieldPath = (key: `footer.${string}`) => `translations.${language}.${key}`;
  return (
    <footer className="bg-stone-100 border-t border-stone-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4" {...getVisualEditorAttributes('site.brand.name')}>
              {brandName}
            </h3>
            <p
              className="text-sm text-stone-500"
              {...getVisualEditorAttributes(`translations.${language}.footer.tagline`)}
              data-sb-object-id={footerTranslationsObjectId}
            >
              {t('footer.tagline')}
            </p>
            <div className="mt-6">
              <h4
                className="font-semibold mb-3 text-sm"
                {...getVisualEditorAttributes(`translations.${language}.footer.followUs`)}
                data-sb-object-id={footerTranslationsObjectId}
              >
                {t('footer.followUs')}
              </h4>
              {socialLinks.length > 0 && (
                <div className="flex space-x-4" {...socialLinksAttributes}>
                  {socialLinks.map((link, index) => {
                    const iconKey = link.icon ? link.icon.toLowerCase() : '';
                    const Icon = socialIconMap[iconKey] ?? Globe;
                    const label = translate(link.label ?? link.id);
                    return (
                      <a
                        key={link.id}
                        href={link.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="text-stone-500 hover:text-stone-900 transition-colors"
                        {...getVisualEditorAttributes(`site.footer.socialLinks.${index}`)}
                      >
                        <Icon size={20} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.key}>
                <h4
                  className="font-semibold mb-4"
                  {...getVisualEditorAttributes(translationFieldPath(section.key))}
                  data-sb-object-id={footerTranslationsObjectId}
                >
                  {t(section.key)}
                </h4>
                <ul className="space-y-3 text-sm">
                  {section.links.map((link) => (
                    <li key={link.labelKey}>
                      <FooterLink
                        to={buildLocalizedPath(link.path, language)}
                        fieldPath={translationFieldPath(link.labelKey)}
                      >
                        {t(link.labelKey)}
                      </FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-stone-200 text-center text-sm text-stone-400">
          <p {...getVisualEditorAttributes('site.footer.legalName')}>
            &copy; {new Date().getFullYear()} {legalName}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
