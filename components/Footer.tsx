import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Facebook, Instagram, Linkedin, Youtube, Globe } from 'lucide-react';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

const FooterLink: React.FC<{ to: string; children: React.ReactNode; fieldPath?: string; sbFieldPath?: string }> = ({ to, children, fieldPath, sbFieldPath }) => (
    <Link to={to} className="relative group text-stone-500 hover:text-stone-900 transition-colors duration-300">
        <span
          data-nlv-field-path={fieldPath ?? undefined}
          data-sb-field-path={sbFieldPath ?? undefined}
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
            <h3 className="text-lg font-semibold mb-4" data-nlv-field-path="site.brand.name">{brandName}</h3>
            <p className="text-sm text-stone-500" data-nlv-field-path={`translations.${language}.footer.tagline`}>
              {t('footer.tagline')}
            </p>
            <div className="mt-6">
                <h4
                  className="font-semibold mb-3 text-sm"
                  data-nlv-field-path={`translations.${language}.footer.followUs`}
                >
                  {t('footer.followUs')}
                </h4>
                {socialLinks.length > 0 && (
                    <div className="flex space-x-4" data-sb-field-path="footer.socialLinks">
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
                                    data-nlv-field-path={`site.footer.socialLinks.${index}`}
                                    data-sb-field-path={`footer.socialLinks.${index}`}
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
              data-nlv-field-path={`translations.${language}.footer.shop`}
            >
              {t('footer.shop')}
            </h4>
            <ul className="space-y-3 text-sm" data-sb-field-path="footer.navLinks">
              <li>
                <FooterLink
                  to="/shop"
                  fieldPath={`translations.${language}.footer.allProducts`}
                  sbFieldPath="footer.navLinks.0.label"
                >
                  {t('footer.allProducts')}
                </FooterLink>
              </li>
              <li>
                <FooterLink
                  to="/learn"
                  fieldPath={`translations.${language}.footer.guides`}
                  sbFieldPath="footer.navLinks.1.label"
                >
                  {t('footer.guides')}
                </FooterLink>
              </li>
            </ul>
          </div>
          <div>
            <h4
              className="font-semibold mb-4"
              data-nlv-field-path={`translations.${language}.footer.about`}
            >
              {t('footer.about')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <FooterLink
                  to="/about"
                  fieldPath={`translations.${language}.footer.ourStory`}
                  sbFieldPath="footer.navLinks.2.label"
                >
                  {t('footer.ourStory')}
                </FooterLink>
              </li>
              <li>
                <FooterLink
                  to="/contact"
                  fieldPath={`translations.${language}.footer.contact`}
                  sbFieldPath="footer.navLinks.3.label"
                >
                  {t('footer.contact')}
                </FooterLink>
              </li>
            </ul>
          </div>
          <div>
            <h4
              className="font-semibold mb-4"
              data-nlv-field-path={`translations.${language}.footer.policies`}
            >
              {t('footer.policies')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <FooterLink
                  to="/policy/shipping"
                  fieldPath={`translations.${language}.footer.shipping`}
                  sbFieldPath="footer.navLinks.4.label"
                >
                  {t('footer.shipping')}
                </FooterLink>
              </li>
              <li>
                <FooterLink
                  to="/policy/returns"
                  fieldPath={`translations.${language}.footer.returns`}
                  sbFieldPath="footer.navLinks.5.label"
                >
                  {t('footer.returns')}
                </FooterLink>
              </li>
              <li>
                <FooterLink
                  to="/policy/privacy"
                  fieldPath={`translations.${language}.footer.privacy`}
                  sbFieldPath="footer.navLinks.6.label"
                >
                  {t('footer.privacy')}
                </FooterLink>
              </li>
              <li>
                <FooterLink
                  to="/policy/terms"
                  fieldPath={`translations.${language}.footer.terms`}
                  sbFieldPath="footer.navLinks.7.label"
                >
                  {t('footer.terms')}
                </FooterLink>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-stone-200 text-center text-sm text-stone-400">
          <p data-nlv-field-path="site.footer.legalName">&copy; {new Date().getFullYear()} {legalName}. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
