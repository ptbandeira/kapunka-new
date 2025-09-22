import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Facebook, Instagram } from 'lucide-react';

const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <Link to={to} className="relative group text-stone-500 hover:text-stone-900 transition-colors duration-300">
        <span>{children}</span>
        <span className="absolute bottom-0 left-0 block h-[1px] w-full bg-stone-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out origin-left"></span>
    </Link>
);

const Footer: React.FC = () => {
    const { t } = useLanguage();
  return (
    <footer className="bg-stone-100 border-t border-stone-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">KAPUNKA</h3>
            <p className="text-sm text-stone-500">{t('footer.tagline')}</p>
            <div className="mt-6">
                <h4 className="font-semibold mb-3 text-sm">{t('footer.followUs')}</h4>
                <div className="flex space-x-4">
                    <a href="https://facebook.com/kapunka" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-stone-500 hover:text-stone-900 transition-colors">
                        <Facebook size={20} />
                    </a>
                    <a href="https://instagram.com/kapunka" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-stone-500 hover:text-stone-900 transition-colors">
                        <Instagram size={20} />
                    </a>
                </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.shop')}</h4>
            <ul className="space-y-3 text-sm">
              <li><FooterLink to="/shop">{t('footer.allProducts')}</FooterLink></li>
              <li><FooterLink to="/learn">{t('footer.guides')}</FooterLink></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.about')}</h4>
            <ul className="space-y-3 text-sm">
              <li><FooterLink to="/about">{t('footer.ourStory')}</FooterLink></li>
              <li><FooterLink to="/contact">{t('footer.contact')}</FooterLink></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.policies')}</h4>
            <ul className="space-y-3 text-sm">
              <li><FooterLink to="/policy/shipping">{t('footer.shipping')}</FooterLink></li>
              <li><FooterLink to="/policy/returns">{t('footer.returns')}</FooterLink></li>
              <li><FooterLink to="/policy/privacy">{t('footer.privacy')}</FooterLink></li>
              <li><FooterLink to="/policy/terms">{t('footer.terms')}</FooterLink></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-stone-200 text-center text-sm text-stone-400">
          <p>&copy; {new Date().getFullYear()} Kapunka Skincare. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;