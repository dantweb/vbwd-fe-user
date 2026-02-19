(function() {
  'use strict';

  // Find our script tag to read data attributes
  var scripts = document.querySelectorAll('script[data-origin]');
  var scriptTag = scripts[scripts.length - 1];

  if (!scriptTag) {
    console.error('[VBWD] Widget script must have a data-origin attribute');
    return;
  }

  var origin = scriptTag.getAttribute('data-origin') || '';
  var locale = scriptTag.getAttribute('data-locale') || 'en';
  var theme = scriptTag.getAttribute('data-theme') || 'light';
  var containerId = scriptTag.getAttribute('data-container') || 'vbwd-iframe';
  var height = scriptTag.getAttribute('data-height') || '600';

  // Sanitize origin — must be a valid URL
  try {
    new URL(origin);
  } catch (e) {
    console.error('[VBWD] Invalid data-origin URL:', origin);
    return;
  }

  // Find container
  var container = document.getElementById(containerId);
  if (!container) {
    console.error('[VBWD] Container element #' + containerId + ' not found');
    return;
  }

  // Build iframe URL
  var iframeSrc = origin + '/embed/landing1?locale=' +
    encodeURIComponent(locale) + '&theme=' + encodeURIComponent(theme);

  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.src = iframeSrc;
  iframe.style.width = '100%';
  iframe.style.height = height + 'px';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.setAttribute('title', 'VBWD Plans');
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');

  container.appendChild(iframe);

  // Listen for postMessage from iframe
  window.addEventListener('message', function(event) {
    // Validate origin — only accept messages from our VBWD instance
    if (event.origin !== origin) {
      return;
    }

    var data = event.data;
    if (!data || typeof data !== 'object' || !data.type) {
      return;
    }

    if (data.type === 'vbwd:plan-selected') {
      // Dispatch custom event on container for host page to handle
      var customEvent = new CustomEvent('vbwd:plan-selected', {
        detail: data.payload,
        bubbles: true
      });
      container.dispatchEvent(customEvent);
    }

    if (data.type === 'vbwd:resize') {
      // Auto-resize iframe to content height
      iframe.style.height = data.payload.height + 'px';
    }
  });
})();
