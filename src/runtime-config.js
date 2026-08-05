// Runtime-only configuration. Never commit real bearer tokens here.
window.MAXI_RUNTIME_CONFIG = Object.freeze({
  garamApiBaseUrl: '',
  garamApiBearerToken: sessionStorage.getItem('maxi.garam.apiBearerToken') || ''
});
