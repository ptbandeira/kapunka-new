const ensurePreviewStyles = () => {
  if (typeof document === 'undefined') {
    return;
  }

  // Load base styles
  if (!document.querySelector('link[data-preview-styles="contact-training"]')) {
    const baseLink = document.createElement('link');
    baseLink.rel = 'stylesheet';
    baseLink.href = new URL('./preview-styles.css', import.meta.url).toString();
    baseLink.dataset.previewStyles = 'contact-training';
    document.head.appendChild(baseLink);
  }

  // Load MediaShowcase styles
  if (!document.querySelector('link[data-preview-styles="media-showcase"]')) {
    const mediaShowcaseLink = document.createElement('link');
    mediaShowcaseLink.rel = 'stylesheet';
    mediaShowcaseLink.href = new URL('./preview-modules/media-showcase.css', import.meta.url).toString();
    mediaShowcaseLink.dataset.previewStyles = 'media-showcase';
    document.head.appendChild(mediaShowcaseLink);
  }
};

export function registerPagePreviews(CMS, templates) {
  if (!CMS || !templates) {
    return;
  }

  ensurePreviewStyles();

  if (typeof CMS.registerPreviewStyle === 'function') {
    CMS.registerPreviewStyle('/styles/globals.css');
  }

  if (typeof CMS.registerPreviewTemplate !== 'function') {
    return;
  }

  const { ContactPreview, TrainingPreview, MediaShowcasePreview } = templates;

  // Register existing previews
  if (typeof ContactPreview === 'function') {
    CMS.registerPreviewTemplate('contact', ContactPreview);
    CMS.registerPreviewTemplate('pages/contact', ContactPreview);
  }

  if (typeof TrainingPreview === 'function') {
    CMS.registerPreviewTemplate('training', TrainingPreview);
    CMS.registerPreviewTemplate('pages/training', TrainingPreview);
  }

  // Register MediaShowcase preview
  if (typeof MediaShowcasePreview === 'function') {
    CMS.registerPreviewTemplate('mediaShowcase', MediaShowcasePreview);
    
    // Register for pages that may contain MediaShowcase sections
    const pagesWithMediaShowcase = [
      'pages/home',
      'pages/about',
      'pages/products',
      'pages/gallery'
    ];
    
    pagesWithMediaShowcase.forEach(path => {
      CMS.registerPreviewTemplate(path, MediaShowcasePreview);
    });
  }
}
