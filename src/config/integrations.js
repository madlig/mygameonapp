/**
 * Centralized Integration Configuration
 * 
 * Single source of truth for external service endpoints and integration contracts
 * (MyGameON Hub, n8n automation engine, WhatsApp, Shopee).
 */

export const INTEGRATIONS = {
  // MyGameON Hub Backend
  // When running on Vercel or Vite Dev with proxy, default is relative '/api'
  hubApiUrl: import.meta.env.VITE_HUB_API_URL || '/api',

  // n8n Workflow Automation Webhooks
  n8n: {
    claimWebhookUrl: import.meta.env.VITE_N8N_CLAIM_WEBHOOK || import.meta.env.VITE_N8N_WEBHOOK_URL || '',
    telemetryWebhookUrl: import.meta.env.VITE_N8N_TELEMETRY_WEBHOOK || '',
  },

  // WhatsApp Customer Support
  whatsapp: {
    number: import.meta.env.VITE_WHATSAPP_NUMBER || '6285121309829',
  },

  // Marketplace & External Links
  shopeeStoreUrl: import.meta.env.VITE_SHOPEE_STORE_URL || 'https://shopee.co.id/mygameon',
};

/**
 * Builds a direct WhatsApp click-to-chat URL with prefilled message
 * @param {Object} options
 * @param {string} [options.phone] - Phone number without plus sign (defaults to config number)
 * @param {string} options.text - Message text to prefill
 * @returns {string} Fully qualified WhatsApp deep link
 */
export const buildWhatsAppUrl = ({ phone = INTEGRATIONS.whatsapp.number, text = '' } = {}) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(text.trim());
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};

/**
 * Check if n8n claim webhook is configured
 * @returns {boolean}
 */
export const isN8nClaimConfigured = () => {
  return Boolean(INTEGRATIONS.n8n.claimWebhookUrl && INTEGRATIONS.n8n.claimWebhookUrl.startsWith('http'));
};
