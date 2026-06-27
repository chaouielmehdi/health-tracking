(function () {
  var STYLES = [
    '.site-header{border-bottom:1px solid var(--panel-border,#2E3338);}',
    '.site-header-inner{display:flex;align-items:center;padding:14px 28px;}',
    '.site-name{font-family:var(--mono,"JetBrains Mono",monospace);font-size:12px;color:var(--text-dim2,#8B9096);letter-spacing:0.04em;}',
    '.site-footer{border-top:1px solid var(--panel-border,#2E3338);}',
    '.site-footer-inner{display:flex;flex-direction:column;align-items:flex-end;gap:4px;padding:22px 28px;}',
    '.site-footer-powered{font-size:11px;color:var(--text-dim2,#8B9096);}',
    '.site-footer-deploy{font-family:var(--mono,"JetBrains Mono",monospace);font-size:10px;color:var(--text-dim2,#8B9096);opacity:0.6;}',
    '@media(max-width:560px){.site-header-inner,.site-footer-inner{padding-left:18px;padding-right:18px;}}'
  ].join('');

  function injectStyles() {
    var s = document.createElement('style');
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  function injectHeader() {
    var el = document.createElement('header');
    el.className = 'site-header';
    el.innerHTML = '<div class="site-header-inner"><span class="site-name">Mehdi \xb7 Health &amp; Body Protocol</span></div>';
    document.body.insertBefore(el, document.body.firstChild);
  }

  function injectFooter() {
    var el = document.createElement('footer');
    el.className = 'site-footer';
    el.innerHTML = '<div class="site-footer-inner"><div class="site-footer-powered">Powered by Claude</div><div class="site-footer-deploy" id="site-footer-deploy"></div></div>';
    document.body.appendChild(el);

    fetch('data/deploy.json?v=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.deployedAt) return;
        var dt = new Date(new Date(d.deployedAt).getTime() + 3600000);
        var pad = function (n) { return String(n).padStart(2, '0'); };
        var label = 'deployed ' + dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate()) + ' ' + pad(dt.getUTCHours()) + ':' + pad(dt.getUTCMinutes()) + ' GMT+1';
        var deployEl = document.getElementById('site-footer-deploy');
        if (deployEl) deployEl.textContent = label;
      })
      .catch(function () {});
  }

  function init() {
    injectStyles();
    injectHeader();
    injectFooter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
