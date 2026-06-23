/* ============================================================
   Viet Kitchen — menu site logic (vanilla JS, no framework)

   Trilingual: Spanish (default), English, Vietnamese.
   - T(es, en, vi) packs a string into the three languages.
   - tx(value) reads the current language (plain strings pass through).
   - Switching language re-renders the static chrome, the nav and
     the whole book; the choice is saved in localStorage.

   The menu is defined as data, split into pages, then rendered as a
   3D flip-book (desktop) that the CSS flattens to a scroll on mobile.
   ============================================================ */
(function () {
  'use strict';

  /* ---- Language ---- */
  var LANGS = ['es', 'en', 'vi'];
  var lang = 'es';
  try {
    var saved = localStorage.getItem('vk-lang');
    if (saved && LANGS.indexOf(saved) !== -1) lang = saved;
  } catch (e) { /* localStorage may be blocked; default stays 'es' */ }

  function T(es, en, vi) { return { es: es, en: en, vi: vi }; }
  function tx(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;       // same in every language
    return v[lang] != null ? v[lang] : v.es;   // fall back to Spanish
  }

  /* ---- UI chrome strings (cover, header, modal, static page text) ---- */
  var I18N = {
    tagline: T('Hogar del Phở secreto', 'Home of the secret Phở', 'Ngôi nhà của Phở bí truyền'),
    openMenu: T('Abrir la carta →', 'Open the menu →', 'Mở thực đơn →'),
    reservasPhone: T('Reservas · 935 272 677', 'Reservations · 935 272 677', 'Đặt bàn · 935 272 677'),
    promos: T('Promociones', 'Specials', 'Khuyến mãi'),
    oferta: T('Oferta', 'Deal', 'Ưu đãi'),
    promoLunchKicker: T('Lun – Vie · mediodía', 'Mon – Fri · lunch', 'Th2 – Th6 · trưa'),
    promoLunchName: T('Menú del día', 'Daily menu', 'Thực đơn trong ngày'),
    promoLunchPrice: T('desde 11,90 €', 'from 11,90 €', 'từ 11,90 €'),
    promoBoxKicker: T('Para llevar', 'Takeaway', 'Mang đi'),
    promoBoxName: 'Lunch Box',
    promoTastingKicker: T('Min. 2 personas', 'Min. 2 people', 'Tối thiểu 2 người'),
    promoTastingName: T('Menú degustación', 'Tasting menu', 'Thực đơn nếm thử'),
    promoTastingPrice: T('22,90 € / persona', '22,90 € / person', '22,90 € / người'),

    reserve: T('Reservar', 'Book', 'Đặt bàn'),
    reserveTable: T('Reservar mesa', 'Book a table', 'Đặt bàn'),
    reserveTableArrow: T('Reservar una mesa →', 'Book a table →', 'Đặt một bàn →'),

    resEyebrow: T('Reservas · Viet Kitchen', 'Reservations · Viet Kitchen', 'Đặt bàn · Viet Kitchen'),
    resHeading: T('Reserva tu mesa', 'Book your table', 'Đặt bàn của bạn'),
    fecha: T('Fecha', 'Date', 'Ngày'),
    hora: T('Hora', 'Time', 'Giờ'),
    comensales: T('Comensales', 'Guests', 'Số khách'),
    personas: T('personas', 'guests', 'khách'),
    phName: T('Nombre', 'Name', 'Tên'),
    phPhone: T('Teléfono', 'Phone', 'Điện thoại'),
    phEmail: 'Email',
    phNotes: T('Peticiones especiales', 'Special requests', 'Yêu cầu đặc biệt'),
    submit: T('Reservar una mesa', 'Book a table', 'Đặt một bàn'),
    resHint: T('Indica fecha, hora y nombre para confirmar.', 'Enter date, time and name to confirm.', 'Nhập ngày, giờ và tên để xác nhận.'),
    doneEyebrow: T('Reserva recibida', 'Reservation received', 'Đã nhận đặt bàn'),
    doneThanks: T('Gracias', 'Thank you', 'Cảm ơn'),
    doneText: T('Te esperamos en Viet Kitchen. Te enviaremos la confirmación por mensaje.', 'We look forward to seeing you at Viet Kitchen. We will send your confirmation by message.', 'Hẹn gặp bạn tại Viet Kitchen. Chúng tôi sẽ gửi xác nhận qua tin nhắn.'),
    doneBack: T('Volver a la carta', 'Back to the menu', 'Quay lại thực đơn'),

    titleEyebrow: T('La Carta', 'The Menu', 'Thực Đơn'),
    est: 'Est. Barcelona',
    leftCaption: T('Cocina vietnamita', 'Vietnamese cuisine', 'Ẩm thực Việt Nam'),
    reservasLabel: T('Reservas', 'Reservations', 'Đặt bàn')
  };

  /* Page geometry (the book is two pages wide). */
  var PW = 520, PH = 720;
  var MOBILE_BP = 820;
  var IMG = 'assets/images/';

  /* --- Top navigation: label -> section anchor --- */
  var NAV = [
    { id: 'entrantes', label: T('Entrantes', 'Starters', 'Khai vị') },
    { id: 'grill',     label: T('Grill', 'Grill', 'Nướng') },
    { id: 'pho',       label: T('Phở', 'Phở', 'Phở') },
    { id: 'salteados', label: T('Salteados', 'Stir-fried', 'Xào') },
    { id: 'curry',     label: T('Curry', 'Curry', 'Cà Ri') },
    { id: 'arroz',     label: T('Arroz', 'Rice', 'Cơm') },
    { id: 'menus',     label: T('Menús', 'Set menus', 'Thực đơn') },
    { id: 'postres',   label: T('Postres', 'Desserts', 'Tráng miệng') },
    { id: 'bebidas',   label: T('Bebidas', 'Drinks', 'Đồ uống') }
  ];

  /* ----------------------------------------------------------
     Build the ordered list of pages from the menu content.
     Item shape: { name:T, desc:T, p, t:[tags], img }
     A section with more than 4 items spills onto extra pages.
     ---------------------------------------------------------- */
  function buildPages() {
    /* The menu is the designed PDF rendered one image per page
       (assets/images/pages/p-01.jpg ...). Each page is a full-bleed image;
       some carry a nav anchor so the category buttons jump to the right page,
       and a label used by the footer page counter. */
    var PAGE_DEFS = [
      { label: 'Portada' },                          //  1 cover
      { anchor: 'entrantes', label: 'Entrantes' },   //  2 Fresh Roll
      { label: 'Entrantes' },                        //  3 rolls
      { label: 'Entrantes' },                        //  4 Salad & Side Dish
      { label: 'Entrantes' },                        //  5 papaya salad / sides
      { anchor: 'grill', label: 'Grill' },           //  6 Grill divider
      { label: 'Grill' },                            //  7 grill items
      { anchor: 'pho', label: 'Pho' },               //  8 What The Pho
      { label: 'Pho' },                              //  9 secret pho + pho
      { label: 'Bun' },                              // 10 Bun Cha / Bun Bo Hue
      { label: 'Bun' },                              // 11 bun items
      { label: 'Banh Xeo' },                         // 12 Vietnamese pancake
      { anchor: 'salteados', label: 'Salteados' },   // 13 Wok Noodles divider
      { label: 'Salteados' },                        // 14 wok items
      { label: 'Ensalada de fideos' },               // 15 noodle salad
      { anchor: 'curry', label: 'Curry' },           // 16 Curry & Tamarind
      { label: 'Curry' },                            // 17 curry items
      { label: 'Tamarindo' },                        // 18 tamarind items
      { anchor: 'arroz', label: 'Arroz' },           // 19 Vietnamese Taste
      { label: 'Arroz' },                            // 20 rice dishes
      { label: 'Arroz frito' },                      // 21 fried rice
      { anchor: 'menus', label: 'Menus' },           // 22 tasting menus
      { label: 'Menus' },                            // 23 deluxe menus
      { anchor: 'postres', label: 'Postres' },       // 24 Desserts divider
      { label: 'Postres' },                          // 25 dessert items
      { anchor: 'bebidas', label: 'Bebidas' },       // 26 homemade drinks
      { label: 'Bebidas' },                          // 27 drinks divider
      { label: 'Te' },                               // 28 tea
      { label: 'Cafe' },                             // 29 coffee
      { label: 'Refrescos' },                        // 30 soft drinks
      { label: 'Cervezas' },                         // 31 beers
      { label: 'Gracias' }                           // 32 thank you
    ];
    return PAGE_DEFS.map(function (d, i) {
      var n = (i + 1 < 10 ? '0' : '') + (i + 1);
      return { type: 'break', img: IMG + 'pages/p-' + n + '.jpg',
        anchor: d.anchor || '', title: d.label || '' };
    });
  }

  /* ----------------------------------------------------------
     Rendering helpers (build HTML strings from page data).
     ---------------------------------------------------------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function itemHTML(it) {
    var tags = (it.t || []).map(function (tg) {
      return '<span class="item-tag">' + esc(tg) + '</span>';
    }).join('');
    var thumb = it.img
      ? '<div class="item-thumb"><img src="' + esc(it.img) + '" alt="' + esc(tx(it.name)) + '"></div>'
      : '';
    var d = tx(it.desc);
    var desc = d ? '<div class="item-desc">' + esc(d) + '</div>' : '';
    return '<div class="item">' + thumb +
      '<div class="item-main">' +
        '<div class="item-titles"><span class="item-name">' + esc(tx(it.name)) + '</span>' + tags + '</div>' +
        desc +
      '</div>' +
      '<span class="item-price">' + esc(it.p) + '</span>' +
    '</div>';
  }

  function bodyHTML(pg) {
    if (pg.type === 'title') {
      return '<div class="page-title">' +
        '<img src="' + IMG + 'logo.jpg" alt="Viet Kitchen">' +
        '<div class="eyebrow">' + esc(tx(I18N.titleEyebrow)) + '</div>' +
        '<h2>Viet Kitchen</h2>' +
        '<p class="tag">' + esc(tx(I18N.tagline)) + '</p>' +
        '<svg width="46" height="25" viewBox="0 0 44 24" fill="none" aria-hidden="true"><path d="M22 4 L39 20 C30 16 14 16 5 20 Z" stroke="#B65A33" stroke-width="1.4" stroke-linejoin="round" fill="none"/></svg>' +
        '<div class="est">' + esc(tx(I18N.est)) + '</div>' +
      '</div>';
    }
    if (pg.type === 'story') {
      var paras = pg.paras.map(function (p) { return '<p>' + esc(tx(p)) + '</p>'; }).join('');
      return '<div class="story"><div class="sec-eyebrow">' + esc(tx(pg.eyebrow)) + '</div>' +
        '<h2>' + esc(tx(pg.title)) + '</h2>' + paras + '</div>';
    }
    if (pg.type === 'hours') {
      var rows = pg.hours.map(function (hr) {
        return '<div class="hours-row"><span class="d">' + esc(tx(hr.d)) + '</span><span class="h">' + esc(tx(hr.h)) + '</span></div>';
      }).join('');
      return '<div class="hours"><div class="sec-eyebrow">' + esc(tx(pg.eyebrow)) + '</div>' +
        '<h2>' + esc(tx(pg.title)) + '</h2>' + rows +
        '<div class="hours-addr">Carrer d\'Aribau, Eixample<br>08011 Barcelona</div>' +
        '<div class="hours-contact">' + esc(tx(I18N.reservasLabel)) + ' · 935 272 677<br>hola@vietkitchen.es · @vietkitchenbcn</div>' +
        '<a class="btn-cta about-res-btn" href="tel:+34935272677">' + esc(tx(I18N.reserveTableArrow)) + '</a>' +
      '</div>';
    }
    /* list */
    var cat = pg.cat ? '<div class="sec-cat">' + esc(tx(pg.cat)) + '</div>' : '';
    var eyebrow = pg.eyebrow ? '<div class="sec-eyebrow">' + esc(tx(pg.eyebrow)) + '</div>' : '';
    var head = (pg.cat || pg.eyebrow || pg.title)
      ? cat + eyebrow + '<div class="sec-head"><h2>' + esc(tx(pg.title)) + '</h2></div>'
      : '';
    var items = pg.items.map(itemHTML).join('');
    var note = pg.note ? '<p class="page-note">' + esc(tx(pg.note)) + '</p>' : '';
    return head + items + note;
  }

  function faceInnerHTML(pg) {
    if (!pg) return '<div class="leaf-face-inner"></div>';
    if (pg.type === 'break') {
      var bid = pg.anchor ? ' id="' + pg.anchor + '"' : '';
      return '<div class="leaf-face-inner break"' + bid + '>' +
        '<div class="break-bg" style="background-image:url(\'' + pg.img + '\')"></div>' +
        '<img class="break-img" src="' + pg.img + '" alt="" loading="lazy"></div>';
    }
    var hero = pg.hero
      ? '<div class="hero" style="background:url(\'' + pg.hero.img + '\') ' + pg.hero.pos + '/cover no-repeat;height:' + pg.hero.h + '"></div>'
      : '';
    var id = pg.anchor ? ' id="' + pg.anchor + '"' : '';
    return '<div class="leaf-face-inner">' + hero +
      '<div class="page-body"' + id + '>' + bodyHTML(pg) + '</div></div>';
  }

  /* ----------------------------------------------------------
     State + element references.
     ---------------------------------------------------------- */
  var pages, leafCount, anchorSpread, anchorPage;
  var spread = 0;          // desktop: current open spread (0 .. leafCount-1)
  var activeLeaf = -1;     // desktop: leaf mid-flip (z-index)
  var leafEls = [];        // desktop leaf DOM nodes
  var mpage = 0;           // mobile: current page (0 .. pages.length-1)
  var mActive = -1;        // mobile: page mid-flip (CSS fallback z-index)
  var mleafEls = [];       // mobile page-card DOM nodes (CSS fallback)
  var pageFlip = null;     // StPageFlip instance (real page curl on phone)
  var mode = '';           // 'd' = desktop spread, 'm' = mobile single-page flip

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var bookEl, mbookEl, stageEl, scaleEl;

  function isMobile() { return window.innerWidth < MOBILE_BP; }

  /* Recompute pages + anchor maps (called on language change). */
  function rebuildData() {
    pages = buildPages();
    leafCount = Math.ceil(pages.length / 2);
    anchorSpread = {};
    anchorPage = {};
    pages.forEach(function (pg, i) {
      if (!pg.anchor) return;
      anchorSpread[pg.anchor] = (i % 2 === 0) ? (i / 2) : ((i + 1) / 2);
      anchorPage[pg.anchor] = i;
    });
  }

  /* ----------------------------------------------------------
     Build the book DOM. CSS flattens it on small screens.
     ---------------------------------------------------------- */
  function buildBook() {
    var html = '<div class="book-shadow"></div>' +
      '<div class="static-left">' +
        '<div class="static-left-inner">' +
          '<img src="' + IMG + 'logo.jpg" alt="Viet Kitchen">' +
          '<svg width="42" height="23" viewBox="0 0 44 24" fill="none" aria-hidden="true"><path d="M22 4 L39 20 C30 16 14 16 5 20 Z" stroke="#F29EBC" stroke-width="1.3" stroke-linejoin="round" fill="none" opacity="0.9"/></svg>' +
          '<div class="static-left-cap">' + esc(tx(I18N.leftCaption)) + '<br>Barcelona · Eixample</div>' +
        '</div>' +
      '</div>';

    for (var k = 0; k < leafCount; k++) {
      var front = pages[2 * k] || null;
      var back = pages[2 * k + 1] || null;
      html += '<div class="leaf" data-leaf="' + k + '">' +
        '<div class="leaf-face front">' + faceInnerHTML(front) + '</div>' +
        '<div class="leaf-face back">' + faceInnerHTML(back) + '</div>' +
      '</div>';
    }
    bookEl.innerHTML = html;
    leafEls = Array.prototype.slice.call(bookEl.querySelectorAll('.leaf'));

    /* Fixed pixel sizing for the desktop 3D layout (CSS overrides on mobile). */
    bookEl.style.width = (PW * 2) + 'px';
    bookEl.style.height = PH + 'px';
    var sl = bookEl.querySelector('.static-left');
    sl.style.width = PW + 'px';
    sl.style.height = PH + 'px';
    leafEls.forEach(function (leaf) {
      leaf.style.width = PW + 'px';
      leaf.style.height = PH + 'px';
      leaf.style.left = PW + 'px';
      leaf.style.top = '0';
    });
  }

  function hasPageFlip() { return !!(window.St && window.St.PageFlip); }

  /* Mobile: real page-curl flip via StPageFlip (one page per screen).
     Init is deferred to the next frame so the container has a measured size
     (StPageFlip's 'stretch' sizing reads the parent box). */
  function buildMobileFlip() {
    if (pageFlip) { try { pageFlip.destroy(); } catch (e) {} pageFlip = null; }
    /* StPageFlip takes over (and on destroy removes) the element it's given, so
       hand it a fresh disposable child and keep #mbook as the stable container. */
    mbookEl.innerHTML = '';
    var inner = document.createElement('div');
    inner.className = 'flipbook';
    var html = '';
    for (var i = 0; i < pages.length; i++) {
      html += '<div class="page" data-page="' + i + '">' + faceInnerHTML(pages[i]) + '</div>';
    }
    inner.innerHTML = html;
    mbookEl.appendChild(inner);
    var startAt = Math.min(mpage, pages.length - 1);
    requestAnimationFrame(function () {
      if (mode !== 'm' || !mbookEl.contains(inner)) return;   // bailed out before the frame
      var pf = new window.St.PageFlip(inner, {
        width: PW, height: PH, size: 'stretch',
        minWidth: 280, maxWidth: 1400, minHeight: 360, maxHeight: 1800,
        maxShadowOpacity: 0.5, drawShadow: true, flippingTime: 850,
        usePortrait: true, showCover: false, mobileScrollSupport: false,
        swipeDistance: 30, useMouseEvents: true
      });
      pf.loadFromHTML(inner.querySelectorAll('.page'));
      pf.on('flip', function (e) { mpage = e.data; updateChrome(); });
      pf.turnToPage(startAt);
      pageFlip = pf;
      updateChrome();
    });
  }

  /* Fallback: CSS rotateY stack (used only if the library failed to load). */
  function buildMobileCSS() {
    var html = '';
    for (var i = 0; i < pages.length; i++) {
      html += '<div class="mleaf" data-page="' + i + '">' +
        '<div class="mleaf-face front">' + faceInnerHTML(pages[i]) + '</div>' +
        '<div class="mleaf-face back"></div>' +
      '</div>';
    }
    mbookEl.innerHTML = html;
    mleafEls = Array.prototype.slice.call(mbookEl.querySelectorAll('.mleaf'));
  }

  function buildMobile() {
    if (hasPageFlip()) buildMobileFlip();
    else buildMobileCSS();
  }

  /* Build whichever layout the viewport needs; clear the other so anchor ids
     are unique and offscreen DOM is not kept around. */
  function buildActive() {
    mode = isMobile() ? 'm' : 'd';
    if (mode === 'm') { bookEl.innerHTML = ''; buildMobile(); }
    else {
      if (pageFlip) { try { pageFlip.destroy(); } catch (e) {} pageFlip = null; }
      mbookEl.innerHTML = ''; buildBook();
    }
  }

  /* Flip the mobile stack to the current page (one page visible at a time).
     Only the current page, its neighbours and any page mid-flip are painted
     and GPU-promoted; the rest are hidden so the 3D flip stays smooth. */
  function applyMobileFlip() {
    mleafEls.forEach(function (card, k) {
      var flipped = k < mpage;
      var z = (k === mActive) ? 9000 : (flipped ? 1000 + k : 8000 - k);
      var live = (k === mpage || k === mActive || Math.abs(k - mpage) <= 1);
      card.style.transform = flipped ? 'rotateY(-180deg)' : 'rotateY(0deg)';
      card.style.zIndex = z;
      card.style.visibility = live ? 'visible' : 'hidden';
      card.classList.add('animated');
    });
  }

  /* Position/flip every leaf for the current spread (desktop). */
  function applyFlip() {
    leafEls.forEach(function (leaf, k) {
      var flipped = k < spread;
      var z = (k === activeLeaf) ? 60 : (flipped ? 10 + k : 60 - k);
      leaf.style.position = 'absolute';
      leaf.style.transformOrigin = 'left center';
      leaf.style.transform = flipped ? 'rotateY(-180deg)' : 'rotateY(0deg)';
      leaf.style.zIndex = z;
      leaf.classList.add('animated');
    });
  }

  /* Scale the spread to fit the available stage area (desktop). */
  function applyScale() {
    if (isMobile()) { scaleEl.style.transform = ''; return; }
    var availW = Math.max(320, window.innerWidth - 116);
    var availH = Math.max(340, window.innerHeight - 116);
    var s = Math.min(availW / (PW * 2), availH / PH);
    s = Math.max(0.34, Math.min(s, 2.4));
    scaleEl.style.transform = 'scale(' + s.toFixed(3) + ')';
  }

  /* Footer label for a desktop spread: the title of whichever page has one. */
  function spreadLabel(i) {
    var fp = pages[2 * i], bp = pages[2 * i + 1];
    if (fp && fp.type === 'title') return tx(I18N.titleEyebrow);
    return tx((fp && fp.title) || (bp && bp.title) || '');
  }
  /* Footer label for a single mobile page. */
  function pageLabel(i) {
    var pg = pages[i];
    if (!pg) return '';
    if (pg.type === 'title') return tx(I18N.titleEyebrow);
    return tx(pg.title || pg.cat || '');
  }

  function updateChrome() {
    if (mode === 'm') {
      $('#spread-num').textContent = String(mpage + 1).padStart(2, '0');
      $('#spread-label').textContent = pageLabel(mpage);
      $('#spread-total').textContent = '/ ' + String(pages.length).padStart(2, '0');
      $('#prev').disabled = mpage <= 0;
      $('#next').disabled = mpage >= pages.length - 1;
    } else {
      $('#spread-num').textContent = String(spread + 1).padStart(2, '0');
      $('#spread-label').textContent = spreadLabel(spread);
      $('#spread-total').textContent = '/ ' + String(leafCount).padStart(2, '0');
      $('#prev').disabled = spread <= 0;
      $('#next').disabled = spread >= leafCount - 1;
    }
  }

  function render() {
    if (mode === 'm') { if (!pageFlip) applyMobileFlip(); }
    else { applyFlip(); applyScale(); }
    updateChrome();
  }

  /* ----------------------------------------------------------
     Page turning + navigation.
     ---------------------------------------------------------- */
  function goNext() {
    if (mode === 'm') {
      if (pageFlip) { pageFlip.flipNext(); return; }
      if (mpage < pages.length - 1) { mActive = mpage; mpage++; render(); }
    } else if (spread < leafCount - 1) { activeLeaf = spread; spread++; render(); }
  }
  function goPrev() {
    if (mode === 'm') {
      if (pageFlip) { pageFlip.flipPrev(); return; }
      if (mpage > 0) { mActive = mpage - 1; mpage--; render(); }
    } else if (spread > 0) { activeLeaf = spread - 1; spread--; render(); }
  }
  function navGo(cat) {
    if (mode === 'm') {
      if (anchorPage[cat] == null) return;
      if (pageFlip) { pageFlip.turnToPage(anchorPage[cat]); mpage = anchorPage[cat]; updateChrome(); return; }
      mActive = -1; mpage = anchorPage[cat]; render();
    } else if (anchorSpread[cat] != null) {
      activeLeaf = -1; spread = anchorSpread[cat]; render();
    }
  }

  function buildNav() {
    var nav = $('#nav');
    nav.innerHTML = NAV.map(function (n) {
      return '<button type="button" data-cat="' + n.id + '">' + esc(tx(n.label)) + '</button>';
    }).join('');
  }

  /* ----------------------------------------------------------
     Screen switching (cover <-> book).
     ---------------------------------------------------------- */
  function showBook() {
    $('#cover').hidden = true;
    $('#book').hidden = false;
    spread = 0; activeLeaf = -1; mpage = 0; mActive = -1;
    buildActive();
    render();
  }
  function showCover() {
    $('#book').hidden = true;
    $('#cover').hidden = false;
  }

  /* ----------------------------------------------------------
     Language switching.
     ---------------------------------------------------------- */
  /* Fill all [data-i18n] / [data-i18n-ph] nodes from the dictionary. */
  function applyStatic() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (I18N[key] != null) el.textContent = tx(I18N[key]);
    });
    $$('[data-i18n-ph]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-ph');
      if (I18N[key] != null) el.setAttribute('placeholder', tx(I18N[key]));
    });
    var dt = $('#done-thanks');
    if (dt) dt.textContent = tx(I18N.doneThanks);
    /* The about-page reserve button text is rebuilt with the book. */
    $$('.lang-switch button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
    });
  }

  function setLang(l) {
    if (LANGS.indexOf(l) === -1 || l === lang) return;
    lang = l;
    try { localStorage.setItem('vk-lang', l); } catch (e) { /* ignore */ }
    rebuildData();
    applyStatic();
    buildNav();
    /* Only rebuild the book if it's open (StPageFlip needs a visible container). */
    if (!$('#book').hidden) {
      if (mode === 'm') mpage = Math.min(mpage, pages.length - 1);
      else spread = Math.min(spread, leafCount - 1);
      buildActive();
      render();
    }
  }

  function mountSwitchers() {
    var tpl = $('#lang-switch-tpl').content;
    $('.cover-lang').appendChild(tpl.cloneNode(true));
    $('.header-lang').appendChild(tpl.cloneNode(true));
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.lang-switch button');
      if (b) setLang(b.getAttribute('data-lang'));
    });
  }

  /* ----------------------------------------------------------
     Reservation modal — DISABLED for now.
     The "Reservar" controls are plain tel: links (see index.html), so the
     functions below are not wired up. Re-enable by uncommenting the modal
     markup in index.html and the buildResModal()/click-handler lines in init().
     ---------------------------------------------------------- */
  var TIMES = ['13:30', '14:30', '20:00', '21:00', '22:00'];
  var res = { date: '', time: '', party: 2, name: '' };

  function openRes() {
    $('#res-modal').hidden = false;
    $('#res-form-step').hidden = false;
    $('#res-done-step').hidden = true;
  }
  function closeRes() { $('#res-modal').hidden = true; }

  function refreshSubmit() {
    $('#res-submit').disabled = !(res.name && res.date && res.time);
  }

  function buildResModal() {
    var chips = $('#time-chips');
    chips.innerHTML = TIMES.map(function (t) {
      return '<button type="button" class="time-chip" data-time="' + t + '">' + t + '</button>';
    }).join('');
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('.time-chip');
      if (!b) return;
      res.time = b.getAttribute('data-time');
      chips.querySelectorAll('.time-chip').forEach(function (c) {
        c.classList.toggle('selected', c === b);
      });
      refreshSubmit();
    });

    $('#party-inc').addEventListener('click', function () {
      res.party = Math.min(20, res.party + 1);
      $('#party-count').textContent = res.party;
    });
    $('#party-dec').addEventListener('click', function () {
      res.party = Math.max(1, res.party - 1);
      $('#party-count').textContent = res.party;
    });

    $('#res-date').addEventListener('input', function (e) { res.date = e.target.value; refreshSubmit(); });
    $('#res-name').addEventListener('input', function (e) { res.name = e.target.value; refreshSubmit(); });

    $('#res-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!(res.name && res.date && res.time)) return;
      $('#done-name').textContent = res.name;
      $('#done-date').textContent = res.date;
      $('#done-time').textContent = res.time;
      $('#done-party').textContent = res.party;
      $('#res-form-step').hidden = true;
      $('#res-done-step').hidden = false;
    });

    $('#res-modal').addEventListener('click', function (e) {
      if (e.target === this) closeRes();
    });
  }

  /* ----------------------------------------------------------
     Wire up + boot.
     ---------------------------------------------------------- */
  function init() {
    bookEl = $('#book-el');
    mbookEl = $('#mbook');
    stageEl = $('#vk-scroll');
    scaleEl = $('.scale-wrap');

    mountSwitchers();
    rebuildData();
    applyStatic();
    buildNav();
    /* The book is built lazily in showBook(), once #book is visible and has a
       measured size — StPageFlip can't initialize inside a hidden container. */
    /* buildResModal();  // reservation modal disabled — reserve buttons dial the phone */

    $('#open-menu').addEventListener('click', showBook);
    $('#to-cover').addEventListener('click', showCover);
    $('#next').addEventListener('click', goNext);
    $('#prev').addEventListener('click', goPrev);

    $('#nav').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-cat]');
      if (btn) navGo(btn.getAttribute('data-cat'));
    });

    /* Reservation modal disabled — reserve controls are tel: links.
    document.addEventListener('click', function (e) {
      if (e.target.closest('.open-res')) openRes();
      if (e.target.closest('.close-res')) closeRes();
    });
    */

    /* Keyboard: arrows turn pages, Esc closes the modal (if present) */
    document.addEventListener('keydown', function (e) {
      var modal = $('#res-modal');
      if (modal && !modal.hidden) {
        if (e.key === 'Escape') closeRes();
        return;
      }
      if ($('#book').hidden) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    });

    /* On resize, rebuild when crossing the mobile breakpoint (keeping place). */
    window.addEventListener('resize', function () {
      if ($('#book').hidden) return;
      var want = isMobile() ? 'm' : 'd';
      if (want !== mode) {
        if (want === 'm') { mpage = Math.min(spread * 2, pages.length - 1); mActive = -1; }
        else { spread = Math.floor(mpage / 2); activeLeaf = -1; }
        buildActive();
      }
      render();
    });

    /* Touch swipe to flip — only for the CSS fallback; StPageFlip has its own drag. */
    var sx = 0, sy = 0, swiping = false;
    mbookEl.addEventListener('touchstart', function (e) {
      if (pageFlip || e.touches.length !== 1) { swiping = false; return; }
      swiping = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    mbookEl.addEventListener('touchend', function (e) {
      if (!swiping || pageFlip) return;
      swiping = false;
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) goNext(); else goPrev();
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
