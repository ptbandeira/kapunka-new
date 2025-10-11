// Netlify CMS Configuration
import config from './config.yml';
import './cms.js';

// Initialize the CMS
if (window.CMS) {
  window.CMS.init({ config });
}
