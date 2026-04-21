/* Lumisca Theme JS - v1.0.0 */
'use strict';

(function () {

  /* ─── Utility helpers ─── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var d = new Date();
      d.setTime(d.getTime() + days * 864e5);
      expires = '; expires=' + d.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
  }
  function formatMoney(cents) {
    return '£' + (cents / 100).toFixed(2);
  }
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  /* ─── Announcement bar rotation ─── */
  function initAnnouncementBar() {
    var bar = $('#announcement-bar-text');
    if (!bar) return;
    var messages = [
      '🔴 Free UK Delivery On All Orders | 60-Day Money Back Guarantee',
      '⚡ Over 10,000 Happy UK Customers | Clinically Studied Technology',
      '🎁 Buy The Bundle & Save £174.98 | Limited Stock Available'
    ];
    var idx = 0;
    setInterval(function () {
      bar.style.opacity = '0';
      setTimeout(function () {
        idx = (idx + 1) % messages.length;
        bar.textContent = messages[idx];
        bar.style.opacity = '1';
      }, 400);
    }, 3000);
  }

  /* ─── Sticky header on scroll ─── */
  function initStickyHeader() {
    var header = $('#site-header');
    if (!header) return;
    var lastScroll = 0;
    window.addEventListener('scroll', function () {
      var current = window.scrollY;
      if (current > 80) {
        header.classList.add('header--sticky');
      } else {
        header.classList.remove('header--sticky');
      }
      if (current > lastScroll && current > 200) {
        header.classList.add('header--hidden');
      } else {
        header.classList.remove('header--hidden');
      }
      lastScroll = current <= 0 ? 0 : current;
    }, { passive: true });
  }

  /* ─── Mobile hamburger menu ─── */
  function initMobileMenu() {
    var btn = $('#mobile-menu-btn');
    var drawer = $('#mobile-nav-drawer');
    var overlay = $('#mobile-nav-overlay');
    var close = $('#mobile-menu-close');
    if (!btn || !drawer) return;

    function openMenu() {
      drawer.classList.add('is-open');
      if (overlay) overlay.classList.add('is-visible');
      document.body.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      drawer.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-visible');
      document.body.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', openMenu);
    if (close) close.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    // mobile accordion sub-menus
    $$('.mobile-nav__item--has-children > a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var parent = link.closest('.mobile-nav__item--has-children');
        parent.classList.toggle('is-open');
      });
    });
  }

  /* ─── Mega menu hover ─── */
  function initMegaMenu() {
    $$('.nav__item--has-dropdown').forEach(function (item) {
      var timer;
      item.addEventListener('mouseenter', function () {
        clearTimeout(timer);
        item.classList.add('is-open');
      });
      item.addEventListener('mouseleave', function () {
        timer = setTimeout(function () { item.classList.remove('is-open'); }, 150);
      });
    });
  }

  /* ─── Cart drawer ─── */
  function initCartDrawer() {
    var drawer = $('#cart-drawer');
    var overlay = $('#cart-overlay');
    var openBtns = $$('[data-cart-open]');
    var closeBtn = $('#cart-drawer-close');

    function openCart() {
      if (!drawer) return;
      drawer.classList.add('is-open');
      if (overlay) { overlay.classList.add('is-visible'); overlay.removeAttribute('aria-hidden'); }
      document.body.classList.add('cart-open');
      drawer.setAttribute('aria-hidden', 'false');
      refreshCartDrawer();
    }
    function closeCart() {
      if (!drawer) return;
      drawer.classList.remove('is-open');
      if (overlay) { overlay.classList.remove('is-visible'); overlay.setAttribute('aria-hidden', 'true'); }
      document.body.classList.remove('cart-open');
      drawer.setAttribute('aria-hidden', 'true');
    }

    openBtns.forEach(function (btn) { btn.addEventListener('click', openCart); });
    if (closeBtn) closeBtn.addEventListener('click', closeCart);
    if (overlay) overlay.addEventListener('click', closeCart);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeCart();
    });

    window.LumiscaCart = { open: openCart, close: closeCart };
  }

  function refreshCartDrawer() {
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        updateShippingBar(cart.total_price);
        var body = $('#cart-drawer-items');
        if (!body) return;
        if (cart.items.length === 0) {
          body.innerHTML = '<p class="cart-empty">Your cart is empty. <a href="/collections/all">Continue shopping</a></p>';
          return;
        }
        body.innerHTML = cart.items.map(function (item) {
          return '<div class="cart-item" data-key="' + item.key + '">' +
            '<img src="' + item.image + '" alt="' + item.title + '" width="80" height="80" loading="lazy">' +
            '<div class="cart-item__info">' +
              '<p class="cart-item__title">' + item.product_title + '</p>' +
              '<p class="cart-item__price">' + formatMoney(item.final_line_price) + '</p>' +
              '<div class="cart-item__qty">' +
                '<button class="qty-btn" data-action="decrease" data-key="' + item.key + '" aria-label="Decrease quantity">−</button>' +
                '<span class="qty-val">' + item.quantity + '</span>' +
                '<button class="qty-btn" data-action="increase" data-key="' + item.key + '" aria-label="Increase quantity">+</button>' +
              '</div>' +
            '</div>' +
            '<button class="cart-item__remove" data-key="' + item.key + '" aria-label="Remove item">✕</button>' +
          '</div>';
        }).join('');

        var subtotal = $('#cart-subtotal');
        if (subtotal) subtotal.textContent = formatMoney(cart.total_price);

        bindCartItemEvents();
      });
  }

  function bindCartItemEvents() {
    $$('.qty-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.dataset.key;
        var action = btn.dataset.action;
        var qtyEl = btn.closest('.cart-item__qty').querySelector('.qty-val');
        var current = parseInt(qtyEl.textContent, 10);
        var newQty = action === 'increase' ? current + 1 : Math.max(0, current - 1);
        cartChange(key, newQty);
      });
    });
    $$('.cart-item__remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        cartChange(btn.dataset.key, 0);
      });
    });
  }

  function cartChange(key, qty) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    })
    .then(function (r) { return r.json(); })
    .then(function (cart) {
      updateCartCount(cart.item_count);
      updateShippingBar(cart.total_price);
      refreshCartDrawer();
    });
  }

  function updateCartCount(count) {
    $$('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    window.Lumisca.cartCount = count;
  }

  /* ─── Add to cart ─── */
  function initAddToCart() {
    document.addEventListener('submit', function (e) {
      var form = e.target.closest('[data-atc-form]');
      if (!form) return;
      e.preventDefault();
      var btn = form.querySelector('[data-atc-btn]') || form.querySelector('[type="submit"]');
      if (btn) { btn.textContent = 'Adding…'; btn.disabled = true; }

      var formData = new FormData(form);
      fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      })
      .then(function (r) { return r.json(); })
      .then(function (item) {
        if (btn) { btn.textContent = 'Added!'; }
        updateCartCount((window.Lumisca.cartCount || 0) + (item.quantity || 1));
        updateShippingBar();
        if (window.LumiscaCart) window.LumiscaCart.open();
        setTimeout(function () {
          if (btn) { btn.textContent = 'Add To Cart'; btn.disabled = false; }
        }, 2000);
      })
      .catch(function () {
        if (btn) { btn.textContent = 'Add To Cart'; btn.disabled = false; }
      });
    });
  }

  /* ─── Free shipping progress bar ─── */
  function updateShippingBar(cartTotalCents) {
    var bar = $('#shipping-progress-fill');
    var msg = $('#shipping-progress-msg');
    if (!bar) return;
    var threshold = (window.Lumisca.freeShippingThreshold || 5000);
    var total = cartTotalCents !== undefined ? cartTotalCents : (window.Lumisca.cartTotal || 0);
    var pct = Math.min(100, Math.round((total / threshold) * 100));
    bar.style.width = pct + '%';
    if (msg) {
      if (pct >= 100) {
        msg.textContent = '🎉 You\'ve unlocked free UK delivery!';
      } else {
        var remaining = formatMoney(threshold - total);
        msg.textContent = 'Spend ' + remaining + ' more for free UK delivery';
      }
    }
    window.Lumisca.cartTotal = total;
  }

  /* ─── Sticky ATC bar ─── */
  function initStickyATC() {
    var stickyBar = $('#sticky-atc');
    var mainBtn = $('#main-atc-btn');
    if (!stickyBar || !mainBtn) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          stickyBar.classList.add('is-visible');
        } else {
          stickyBar.classList.remove('is-visible');
        }
      });
    }, { threshold: 0 });
    observer.observe(mainBtn);
  }

  /* ─── Back to top ─── */
  function initBackToTop() {
    var btn = $('#back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ─── FAQ accordion ─── */
  function initAccordion() {
    $$('.faq__question').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq__item');
        var isOpen = item.classList.contains('is-open');
        $$('.faq__item.is-open').forEach(function (openItem) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.faq__answer').style.maxHeight = '0';
          openItem.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('is-open');
          var answer = item.querySelector('.faq__answer');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ─── Product tabs ─── */
  function initProductTabs() {
    $$('.tabs__nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabId = btn.dataset.tab;
        var container = btn.closest('.tabs');
        $$('.tabs__nav-btn', container).forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        $$('.tabs__panel', container).forEach(function (p) { p.classList.remove('is-active'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        var panel = container.querySelector('[data-tab-panel="' + tabId + '"]');
        if (panel) panel.classList.add('is-active');
      });
    });
  }

  /* ─── Product image gallery ─── */
  function initProductGallery() {
    var mainImg = $('#product-main-image');
    var thumbs = $$('.product-thumb');
    if (!mainImg || !thumbs.length) return;

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var src = thumb.dataset.src || thumb.querySelector('img').src;
        var srcset = thumb.dataset.srcset || '';
        thumbs.forEach(function (t) { t.classList.remove('is-active'); });
        thumb.classList.add('is-active');
        mainImg.src = src;
        if (srcset) mainImg.srcset = srcset;
      });
    });

    // swipe support on mobile
    var startX = 0;
    var gallery = $('#product-gallery');
    if (!gallery) return;
    gallery.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    gallery.addEventListener('touchend', function (e) {
      var diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) < 50) return;
      var activeThumb = $('.product-thumb.is-active') || thumbs[0];
      var idx = thumbs.indexOf(activeThumb);
      var nextIdx = diff > 0 ? Math.min(idx + 1, thumbs.length - 1) : Math.max(idx - 1, 0);
      thumbs[nextIdx].click();
    });
  }

  /* ─── Before/after slider ─── */
  function initBeforeAfterSlider() {
    $$('.ba-slider').forEach(function (slider) {
      var handle = slider.querySelector('.ba-handle');
      var afterEl = slider.querySelector('.ba-after');
      if (!handle || !afterEl) return;
      var isDragging = false;

      function setPos(x) {
        var rect = slider.getBoundingClientRect();
        var pct = Math.min(100, Math.max(0, ((x - rect.left) / rect.width) * 100));
        handle.style.left = pct + '%';
        afterEl.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      }

      handle.addEventListener('mousedown', function (e) { isDragging = true; e.preventDefault(); });
      document.addEventListener('mousemove', function (e) { if (isDragging) setPos(e.clientX); });
      document.addEventListener('mouseup', function () { isDragging = false; });

      handle.addEventListener('touchstart', function (e) { isDragging = true; }, { passive: true });
      document.addEventListener('touchmove', function (e) { if (isDragging) setPos(e.touches[0].clientX); }, { passive: true });
      document.addEventListener('touchend', function () { isDragging = false; });
    });
  }

  /* ─── Volume discount table ─── */
  function initVolumeDiscount() {
    var table = $('#volume-discount-table');
    if (!table) return;
    var rows = $$('.vd-row', table);
    var priceEl = $('#product-price');

    rows.forEach(function (row) {
      row.addEventListener('click', function () {
        rows.forEach(function (r) { r.classList.remove('is-selected'); });
        row.classList.add('is-selected');
        var price = row.dataset.price;
        if (priceEl && price) priceEl.textContent = '£' + (parseInt(price, 10) / 100).toFixed(2);
        var qtyInput = $('#quantity-input');
        if (qtyInput && row.dataset.qty) qtyInput.value = row.dataset.qty;
      });
    });
  }

  /* ─── Stock scarcity ─── */
  function initScarcity() {
    $$('[data-stock-count]').forEach(function (el) {
      el.textContent = rand(18, 27);
    });
    $$('[data-sold-count]').forEach(function (el) {
      el.textContent = rand(43, 52);
    });
  }

  /* ─── Live visitor counter ─── */
  function initVisitorCounter() {
    $$('[data-visitors]').forEach(function (el) {
      var current = rand(8, 24);
      el.textContent = current;
      setInterval(function () {
        var change = rand(-2, 3);
        current = Math.max(5, Math.min(30, current + change));
        el.textContent = current;
      }, rand(30000, 60000));
    });
  }

  /* ─── Countdown timer (resets daily at midnight) ─── */
  function initCountdown() {
    $$('[data-countdown]').forEach(function (el) {
      function tick() {
        var now = new Date();
        var midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        var diff = Math.floor((midnight - now) / 1000);
        var h = Math.floor(diff / 3600);
        var m = Math.floor((diff % 3600) / 60);
        var s = diff % 60;
        el.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
      }
      function pad(n) { return n < 10 ? '0' + n : n; }
      tick();
      setInterval(tick, 1000);
    });
  }

  /* ─── Delivery cutoff countdown (3pm GMT) ─── */
  function initDeliveryCutoff() {
    var el = $('#delivery-countdown');
    if (!el) return;
    function tick() {
      var now = new Date();
      var cutoff = new Date(now);
      cutoff.setHours(15, 0, 0, 0);
      if (now >= cutoff) {
        el.closest('[data-delivery-cutoff]').style.display = 'none';
        return;
      }
      var diff = Math.floor((cutoff - now) / 1000);
      var h = Math.floor(diff / 3600);
      var m = Math.floor((diff % 3600) / 60);
      var s = diff % 60;
      el.textContent = pad(h) + 'h ' + pad(m) + 'm ' + pad(s) + 's';
      function pad(n) { return n < 10 ? '0' + n : n; }
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ─── Welcome popup ─── */
  function initWelcomePopup() {
    if (!window.Lumisca.welcomePopupEnabled) return;
    var popup = $('#welcome-popup');
    if (!popup) return;
    if (getCookie('lumi_welcome_seen')) return;

    setTimeout(function () {
      popup.classList.add('is-open');
      document.body.classList.add('popup-open');
    }, 8000);

    var closeBtn = popup.querySelector('[data-popup-close]');
    var overlay = popup.querySelector('.popup__overlay');
    function closePopup() {
      popup.classList.remove('is-open');
      document.body.classList.remove('popup-open');
      setCookie('lumi_welcome_seen', '1', 7);
    }
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (overlay) overlay.addEventListener('click', closePopup);
  }

  /* ─── Exit intent popup ─── */
  function initExitPopup() {
    if (!window.Lumisca.exitPopupEnabled) return;
    var popup = $('#exit-popup');
    if (!popup) return;
    if (getCookie('lumi_exit_seen')) return;

    var triggered = false;
    function showPopup() {
      if (triggered) return;
      triggered = true;
      popup.classList.add('is-open');
      document.body.classList.add('popup-open');
      setCookie('lumi_exit_seen', '1', 3);
    }

    // Desktop: mouse leaves viewport at top
    document.addEventListener('mouseleave', function (e) {
      if (e.clientY < 10) showPopup();
    });

    // Mobile: 40 second timeout
    if ('ontouchstart' in window) {
      setTimeout(showPopup, 40000);
    }

    var closeBtn = popup.querySelector('[data-popup-close]');
    var overlay = popup.querySelector('.popup__overlay');
    function closePopup() {
      popup.classList.remove('is-open');
      document.body.classList.remove('popup-open');
    }
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (overlay) overlay.addEventListener('click', closePopup);
  }

  /* ─── Recent purchase toast notifications ─── */
  var toastNames = ['Sophie T.', 'James M.', 'Emma R.', 'Oliver H.', 'Charlotte W.', 'Liam B.', 'Amelia C.', 'Noah P.', 'Isla F.', 'Harry D.'];
  var toastLocations = ['Manchester', 'London', 'Leeds', 'Edinburgh', 'Birmingham', 'Bristol', 'Cardiff', 'Liverpool', 'Sheffield', 'Glasgow'];
  var toastProducts = [
    'Lumisca Pro Hair Growth Cap',
    'Lumisca Glow Face Mask',
    'Lumisca Rest Eye Mask',
    'Lumisca Complete Bundle'
  ];
  var toastMinutes = [2, 4, 7, 11, 14, 18, 23, 31];

  function showToast() {
    var container = $('#toast-container');
    if (!container) return;
    var name = toastNames[rand(0, toastNames.length - 1)];
    var location = toastLocations[rand(0, toastLocations.length - 1)];
    var product = toastProducts[rand(0, toastProducts.length - 1)];
    var mins = toastMinutes[rand(0, toastMinutes.length - 1)];

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML =
      '<div class="toast__icon">🛒</div>' +
      '<div class="toast__body">' +
        '<strong>' + name + ' from ' + location + '</strong>' +
        '<span>just purchased ' + product + '</span>' +
        '<span class="toast__time">' + mins + ' minutes ago</span>' +
      '</div>' +
      '<button class="toast__close" aria-label="Dismiss">✕</button>';

    container.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('is-visible'); });

    toast.querySelector('.toast__close').addEventListener('click', function () {
      dismissToast(toast);
    });

    setTimeout(function () { dismissToast(toast); }, 5000);
  }

  function dismissToast(toast) {
    toast.classList.remove('is-visible');
    setTimeout(function () { toast.remove(); }, 400);
  }

  function initToasts() {
    if (getCookie('lumi_toasts_off')) return;
    setTimeout(function () {
      showToast();
      setInterval(showToast, rand(45000, 90000));
    }, rand(8000, 15000));
  }

  /* ─── Wishlist (cookie-based) ─── */
  function initWishlist() {
    function getWishlist() {
      try { return JSON.parse(getCookie('lumi_wishlist') || '[]'); } catch (e) { return []; }
    }
    function saveWishlist(list) {
      setCookie('lumi_wishlist', JSON.stringify(list), 30);
    }
    function updateHearts() {
      var list = getWishlist();
      $$('[data-wishlist-btn]').forEach(function (btn) {
        var id = parseInt(btn.dataset.productId, 10);
        btn.classList.toggle('is-wishlisted', list.indexOf(id) > -1);
        btn.setAttribute('aria-pressed', list.indexOf(id) > -1 ? 'true' : 'false');
      });
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-wishlist-btn]');
      if (!btn) return;
      var id = parseInt(btn.dataset.productId, 10);
      var list = getWishlist();
      var idx = list.indexOf(id);
      if (idx > -1) { list.splice(idx, 1); } else { list.push(id); }
      saveWishlist(list);
      updateHearts();
    });

    updateHearts();
  }

  /* ─── Recently viewed products ─── */
  function initRecentlyViewed() {
    var productId = document.body.dataset.productId;
    if (!productId) return;
    try {
      var viewed = JSON.parse(getCookie('lumi_viewed') || '[]');
      var id = parseInt(productId, 10);
      viewed = viewed.filter(function (v) { return v !== id; });
      viewed.unshift(id);
      viewed = viewed.slice(0, 4);
      setCookie('lumi_viewed', JSON.stringify(viewed), 30);
    } catch (e) {}
  }

  /* ─── Predictive search ─── */
  function initPredictiveSearch() {
    var input = $('#search-input');
    var results = $('#search-results');
    if (!input || !results) return;
    var timer;

    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim();
      if (q.length < 2) { results.style.display = 'none'; return; }
      timer = setTimeout(function () {
        fetch('/search/suggest.json?q=' + encodeURIComponent(q) + '&resources[type]=product&resources[limit]=5')
          .then(function (r) { return r.json(); })
          .then(function (data) {
            var products = (data.resources && data.resources.results && data.resources.results.products) || [];
            if (!products.length) { results.style.display = 'none'; return; }
            results.innerHTML = products.map(function (p) {
              return '<a class="search-result-item" href="' + p.url + '">' +
                '<img src="' + p.image + '" alt="' + p.title + '" width="48" height="48" loading="lazy">' +
                '<span class="search-result-item__title">' + p.title + '</span>' +
                '<span class="search-result-item__price">' + formatMoney(p.price) + '</span>' +
              '</a>';
            }).join('');
            results.style.display = 'block';
          });
      }, 300);
    });

    document.addEventListener('click', function (e) {
      if (!results.contains(e.target) && e.target !== input) {
        results.style.display = 'none';
      }
    });
  }

  /* ─── Cookie consent (GDPR) ─── */
  function initCookieConsent() {
    var banner = $('#cookie-banner');
    if (!banner) return;

    if (getCookie('lumi_consent')) {
      if (getCookie('lumi_consent') === 'all') fireMarketingPixels();
      return;
    }

    banner.style.display = 'flex';

    var acceptBtn = $('#cookie-accept');
    var rejectBtn = $('#cookie-reject');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        setCookie('lumi_consent', 'all', 365);
        banner.style.display = 'none';
        fireMarketingPixels();
      });
    }
    if (rejectBtn) {
      rejectBtn.addEventListener('click', function () {
        setCookie('lumi_consent', 'essential', 365);
        banner.style.display = 'none';
      });
    }
  }

  function fireMarketingPixels() {
    // Activate deferred pixel scripts
    $$('script[type="text/plain"][data-cookiecategory="marketing"]').forEach(function (script) {
      var s = document.createElement('script');
      s.textContent = script.textContent;
      document.head.appendChild(s);
    });
  }

  /* ─── Lazy load images ─── */
  function initLazyLoad() {
    if ('loading' in HTMLImageElement.prototype) return; // native lazy load
    var imgs = $$('img[data-src]');
    if (!imgs.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          img.src = img.dataset.src;
          if (img.dataset.srcset) img.srcset = img.dataset.srcset;
          img.removeAttribute('data-src');
          io.unobserve(img);
        }
      });
    });
    imgs.forEach(function (img) { io.observe(img); });
  }

  /* ─── Animate on scroll ─── */
  function initScrollAnimations() {
    var els = $$('[data-animate]');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ─── Quantity input buttons ─── */
  function initQuantityInputs() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-qty-change]');
      if (!btn) return;
      var input = btn.closest('[data-qty-wrapper]').querySelector('[data-qty-input]');
      if (!input) return;
      var current = parseInt(input.value, 10) || 1;
      var dir = btn.dataset.qtyChange === 'up' ? 1 : -1;
      input.value = Math.max(1, current + dir);
      input.dispatchEvent(new Event('change'));
    });
  }

  /* ─── Init all ─── */
  document.addEventListener('DOMContentLoaded', function () {
    initAnnouncementBar();
    initStickyHeader();
    initMobileMenu();
    initMegaMenu();
    initCartDrawer();
    initAddToCart();
    initStickyATC();
    initBackToTop();
    initAccordion();
    initProductTabs();
    initProductGallery();
    initBeforeAfterSlider();
    initVolumeDiscount();
    initScarcity();
    initVisitorCounter();
    initCountdown();
    initDeliveryCutoff();
    initWelcomePopup();
    initExitPopup();
    initToasts();
    initWishlist();
    initRecentlyViewed();
    initPredictiveSearch();
    initCookieConsent();
    initLazyLoad();
    initScrollAnimations();
    initQuantityInputs();
    updateShippingBar(window.Lumisca.cartTotal);
  });

})();
