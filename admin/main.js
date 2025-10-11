import { userFriendlySections } from './config-modules/user-friendly-sections';
import { EnhancedPreview } from './preview-components.js';

// Initialize enhanced CMS configuration
window.addEventListener('load', () => {
  // Wait for CMS to be available
  if (!window.CMS) {
    window.setTimeout(() => window.location.reload(), 50);
    return;
  }

  const { CMS } = window;

  // Register preview styles
  CMS.registerPreviewStyle('/admin/preview-styles.css');
  CMS.registerPreviewStyle('/admin/preview-modules/media-showcase.css');

  // Register enhanced previews
  CMS.registerPreviewTemplate('mediaShowcase', EnhancedPreview.MediaShowcasePreview);

  // Register enhanced config
  if (userFriendlySections.mediaShowcase) {
    CMS.registerWidget('mediaShowcaseWidget', userFriendlySections.mediaShowcase);
  }

  // Initialize with user-friendly UI settings
  CMS.init({
    config: {
      load_config_file: true,
      display: {
        iframeContent: true,
        iframeHeight: '100vh',
        iframeWidth: '100%'
      },
      editor: {
        preview: true,
        frame: true
      }
    }
  });
});
