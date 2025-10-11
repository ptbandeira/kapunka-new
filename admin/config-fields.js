export const VISUAL_FIELDS = {
  hero: {
    layout: {
      label: 'Hero Layout',
      widget: 'select',
      options: ['centered', 'left-aligned', 'media-right'],
      default: 'centered',
      preview: true,
    },
    spacing: {
      label: 'Vertical Spacing',
      widget: 'select',
      options: ['compact', 'normal', 'spacious'],
      default: 'normal',
      preview: true,
    },
    imageSize: {
      label: 'Media Size',
      widget: 'select',
      options: ['small', 'medium', 'large', 'full'],
      default: 'medium',
      preview: true,
    },
    textWidth: {
      label: 'Text Width',
      widget: 'select',
      options: ['narrow', 'medium', 'wide'],
      default: 'medium',
      preview: true
    }
  },
  sections: {
    columnLayout: {
      label: 'Column Layout',
      widget: 'select',
      options: ['1-column', '2-columns', '3-columns', 'asymmetric'],
      default: '1-column',
      preview: true,
    },
    spacing: {
      label: 'Section Spacing',
      widget: 'select',
      options: ['compact', 'normal', 'spacious'],
      default: 'normal',
      preview: true,
    },
    background: {
      label: 'Background Style',
      widget: 'select',
      options: ['none', 'light', 'dark', 'highlight'],
      default: 'none',
      preview: true
    }
  }
};

export const CONTENT_FIELDS = {
  hero: {
    headline: {
      label: 'Headline',
      widget: 'string',
      i18n: true,
      preview: true,
    },
    subheadline: {
      label: 'Supporting Text',
      widget: 'text',
      i18n: true,
      preview: true,
    },
    ctaPrimary: {
      label: 'Primary Button',
      widget: 'string',
      i18n: true,
      preview: true,
    },
    ctaSecondary: {
      label: 'Secondary Button',
      widget: 'string',
      i18n: true,
      preview: true,
    }
  },
  sections: {
    title: {
      label: 'Section Title',
      widget: 'string',
      i18n: true,
      preview: true,
    },
    content: {
      label: 'Section Content',
      widget: 'markdown',
      i18n: true,
      preview: true,
    }
  }
};

export const ADVANCED_FIELDS = {
  seo: {
    title: {
      label: 'SEO Title',
      widget: 'string',
      i18n: true,
    },
    description: {
      label: 'SEO Description',
      widget: 'text',
      i18n: true,
    },
    keywords: {
      label: 'Keywords',
      widget: 'list',
      i18n: true,
    }
  },
  geo: {
    region: {
      label: 'Target Region',
      widget: 'select',
      options: ['global', 'europe', 'americas', 'asia'],
    },
    restrictions: {
      label: 'Regional Restrictions',
      widget: 'list'
    }
  },
  metadata: {
    canonicalUrl: {
      label: 'Canonical URL',
      widget: 'string'
    },
    publishDate: {
      label: 'Publish Date',
      widget: 'datetime'
    }
  }
};
