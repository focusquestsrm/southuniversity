(function () {
  'use strict';

  const pixelId = '';
  if (!window.fbq) {
    const fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window._fbq = fbq;
    window.fbq = fbq;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  if (pixelId && !window.__southMetaPageViewFired) {
    window.__southMetaPageViewFired = true;
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }

  window.SOUTH_META = {
    fireLead: function (eventId) {
      if (!pixelId || window.__southMetaLeadFired) return false;
      window.__southMetaLeadFired = true;
      window.fbq('track', 'Lead', {}, eventId ? { eventID: eventId } : undefined);
      return true;
    }
  };
})();
