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

    const { 
    HomePreview,
    ContactPreview, 
    MethodPreview,
    ProductPreview,
    PagePreview 
  } = templates;

  // Register home preview
  if (typeof HomePreview === 'function') {
    CMS.registerPreviewTemplate('home', HomePreview);
    CMS.registerPreviewTemplate('pages/home', HomePreview);
  }

  // Register contact preview  
  if (typeof ContactPreview === 'function') {
    CMS.registerPreviewTemplate('contact', ContactPreview);
    CMS.registerPreviewTemplate('pages/contact', ContactPreview);
  }

  // Register method preview
  if (typeof MethodPreview === 'function') {
    CMS.registerPreviewTemplate('method', MethodPreview);
    CMS.registerPreviewTemplate('pages/method', MethodPreview);
  }

  // Register product preview
  if (typeof ProductPreview === 'function') {
    CMS.registerPreviewTemplate('product', ProductPreview);
    CMS.registerPreviewTemplate('pages/product', ProductPreview);
    CMS.registerPreviewTemplate('products', ProductPreview);
  }

  // Register generic page preview
  if (typeof PagePreview === 'function') {
    [
      'pages/about',
      'pages/mission',
      'pages/gallery',
      'pages/testimonials',
      'pages/blog'
    ].forEach(path => {
      CMS.registerPreviewTemplate(path, PagePreview);
    });
  }
}
