import { createElement } from 'react';
import { VISUAL_FIELDS } from './config-fields';

const DEFAULT_SPACING = {
  compact: {
    hero: 'py-8',
    section: 'py-12 gap-8',
  },
  normal: {
    hero: 'py-16',
    section: 'py-20 gap-12',
  },
  spacious: {
    hero: 'py-24',
    section: 'py-32 gap-16',
  }
};

const DEFAULT_WIDTHS = {
  narrow: 'max-w-2xl',
  medium: 'max-w-4xl',
  wide: 'max-w-6xl'
};

const DEFAULT_LAYOUTS = {
  hero: {
    centered: 'text-center mx-auto',
    'left-aligned': 'text-left',
    'media-right': 'grid grid-cols-2 gap-8 items-center'
  },
  sections: {
    '1-column': 'max-w-3xl mx-auto',
    '2-columns': 'grid grid-cols-2 gap-8',
    '3-columns': 'grid grid-cols-3 gap-8',
    'asymmetric': 'grid grid-cols-3 gap-8 [&>*:first-child]:col-span-2'
  }
};

export function LivePreview({ data, activeLocale }) {
  const visualSettings = data.visualSettings || {};
  const content = data.content?.[activeLocale] || {};
  
  // Hero section classes based on visual settings
  const heroSpacing = DEFAULT_SPACING[visualSettings.hero?.spacing || 'normal'].hero;
  const heroLayout = DEFAULT_LAYOUTS.hero[visualSettings.hero?.layout || 'centered'];
  const heroWidth = DEFAULT_WIDTHS[visualSettings.hero?.textWidth || 'medium'];
  
  const heroClasses = ['relative', heroSpacing, heroLayout, heroWidth].join(' ');

  return createElement('div', { className: 'cms-preview-root' },
    // Hero Section
    createElement('section', { className: heroClasses },
      createElement('div', { className: 'space-y-6' },
        content.headline && createElement('h1', { 
          className: 'text-4xl sm:text-5xl font-semibold tracking-tight' 
        }, content.headline),
        content.subheadline && createElement('p', { 
          className: 'text-lg text-stone-600' 
        }, content.subheadline),
        createElement('div', { className: 'flex items-center gap-4 flex-wrap' },
          content.ctaPrimary && createElement('button', {
            className: 'btn-primary'
          }, content.ctaPrimary),
          content.ctaSecondary && createElement('button', {
            className: 'btn-secondary'
          }, content.ctaSecondary)
        )
      )
    ),

    // Content Sections
    (content.sections || []).map((section, idx) => {
      const sectionSpacing = DEFAULT_SPACING[visualSettings.sections?.[idx]?.spacing || 'normal'].section;
      const sectionLayout = DEFAULT_LAYOUTS.sections[visualSettings.sections?.[idx]?.columnLayout || '1-column'];
      const sectionBg = visualSettings.sections?.[idx]?.background || 'none';
      
      const bgClass = 
        sectionBg === 'light' ? 'bg-stone-50' :
        sectionBg === 'dark' ? 'bg-stone-900 text-white' :
        sectionBg === 'highlight' ? 'bg-amber-50' :
        '';
      
      const sectionClasses = [sectionSpacing, sectionLayout, bgClass].filter(Boolean).join(' ');

      return createElement('section', { 
        key: 'section-' + idx,
        className: sectionClasses
      },
        section.title && createElement('h2', {
          className: 'text-2xl font-semibold mb-6'
        }, section.title),
        section.content && createElement('div', {
          className: 'prose prose-stone'
        }, section.content)
      );
    })
  );
}

// Visual Settings Editor Component
export function VisualSettingsPanel({ value, onChange }) {
  return createElement('div', { className: 'visual-settings-panel' },
    Object.entries(VISUAL_FIELDS).map(([section, fields]) =>
      createElement('div', { 
        key: section,
        className: 'space-y-4 p-4 border-b' 
      },
        createElement('h3', { 
          className: 'font-semibold text-lg capitalize' 
        }, section),
        Object.entries(fields).map(([fieldName, field]) =>
          createElement('div', { 
            key: fieldName,
            className: 'form-control' 
          },
            createElement('label', { 
              className: 'text-sm font-medium' 
            }, field.label),
            createElement('select', {
              value: value?.[section]?.[fieldName] || field.default,
              onChange: (e) => {
                const newValue = {
                  ...value,
                  [section]: {
                    ...(value?.[section] || {}),
                    [fieldName]: e.target.value
                  }
                };
                onChange(newValue);
              },
              className: 'form-select mt-1'
            },
              field.options.map(option =>
                createElement('option', {
                  key: option,
                  value: option
                }, option)
              )
            )
          )
        )
      )
    )
  );
}
