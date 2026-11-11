/* Navigation and product emphasis for the three design pages. */
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.gnb');
  if (toggle && nav) {
    // main.js owns the open class; mirror it for assistive technology.
    toggle.addEventListener('click', function () {
      var open = nav.classList.contains('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', '메뉴 열기');
        toggle.focus();
      }
    });
  }
  document.querySelectorAll('[data-product]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-product]').forEach(function (item) {
        item.setAttribute('aria-pressed', String(item === button));
      });
      document.querySelectorAll('[data-tile]').forEach(function (tile) {
        var selected = tile.dataset.tile === button.dataset.product;
        tile.classList.toggle('is-selected', selected);
        var link = tile.querySelector('.btn');
        link.classList.toggle('btn-primary', selected);
        link.classList.toggle('btn-outline', !selected);
      });
    });
  });

  var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  var revealTargets = document.querySelectorAll(
    '.center-heading, .why-intro, .value-copy, .value-row > img, ' +
    '.product-collection .line-label, .product-collection h2, .product-tile, ' +
    '.indication-heading, .indication-list > a, .feature-trio > li, ' +
    '.design-specs > div, .guidance-grid > *, .process-grid > li, ' +
    '.prp-reasons > article, .design-contact > *'
  );
  var observer;
  if (!motionPreference.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -25px 0px' });
    revealTargets.forEach(function (target) {
      target.classList.add('motion-reveal');
      var siblings = Array.prototype.slice.call(target.parentElement.children);
      target.style.setProperty('--reveal-delay', Math.min(siblings.indexOf(target), 3) * 75 + 'ms');
      observer.observe(target);
    });
  }
  function revealFocusedContent(event) {
    var target = event.target.closest('.motion-reveal');
    if (target) target.classList.add('is-visible');
  }
  document.addEventListener('focusin', revealFocusedContent);

  // Only the artwork in view animates; pause it in background tabs.
  var floatingArt = document.querySelectorAll('.value-row > img, .prp-reasons > article > img');
  var artObserver;
  if ('IntersectionObserver' in window) {
    artObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('art-in-view', entry.isIntersecting);
      });
    });
    floatingArt.forEach(function (art) { art.classList.add('floating-art'); artObserver.observe(art); });
  }
  document.addEventListener('visibilitychange', function () {
    document.body.classList.toggle('motion-paused', document.hidden);
  });
  motionPreference.addEventListener('change', function (event) {
    if (event.matches && observer) {
      observer.disconnect();
      revealTargets.forEach(function (target) { target.classList.add('is-visible'); });
    }
  });
});
