const COOKIE_KEY = 'hfp_cookie_consent';

function hasCookieConsent() {
  try {
    return localStorage.getItem(COOKIE_KEY) === 'accepted';
  } catch (e) {
    return false;
  }
}
window.hasCookieConsent = hasCookieConsent;

function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;

  let stored;
  try {
    stored = localStorage.getItem(COOKIE_KEY);
  } catch (e) {
    stored = null;
  }

  if (!stored) {
    banner.hidden = false;
  }

  document.getElementById('cookie-accept').addEventListener('click', () => {
    try { localStorage.setItem(COOKIE_KEY, 'accepted'); } catch (e) {}
    banner.hidden = true;
    document.dispatchEvent(new CustomEvent('cookie-consent:accepted'));
  });

  document.getElementById('cookie-decline').addEventListener('click', () => {
    try { localStorage.setItem(COOKIE_KEY, 'declined'); } catch (e) {}
    banner.hidden = true;
  });
}
document.addEventListener('DOMContentLoaded', initCookieBanner);
