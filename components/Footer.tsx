import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Facebook, Instagram, Linkedin, Youtube, Globe } from 'lucide-react';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getVisualEditorAttributes } from '../utils/stackbitBindings';

const FooterLink: React.FC<{
    to: string;
    children: React.ReactNode;
    fieldPath?: string;
    sbFieldPath?: string;
    sbObjectId?: string;
}> = ({ to, children, fieldPath, sbFieldPath, sbObjectId }) => (
    <Link
        to={to}
        className="relative group text-stone-500 hover:text-stone-900 transition-colors duration-300"
        data-sb-field-path={sbFieldPath ?? undefined}
        data-sb-object-id={sbObjectId}
    >
        <span
          {...getVisualEditorAttributes(fieldPath ?? undefined)}
        >
          {children}
        </span>
        <span className="absolute bottom-0 left-0 block h-[1px] w-full bg-stone-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left"></span>
    </Link>
);

const Footer: React.FC = () => {
    const { t, language } = useLanguage();
    const { settings } = useSiteSettings();
    const socialLinks = settings.footer?.socialLinks ?? [];
    const legalName = settings.footer?.legalName ?? 'Kapunka Skincare';
    const brandName = settings.brand?.name ?? 'KAPUNKA';
    const footerTranslationsObjectId = 'translations_footer:content/translations/footer.json';
    const siteConfigObjectId = 'SiteConfig:content/site.json';

    const socialIconMap: Record<string, React.ComponentType<{ size?: number }>> = {
        facebook: Facebook,
        instagram: Instagram,
        linkedin: Linkedin,
        youtube: Youtube,
        globe: Globe,
    };
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
              data-sb-field-path={`${language}.tagline`}
            >
              {t('footer.tagline')}
            </p>
            <div className="mt-6">
                <h4
                  className="font-semibold mb-3 text-sm"
                  {...getVisualEditorAttributes(`translations.${language}.footer.followUs`)}
                  data-sb-object-id={footerTranslationsObjectId}
                  data-sb-field-path={`${language}.followUs`}
                >
                  {t('footer.followUs')}
                </h4>
                {socialLinks.length > 0 && (
                    <div
                        className="flex space-x-4"
                        data-sb-object-id={siteConfigObjectId}
                        data-sb-field-path="footer.socialLinks"
                    >
                        {socialLinks.map((link, index) => {
                            const iconKey = link.icon ? link.icon.toLowerCase() : '';
                            const Icon = socialIconMap[iconKey] ?? Globe;
                            return (
                                <a
                                    key={link.id}
                                    href={link.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={link.label}
                                    className="text-stone-500 hover:text-stone-900 transition-colors"
                                    {...getVisualEditorAttributes(`site.footer.socialLinks.${index}`)}
                                    data-sb-field-path={`footer.socialLinks.${index}`}
                                    data-sb-object-id={siteConfigObjectId}
                                >
                                    <Icon size={20} />
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>
          </div>
          <div>
            <h4
              className="font-semibold mb-4"
              {...getVisualEditorAttributes(`translations.${language}.footer.shop`)}
              data-sb-object-id={footerTranslationsObjectId}
              data-sb-field-path={`${language}.shop`}
            >
              {t('footer.shop')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <FooterLink
                  to="/shop"
                  fieldPath={`translations.${language}.footer.allProducts`}
                  sbFieldPath={`${language}.allProducts`}
                  sbObjectId={footerTranslationsObjectId}
                >
                  {t('footer.allProducts')}
                </FooterLink>
              </li>
              <li>
                <FooterLink
                  to="/learn"
                  fieldPath={`translations.${language}.footer.guides`}
                  sbFieldPath={`${language}.guides`}
                  sbObjectId={footerTranslationsObjectId}
                >
                  {t('footer.guides')}
                </FooterLink>
              </li>
            </ul>
          </div>
          <div>
            <h4
              className="font-semibold mb-4"
              {...getVisualEditorAttributes(`translations.${language}.footer.about`)}
              data-sb-object-id={footerTranslationsObjectId}
              data-sb-field-path={`${language}.about`}
            >
              {t('footer.about')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <FooterLink
                  to="/about"
                  fieldPath={`translations.${language}.footer.ourStory`}
                  sbFieldPath={`${language}.ourStory`}
                  sbObjectId={footerTranslationsObjectId}
                >
                  {t('footer.ourStory')}
                </FooterLink>
              </li>
              <li>
                <FooterLink
                  to="/contact"
                  fieldPath={`translations.${language}.footer.contact`}
                  sbFieldPath={`${language}.contact`}
                  sbObjectId={footerTranslationsObjectId}
                >
                  {t('footer.contact')}
                </FooterLink>
              </li>
            </ul>
          </div>
          <div>
            <h4
              className="font-semibold mb-4"
              {...getVisualEditorAttributes(`translations.${language}.footer.policies`)}
              data-sb-object-id={footerTranslationsObjectId}
              data-sb-field-path={`${language}.policies`}
            >
              {t('footer.policies')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <FooterLink
                  to="/policy/shipping"
                  fieldPath={`translations.${language}.footer.shipping`}
                  sbFieldPath={`${language}.shipping`}
                  sbObjectId={footerTranslationsObjectId}
                >
                  {t('footer.shipping')}
                </FooterLink>
              </li>
              <li>
                <FooterLink
                  to="/policy/returns"
                  fieldPath={`translations.${language}.footer.returns`}
                  sbFieldPath={`${language}.returns`}
                  sbObjectId={footerTranslationsObjectId}
                >
                  {t('footer.returns')}
                </FooterLink>
              </li>
              <li>
                <FooterLink
                  to="/policy/privacy"
                  fieldPath={`translations.${language}.footer.privacy`}
                  sbFieldPath={`${language}.privacy`}
                  sbObjectId={footerTranslationsObjectId}
                >
                  {t('footer.privacy')}
                </FooterLink>
              </li>
              <li>
                <FooterLink
                  to="/policy/terms"
                  fieldPath={`translations.${language}.footer.terms`}
                  sbFieldPath={`${language}.terms`}
                  sbObjectId={footerTranslationsObjectId}
                >
                  {t('footer.terms')}
                </FooterLink>
              </li>
            </ul>
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
