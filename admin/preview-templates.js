const ensurePreviewStyles = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.querySelector('link[data-preview-styles="contact-training"]')) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./preview-styles.css', import.meta.url).toString();
  link.dataset.previewStyles = 'contact-training';
  document.head.appendChild(link);
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

  const { ContactPreview, TrainingPreview } = templates;

  if (typeof ContactPreview === 'function') {
    CMS.registerPreviewTemplate('contact', ContactPreview);
    CMS.registerPreviewTemplate('pages/contact', ContactPreview);
  }

  if (typeof TrainingPreview === 'function') {
    CMS.registerPreviewTemplate('training', TrainingPreview);
    CMS.registerPreviewTemplate('pages/training', TrainingPreview);
  }
}
