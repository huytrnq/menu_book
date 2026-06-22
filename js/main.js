/* ============================================================
   Viet Kitchen — menu site logic (vanilla JS, no framework)

   Three things happen here:
   1. The menu content is defined as data, then split into pages.
   2. The pages are rendered as a 3D flip-book (desktop) that the
      CSS flattens into a vertical scroll on narrow screens.
   3. Navigation, page turning and the reservation modal are wired up.
   ============================================================ */
(function () {
  'use strict';

  /* Page geometry (the book is two pages wide). */
  var PW = 520, PH = 720;
  var MOBILE_BP = 820;

  /* --- Top navigation: label -> section anchor --- */
  var NAV = [
    { id: 'entrantes', label: 'Entrantes' },
    { id: 'grill',     label: 'Grill' },
    { id: 'pho',       label: 'Phở' },
    { id: 'salteados', label: 'Salteados' },
    { id: 'curry',     label: 'Curry' },
    { id: 'arroz',     label: 'Arroz' },
    { id: 'menus',     label: 'Menús' },
    { id: 'postres',   label: 'Postres' },
    { id: 'bebidas',   label: 'Bebidas' },
    { id: 'about',     label: 'La Casa' }
  ];

  var IMG = 'assets/images/';

  /* ----------------------------------------------------------
     Build the ordered list of pages from the menu content.
     A section with more than 4 items spills onto extra pages.
     ---------------------------------------------------------- */
  function buildPages() {
    var P = [];

    function list(o) {
      var items = (o.items || []);
      var anyImg = items.some(function (it) { return !!it.img; });
      var per = 4;
      for (var i = 0; i < items.length; i += per) {
        var first = (i === 0);
        var last = (i + per >= items.length);
        var useHero = first && !anyImg && !!o.img;
        P.push({
          type: 'list',
          hero: useHero ? { img: o.img, pos: o.imgPos || 'center', h: '150px' } : null,
          anchor: first ? (o.anchor || '') : '',
          eyebrow: first ? (o.eyebrow || '') : '',
          title: o.title || '',
          vn: first ? (o.vn || '') : '',
          items: items.slice(i, i + per),
          note: last ? (o.note || '') : ''
        });
      }
    }
    function story(o) {
      P.push({ type: 'story', anchor: o.anchor || '', eyebrow: o.eyebrow || '',
        title: o.title || '', paras: o.paras || [],
        hero: o.img ? { img: o.img, pos: 'center', h: '158px' } : null });
    }
    function title() { P.push({ type: 'title' }); }
    function hours(o) {
      P.push({ type: 'hours', anchor: o.anchor || '', eyebrow: o.eyebrow || '',
        title: o.title || '', hours: o.hours || [] });
    }

    title();
    story({ anchor: 'welcome', img: IMG + 'flatlay-pho.jpg', eyebrow: 'Bienvenidos', title: 'El secreto del Phở',
      paras: [
        'Nuestro Phở legendario es más que un plato: es un secreto de familia transmitido durante generaciones, hoy conocido solo por dos personas en el mundo.',
        'Elaborado por Hoang con más de 6 horas de cocción y más de 30 ingredientes seleccionados. Un caldo profundo y auténtico, la razón por la que muchos dicen que servimos el mejor Phở de España.',
        'In Vietnamese food we trust.'
      ] });

    /* ===== MÓN KHAI VỊ · SIDE DISH ===== */
    list({ anchor: 'entrantes', eyebrow: 'Món khai vị · Side dish', title: 'Rollitos', vn: 'Cuốn & Gỏi', items: [
      { n: 'Nem Rán Hà Nội', en: 'Fried roll Hanoi', p: '8,50 €', img: IMG + 't-roll-fried.png', d: 'Cerdo, judía mungo, champiñón, fideos de cristal' },
      { n: 'Chả Giò', en: 'Fried rolls', p: '8,50 €', img: IMG + 't-roll-fried2.png', d: 'Cerdo · judía mungo (vegano)' },
      { n: 'Gỏi Cuốn', en: 'Fresh roll', p: '7,90 €', t: ['GF'], img: IMG + 't-roll-fresh.png', d: 'Cerdo & gamba · mango & gamba · tofu (vegano) · tofu & mango (vegano)' },
      { n: 'Gỏi Đu Đủ', en: 'Vietnamese papaya salad', p: '9,50 €', d: 'Cerdo & gamba · mango & gamba · pollo · tofu (vegano)' }
    ]});
    list({ img: IMG + 'hero-salads.png', eyebrow: 'Món khai vị · Para compartir', title: 'Para picar', vn: 'Món ăn kèm', items: [
      { n: 'Phồng Tôm', en: 'Shrimp puff', p: '4,50 €', d: 'Crackers de gamba fritos' },
      { n: 'Nem Chua Rán', en: 'Fried sour spring rolls', p: '8,50 €', d: 'Cerdo fermentado, pan rallado' },
      { n: 'Chả Cá Cốm', en: 'Fish cake & green rice', p: '8,50 €', d: 'Pasta de pescado, copos de arroz glutinoso verde' },
      { n: 'Rau Xào', en: 'Stir-fried vegetables', p: '7,90 €', t: ['V'], d: 'Verduras de temporada, salsa de ostras' },
      { n: 'Cơm Cháy', en: 'Crispy rice', p: '8,50 €', d: 'Arroz seco, chà bông, aceite de cebolleta' }
    ]});
    list({ anchor: 'grill', eyebrow: 'Món khai vị · A la brasa', title: 'Grill', vn: 'Món nướng', items: [
      { n: 'Thịt Xiên Nướng', en: 'Grilled meat skewers', p: '9,50 €', img: IMG + 't-grill-skewers.png', d: 'Cerdo, citronela, ajo, miel, sésamo' },
      { n: 'Thịt Bò Nướng', en: 'Grilled beef', p: '9,50 €', img: IMG + 't-grill-combo.png', d: 'Ternera, salsa de ostras, ajo, pimienta negra, citronela' },
      { n: 'Thịt Gà Nướng', en: 'Grilled chicken', p: '9,50 €', img: IMG + 't-grill-flame.png', d: 'Pollo, miel, ajo, soja, cinco especias' },
      { n: 'Cánh Gà Chiên', en: 'Fried chicken wings', p: '8,50 €', img: IMG + 't-grill-wings.png', d: 'Alitas de pollo, nước mắm, ajo, miel' },
      { n: 'Bò Viên Chiên', en: 'Beef bouncy meatballs', p: '8,50 €', img: IMG + 't-grill-meatballs.png', d: 'Ternera picada, ajo, pimienta negra' }
    ]});

    /* ===== MÓN CHÍNH · MAIN DISH ===== */
    list({ anchor: 'pho', img: IMG + 'hero-pho.png', eyebrow: 'Món chính · Sopa de fideos', title: 'Phở', vn: 'Phở', items: [
      { n: 'What The Phở', en: 'Special pho', p: '39,00 €', d: 'Phở đặc biệt · para compartir' },
      { n: 'Phở Bò', en: 'Beef', p: '16,90 €', d: 'Albóndiga de ternera casera +1,80 €' },
      { n: 'Phở Gà', en: 'Chicken', p: '14,90 €' },
      { n: 'Phở Heura', en: 'Heura (vegan)', p: '14,90 €', t: ['VG'] },
      { n: 'Phở Chay', en: 'Tofu & mushroom (vegan)', p: '14,90 €', t: ['VG'] }
    ]});
    list({ img: IMG + 'hero-bun.png', eyebrow: 'Món chính · Bol de fideos', title: 'Bún', vn: 'Bún', items: [
      { n: 'Bún Chả Hà Nội', en: 'Grilled pork & vermicelli', p: '16,90 €', d: 'Cerdo a la brasa, fideos, hierbas, salsa para mojar' },
      { n: 'Bún Bò Huế', en: 'Spicy beef noodle soup', p: '16,90 €', t: ['✦'], d: 'Ternera, salchicha de cerdo casera, citronela, caldo picante' }
    ]});
    list({ img: IMG + 'hero-banhxeo.png', eyebrow: 'Món chính · Crep vietnamita', title: 'Bánh Xèo', vn: 'Vietnamese pancake', note: 'Con papel de arroz para enrollar · +2,00 €', items: [
      { n: 'Bánh Xèo', en: 'Pork & shrimps', p: '16,90 €', d: 'Crep de arroz y cúrcuma, brotes, hierbas' },
      { n: 'Bánh Xèo Gà', en: 'Chicken', p: '16,90 €' },
      { n: 'Bánh Xèo Bò', en: 'Beef', p: '16,90 €' },
      { n: 'Bánh Xèo Chay', en: 'Tofu & mushroom (vegan)', p: '16,90 €', t: ['VG'] }
    ]});
    list({ anchor: 'salteados', img: IMG + 'hero-wok.png', eyebrow: 'Món chính · Salteado al wok', title: 'Wok Noodles', vn: 'Phở Xào', items: [
      { n: 'Phở Xào Bò', en: 'Beef', p: '14,90 €', d: 'Fideos salteados, ajo, cebolla, soja, ostras, cacahuete' },
      { n: 'Phở Xào Tôm', en: 'Shrimps', p: '14,50 €' },
      { n: 'Phở Xào Gà', en: 'Chicken', p: '14,50 €' },
      { n: 'Phở Xào Đậu', en: 'Tofu (vegan)', p: '14,50 €', t: ['VG'] },
      { n: 'Phở Xào Heura', en: 'Heura (vegan)', p: '14,90 €', t: ['VG'] }
    ]});
    list({ img: IMG + 'flatlay-curry.jpg', eyebrow: 'Món chính · Bún trộn', title: 'Noodle Salad', vn: 'Bún Bò', items: [
      { n: 'Bún Bò', en: 'Beef', p: '14,50 €', d: 'Fideos, lechuga, pepino, zanahoria, hierbas, cacahuete, nước mắm' },
      { n: 'Bún Đậu', en: 'Tofu (vegan)', p: '14,50 €', t: ['VG'] },
      { n: 'Bún Heura', en: 'Heura (vegan)', p: '14,50 €', t: ['VG'] }
    ]});
    list({ anchor: 'curry', eyebrow: 'Món chính · Al coco', title: 'Curry', vn: 'Cà Ri · con arroz', items: [
      { n: 'Cà Ri Tôm', en: 'Shrimps', p: '14,50 €', img: IMG + 't-curry-shrimp.png', d: 'Leche de coco, patata, pasta de curry, especias' },
      { n: 'Cà Ri Gà', en: 'Chicken', p: '14,50 €', img: IMG + 't-curry-chicken.png' },
      { n: 'Cà Ri Đậu', en: 'Tofu (vegan)', p: '14,50 €', t: ['VG'], img: IMG + 't-curry-tofu.png' },
      { n: 'Cà Ri Heura', en: 'Heura (vegan)', p: '14,50 €', t: ['VG'], img: IMG + 't-curry-heura.png' }
    ]});
    list({ eyebrow: 'Món chính · Agridulce', title: 'Tamarind Dream', vn: 'Me Xào · con arroz', note: 'Bold, tangy, unforgettable!', items: [
      { n: 'Me Xào Tôm', en: 'Shrimps', p: '14,50 €', img: IMG + 't-tam-shrimp.png', d: 'Arroz, salsa de tamarindo, hierbas, especias' },
      { n: 'Me Xào Bò', en: 'Beef', p: '14,50 €', img: IMG + 't-tam-beef.png' },
      { n: 'Me Xào Đậu', en: 'Tofu (vegan)', p: '14,50 €', t: ['VG'], img: IMG + 't-tam-tofu.png' },
      { n: 'Me Xào Heura', en: 'Heura (vegan)', p: '14,50 €', t: ['VG'], img: IMG + 't-tam-heura.png' }
    ]});
    list({ anchor: 'arroz', eyebrow: 'Món chính · Con arroz', title: 'Platos de Arroz', vn: 'Cơm', items: [
      { n: 'Cá Sốt Cà', en: 'Hake in red sauce', p: '14,50 €', img: IMG + 't-rice-hake.png', d: 'Filetes de merluza, salsa de tomate, arroz' },
      { n: 'Sườn Ram Mặn', en: 'Caramelized pork ribs', p: '14,50 €', img: IMG + 't-rice-ribs.png', d: 'Costillas de cerdo, salsa de caramelo, arroz' },
      { n: 'Gà Kho Sả', en: 'Chicken lemongrass', p: '14,50 €', img: IMG + 't-rice-chicken.png', d: 'Pollo, citronela, chili, arroz' },
      { n: 'Thịt Kho Tàu', en: 'Pork stew', p: '14,50 €', img: IMG + 't-rice-stew.png', d: 'Panceta, huevo cocido, agua de coco, arroz' }
    ]});
    list({ img: IMG + 'hero-friedrice.png', eyebrow: 'Món chính · Arroz frito', title: 'Fried Rice', vn: 'Cơm Rang', items: [
      { n: 'Cơm Rang Bò', en: 'Beef', p: '13,90 €' },
      { n: 'Cơm Rang Gà', en: 'Chicken', p: '13,90 €' },
      { n: 'Cơm Rang Tôm', en: 'Shrimp', p: '13,90 €' },
      { n: 'Cơm Trắng', en: 'Steamed rice', p: '3,50 €' }
    ]});

    /* ===== MÓN TRÁNG MIỆNG · DESSERT ===== */
    list({ anchor: 'postres', img: IMG + 'hero-desserts.png', eyebrow: 'Món tráng miệng · Dessert', title: 'Postres', vn: 'Món tráng miệng', items: [
      { n: 'Kem Lá Dứa', en: "Viet Kitchen's special", p: '5,90 €', d: 'Helado de pandan' },
      { n: 'Tropical Panna Cotta', en: '', p: '4,90 €' },
      { n: 'Sữa Chua Nếp Cẩm', en: 'Yogurt & black rice pudding', p: '5,90 €' },
      { n: 'Chè Khúc Bạch', en: 'Vietnamese almond panna cotta', p: '6,90 €' },
      { n: 'Chè Chuối', en: 'Banana pudding', p: '5,90 €' },
      { n: 'Sô Cô La Brownie', en: 'Chocolate brownie', p: '5,90 €' }
    ]});

    /* ===== ĐỒ UỐNG · DRINKS ===== */
    list({ anchor: 'bebidas', img: IMG + 'hero-drinks.png', eyebrow: 'Đồ uống · Homemade', title: 'Bebidas de la Casa', vn: 'Pha chế', items: [
      { n: 'Trà Đá Sả', en: 'Lemongrass iced tea', p: '5,90 €' },
      { n: 'Nước Chanh Dứa Bạc Hà', en: 'Mint pineapple lemonade', p: '5,90 €' },
      { n: 'Nước Chanh Gừng', en: 'Lemonade with ginger', p: '5,90 €' },
      { n: 'Bia Gừng Chanh', en: 'Ginger beer lemonade', p: '5,90 €', d: 'Sin alcohol' },
      { n: 'Cà Phê Đá', en: 'Vietnamese iced coffee', p: '5,90 €', d: 'Con leche condensada' },
      { n: 'Cà Phê Trứng', en: 'Egg coffee', p: '7,90 €' }
    ]});
    list({ eyebrow: 'Đồ uống · Té', title: 'Tea', vn: 'Trà', items: [
      { n: 'Bình Trà', en: 'Teapot', p: '7,90 €', d: 'Oolong / Jasmine / Pu-erh · para 2-4 personas' },
      { n: 'Jasmine Tea', en: '', p: '3,50 €' },
      { n: 'Green Tea', en: '', p: '3,50 €' },
      { n: 'Fresh Ginger Tea', en: '', p: '3,50 €' },
      { n: 'Camomile Tea', en: '', p: '3,50 €' },
      { n: 'Chai Tea', en: '', p: '3,50 €' },
      { n: 'Fresh Mint Tea', en: '', p: '3,50 €' }
    ]});
    list({ eyebrow: 'Đồ uống · Café', title: 'Coffee', vn: 'Cà Phê', items: [
      { n: 'Cà Phê Sữa', en: 'Coffee with milk', p: '2,90 €' },
      { n: 'Espresso', en: '', p: '1,90 €' },
      { n: 'Cortado', en: '', p: '2,50 €', d: '+ leche de coco 0,60 €' },
      { n: 'Americano', en: '', p: '2,90 €' }
    ]});
    list({ eyebrow: 'Đồ uống · Refrescos', title: 'Soft Drinks', vn: 'Nước ngọt', items: [
      { n: 'Coca-Cola / Zero / Fanta / Sprite / Nestea', en: '', p: '2,90 €' },
      { n: 'Tonic Water', en: '', p: '3,30 €' },
      { n: 'Ginger Beer', en: '', p: '3,30 €' },
      { n: 'Sparkling Water', en: '', p: '2,90 €' },
      { n: 'Still Mineral Water', en: '', p: '2,50 €' }
    ]});
    list({ eyebrow: 'Đồ uống · Cervezas', title: 'Beers', vn: 'Bia', items: [
      { n: 'Bia Sài Gòn', en: 'Vietnamese Saigon beer', p: '4,50 €' },
      { n: 'Moritz Cañita', en: '', p: '2,90 €' },
      { n: 'Moritz Caña', en: '', p: '3,50 €' },
      { n: 'Moritz 0%', en: 'sin alcohol', p: '3,50 €' },
      { n: 'Moritz Epidor', en: '', p: '3,50 €' },
      { n: 'Moritz Clara', en: '', p: '3,50 €' },
      { n: 'Bia Không Gluten', en: 'Gluten free beer', p: '3,50 €' }
    ]});

    /* ===== THỰC ĐƠN NẾM THỬ · SET MENU ===== */
    list({ anchor: 'menus', img: IMG + 'hero-tasting.png', eyebrow: 'Thực đơn nếm thử · Set menu', title: 'Menús Degustación', vn: 'Mín. 2 personas · por persona', items: [
      { n: 'Tasting Menu', en: '', p: '22,90 €', d: 'Chả giò · gỏi cuốn · ensalada de pollo · curry de pollo · phở de ternera' },
      { n: 'Tasting Menu Vegan', en: '', p: '22,90 €', t: ['VG'], d: 'Chả giò · gỏi cuốn · ensalada de tofu · curry vegano · phở vegano' },
      { n: 'Deluxe Tasting Menu', en: '', p: '29,90 €', d: 'Rollitos · phở de ternera · ensalada y curry de pollo · postre o café · bebidas' },
      { n: 'Deluxe Vegan Menu', en: '', p: '29,90 €', t: ['VG'], d: 'Rollitos · phở vegano · ensalada de tofu · curry vegano · postre · bebidas' }
    ]});

    /* ===== LA CASA ===== */
    story({ anchor: 'about', img: IMG + 'storefront.png', eyebrow: 'Nuestra historia', title: 'La Casa',
      paras: [
        'Un rincón cálido del Eixample donde se cocinan las recetas de familia: caldos a fuego lento, hierbas del mercado y el sabor honesto de la comida de calle de Hanoi y Huế.',
        'La cocina la lidera la familia fundadora, que llegó a Barcelona con un cuaderno de recetas y la idea de servir cada plato como en casa.'
      ] });
    hours({ anchor: 'hours', eyebrow: 'Visítanos', title: 'Horarios & contacto', hours: [
      { d: 'Lunes', h: 'Cerrado' },
      { d: 'Martes – Viernes', h: '13:00–16:00 · 20:00–23:30' },
      { d: 'Sábado – Domingo', h: '13:00–16:30 · 20:00–24:00' }
    ] });

    return P;
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
      ? '<div class="item-thumb"><img src="' + esc(it.img) + '" alt="' + esc(it.n) + '"></div>'
      : '';
    var en = it.en ? '<span class="item-en">' + esc(it.en) + '</span>' : '';
    var desc = it.d ? '<div class="item-desc">' + esc(it.d) + '</div>' : '';
    return '<div class="item">' + thumb +
      '<div class="item-main">' +
        '<div class="item-titles"><span class="item-name">' + esc(it.n) + '</span>' + en + tags + '</div>' +
        desc +
      '</div>' +
      '<span class="item-price">' + esc(it.p) + '</span>' +
    '</div>';
  }

  function bodyHTML(pg) {
    if (pg.type === 'title') {
      return '<div class="page-title">' +
        '<img src="' + IMG + 'logo.jpg" alt="Viet Kitchen">' +
        '<div class="eyebrow">La Carta</div>' +
        '<h2>Viet Kitchen</h2>' +
        '<p class="tag">Home of the secret Phở</p>' +
        '<svg width="46" height="25" viewBox="0 0 44 24" fill="none" aria-hidden="true"><path d="M22 4 L39 20 C30 16 14 16 5 20 Z" stroke="#B65A33" stroke-width="1.4" stroke-linejoin="round" fill="none"/></svg>' +
        '<div class="est">Est. Barcelona</div>' +
      '</div>';
    }
    if (pg.type === 'story') {
      var paras = pg.paras.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
      return '<div class="story"><div class="sec-eyebrow">' + esc(pg.eyebrow) + '</div>' +
        '<h2>' + esc(pg.title) + '</h2>' + paras + '</div>';
    }
    if (pg.type === 'hours') {
      var rows = pg.hours.map(function (hr) {
        return '<div class="hours-row"><span class="d">' + esc(hr.d) + '</span><span class="h">' + esc(hr.h) + '</span></div>';
      }).join('');
      return '<div class="hours"><div class="sec-eyebrow">' + esc(pg.eyebrow) + '</div>' +
        '<h2>' + esc(pg.title) + '</h2>' + rows +
        '<div class="hours-addr">Carrer d\'Aribau, Eixample<br>08011 Barcelona</div>' +
        '<div class="hours-contact">Reservas · 931 090 041<br>hola@vietkitchen.es · @vietkitchenbcn</div>' +
        '<button class="btn-cta about-res-btn open-res" type="button">Reservar una mesa&nbsp;→</button>' +
      '</div>';
    }
    /* list */
    var vn = pg.vn ? '<span class="vn">' + esc(pg.vn) + '</span>' : '';
    var head = (pg.eyebrow || pg.title)
      ? '<div class="sec-eyebrow">' + esc(pg.eyebrow) + '</div>' +
        '<div class="sec-head"><h2>' + esc(pg.title) + '</h2>' + vn + '</div>'
      : '';
    var items = pg.items.map(itemHTML).join('');
    var note = pg.note ? '<p class="page-note">' + esc(pg.note) + '</p>' : '';
    return head + items + note;
  }

  function faceInnerHTML(pg) {
    if (!pg) return '<div class="leaf-face-inner"></div>';
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
  var pages = buildPages();
  var leafCount = Math.ceil(pages.length / 2);

  /* anchor -> spread index (which leaf shows that section) */
  var anchorSpread = {};
  pages.forEach(function (pg, i) {
    if (!pg.anchor) return;
    anchorSpread[pg.anchor] = (i % 2 === 0) ? (i / 2) : ((i + 1) / 2);
  });

  var spread = 0;          // current open spread (0 .. leafCount-1)
  var activeLeaf = -1;     // leaf currently mid-flip (for z-index)
  var leafEls = [];        // built leaf DOM nodes

  var $ = function (sel) { return document.querySelector(sel); };
  var bookEl   = $('#book-el');
  var stageEl  = $('#vk-scroll');
  var scaleEl  = $('.scale-wrap');

  function isMobile() { return window.innerWidth < MOBILE_BP; }

  /* ----------------------------------------------------------
     Build the book DOM once. CSS flattens it on small screens.
     ---------------------------------------------------------- */
  function buildBook() {
    var html = '<div class="book-shadow"></div>' +
      '<div class="static-left">' +
        '<div class="static-left-inner">' +
          '<img src="' + IMG + 'logo.jpg" alt="Viet Kitchen">' +
          '<svg width="42" height="23" viewBox="0 0 44 24" fill="none" aria-hidden="true"><path d="M22 4 L39 20 C30 16 14 16 5 20 Z" stroke="#F29EBC" stroke-width="1.3" stroke-linejoin="round" fill="none" opacity="0.9"/></svg>' +
          '<div class="static-left-cap">Cocina vietnamita<br>Barcelona · Eixample</div>' +
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

  /* Footer counter + arrow disabled states. */
  /* Footer label for a spread: the title of whichever page on it has one. */
  function spreadLabel(i) {
    var fp = pages[2 * i], bp = pages[2 * i + 1];
    if (fp && fp.type === 'title') return 'La Carta';
    return (fp && fp.title) || (bp && bp.title) || '';
  }

  function updateChrome() {
    $('#spread-num').textContent = String(spread + 1).padStart(2, '0');
    $('#spread-label').textContent = spreadLabel(spread);
    $('#spread-total').textContent = '/ ' + String(leafCount).padStart(2, '0');
    $('#prev').disabled = spread <= 0;
    $('#next').disabled = spread >= leafCount - 1;
  }

  function render() {
    applyFlip();
    applyScale();
    updateChrome();
  }

  /* ----------------------------------------------------------
     Page turning + navigation.
     ---------------------------------------------------------- */
  function goNext() {
    if (spread < leafCount - 1) { activeLeaf = spread; spread++; render(); }
  }
  function goPrev() {
    if (spread > 0) { activeLeaf = spread - 1; spread--; render(); }
  }
  function navGo(cat) {
    if (isMobile()) {
      var el = document.getElementById(cat);
      if (el && stageEl) stageEl.scrollTop = Math.max(0, el.offsetTop - 12);
    } else if (anchorSpread[cat] != null) {
      activeLeaf = -1;
      spread = anchorSpread[cat];
      render();
    }
  }

  function buildNav() {
    var nav = $('#nav');
    nav.innerHTML = NAV.map(function (n) {
      return '<button type="button" data-cat="' + n.id + '">' + esc(n.label) + '</button>';
    }).join('');
    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-cat]');
      if (btn) navGo(btn.getAttribute('data-cat'));
    });
  }

  /* ----------------------------------------------------------
     Screen switching (cover <-> book).
     ---------------------------------------------------------- */
  function showBook() {
    $('#cover').hidden = true;
    $('#book').hidden = false;
    spread = 0; activeLeaf = -1;
    render();
  }
  function showCover() {
    $('#book').hidden = true;
    $('#cover').hidden = false;
  }

  /* ----------------------------------------------------------
     Reservation modal.
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
    /* Time chips */
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

    /* Party stepper */
    $('#party-inc').addEventListener('click', function () {
      res.party = Math.min(20, res.party + 1);
      $('#party-count').textContent = res.party;
    });
    $('#party-dec').addEventListener('click', function () {
      res.party = Math.max(1, res.party - 1);
      $('#party-count').textContent = res.party;
    });

    /* Text fields */
    $('#res-date').addEventListener('input', function (e) { res.date = e.target.value; refreshSubmit(); });
    $('#res-name').addEventListener('input', function (e) { res.name = e.target.value; refreshSubmit(); });

    /* Submit -> confirmation */
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

    /* Close on backdrop click (but not when clicking the card) */
    $('#res-modal').addEventListener('click', function (e) {
      if (e.target === this) closeRes();
    });
  }

  /* ----------------------------------------------------------
     Wire up + boot.
     ---------------------------------------------------------- */
  function init() {
    buildBook();
    buildNav();
    buildResModal();

    $('#open-menu').addEventListener('click', showBook);
    $('#to-cover').addEventListener('click', showCover);
    $('#next').addEventListener('click', goNext);
    $('#prev').addEventListener('click', goPrev);

    /* Any "open reservations" button (header, sticky, in-page) */
    document.addEventListener('click', function (e) {
      if (e.target.closest('.open-res')) openRes();
      if (e.target.closest('.close-res')) closeRes();
    });

    /* Keyboard: arrows turn pages, Esc closes the modal */
    document.addEventListener('keydown', function (e) {
      if (!$('#res-modal').hidden) {
        if (e.key === 'Escape') closeRes();
        return;
      }
      if ($('#book').hidden) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    });

    window.addEventListener('resize', function () { applyScale(); });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
