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
    { id: 'bebidas',   label: T('Bebidas', 'Drinks', 'Đồ uống') },
    { id: 'about',     label: T('La Casa', 'The House', 'Quán') }
  ];

  /* ----------------------------------------------------------
     Build the ordered list of pages from the menu content.
     Item shape: { name:T, desc:T, p, t:[tags], img }
     A section with more than 4 items spills onto extra pages.
     ---------------------------------------------------------- */
  function buildPages() {
    var P = [];
    var CAT = '';   /* current umbrella category (Entrantes, Platos principales, ...) */

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
          cat: o.cat != null ? o.cat : CAT,   /* category badge — shown on every page of the section */
          hero: useHero ? { img: o.img, pos: o.imgPos || 'center', h: '150px' } : null,
          anchor: first ? (o.anchor || '') : '',
          eyebrow: first ? (o.eyebrow || '') : '',
          title: o.title || '',
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
    story({ anchor: 'welcome', img: IMG + 'flatlay-pho.jpg',
      eyebrow: T('Bienvenidos', 'Welcome', 'Chào mừng'),
      title: T('El secreto del Phở', 'The secret of Phở', 'Bí mật của Phở'),
      paras: [
        T('Nuestro Phở legendario es más que un plato: es un secreto de familia transmitido durante generaciones, hoy conocido solo por dos personas en el mundo.',
          'Our legendary Phở is more than a dish: it is a family secret passed down for generations, today known to only two people in the world.',
          'Phở huyền thoại của chúng tôi không chỉ là một món ăn: đó là bí mật gia truyền qua nhiều thế hệ, nay chỉ hai người trên thế giới biết đến.'),
        T('Elaborado por Hoang con más de 6 horas de cocción y más de 30 ingredientes seleccionados. Un caldo profundo y auténtico, la razón por la que muchos dicen que servimos el mejor Phở de España.',
          'Made by Hoang with over 6 hours of simmering and more than 30 selected ingredients. A deep, authentic broth, the reason many say we serve the best Phở in Spain.',
          'Được nấu bởi Hoang với hơn 6 giờ ninh và hơn 30 nguyên liệu chọn lọc. Nước dùng đậm đà, đích thực, lý do nhiều người nói chúng tôi phục vụ Phở ngon nhất Tây Ban Nha.'),
        T('In Vietnamese food we trust.', 'In Vietnamese food we trust.', 'In Vietnamese food we trust.')
      ] });

    /* ===== SIDE DISH / Entrantes ===== */
    CAT = T('Entrantes', 'Starters', 'Khai vị');
    list({ anchor: 'entrantes', eyebrow: T('Para empezar', 'To start', 'Khai vị'), title: T('Rollitos', 'Rolls', 'Cuốn & Chiên'), items: [
      { name: T('Rollitos fritos de Hanói', 'Hanoi Fried Rolls', 'Nem Rán Hà Nội'), p: '8,50 €', img: IMG + 't-roll-fried.png', desc: T('Cerdo, judía mungo, champiñón, fideos de cristal', 'Pork, mung beans, mushroom, glass noodles', 'Thịt heo, giá đỗ, nấm, miến') },
      { name: T('Rollitos crujientes', 'Crispy Spring Rolls', 'Chả Giò'), p: '8,50 €', img: IMG + 't-roll-fried2.png', desc: T('Cerdo · judía mungo (vegano)', 'Pork · mung beans (vegan)', 'Thịt heo · giá đỗ (chay)') },
      { name: T('Rollitos frescos', 'Fresh Rolls', 'Gỏi Cuốn'), p: '7,90 €', t: ['GF'], img: IMG + 't-roll-fresh.png', desc: T('Cerdo & gamba · mango & gamba · tofu (vegano) · tofu & mango (vegano)', 'Pork & shrimp · mango & shrimp · tofu (vegan) · tofu & mango (vegan)', 'Thịt heo & tôm · xoài & tôm · đậu hũ (chay) · đậu hũ & xoài (chay)') },
      { name: T('Ensalada de papaya verde', 'Green Papaya Salad', 'Gỏi Đu Đủ'), p: '9,50 €', desc: T('Cerdo & gamba · mango & gamba · pollo · tofu (vegano)', 'Pork & shrimp · mango & shrimp · chicken · tofu (vegan)', 'Thịt heo & tôm · xoài & tôm · gà · đậu hũ (chay)') }
    ]});
    list({ img: IMG + 'hero-salads.png', eyebrow: T('Para compartir', 'To share', 'Món ăn kèm'), title: T('Para picar', 'To share', 'Món Ăn Kèm'), items: [
      { name: T('Crackers de gamba', 'Shrimp Puff', 'Phồng Tôm'), p: '4,50 €', desc: T('Crackers de gamba fritos', 'Deep-fried shrimp crackers', 'Bánh phồng tôm chiên') },
      { name: T('Rollitos agrios fritos', 'Fried Sour Rolls', 'Nem Chua Rán'), p: '8,50 €', desc: T('Cerdo fermentado, pan rallado', 'Fermented pork, breadcrumbs', 'Nem chua, vụn bánh mì') },
      { name: T('Pastel de pescado y arroz verde', 'Fish Cake & Green Rice', 'Chả Cá Cốm'), p: '8,50 €', desc: T('Pasta de pescado, copos de arroz glutinoso verde', 'Fish paste, green sticky rice flakes', 'Chả cá, cốm') },
      { name: T('Verduras salteadas', 'Stir-fried Vegetables', 'Rau Xào'), p: '7,90 €', t: ['V'], desc: T('Verduras de temporada, salsa de ostras', 'Seasonal vegetables, oyster sauce', 'Rau theo mùa, sốt hào') },
      { name: T('Arroz crujiente', 'Crispy Rice', 'Cơm Cháy'), p: '8,50 €', desc: T('Arroz seco, chà bông, aceite de cebolleta', 'Dried rice, pork floss, scallion oil', 'Cơm cháy, chà bông, mỡ hành') }
    ]});
    list({ anchor: 'grill', eyebrow: T('A la brasa', 'Grilled', 'Đồ nướng'), title: T('Grill', 'Grill', 'Món Nướng'), items: [
      { name: T('Brochetas a la brasa', 'Grilled Meat Skewers', 'Thịt Xiên Nướng'), p: '9,50 €', img: IMG + 't-grill-skewers.png', desc: T('Cerdo, citronela, ajo, miel, sésamo', 'Pork, lemongrass, garlic, honey, sesame', 'Thịt heo, sả, tỏi, mật ong, mè') },
      { name: T('Ternera a la brasa', 'Grilled Beef', 'Thịt Bò Nướng'), p: '9,50 €', img: IMG + 't-grill-combo.png', desc: T('Ternera, salsa de ostras, ajo, pimienta negra, citronela', 'Beef, oyster sauce, garlic, black pepper, lemongrass', 'Thịt bò, sốt hào, tỏi, tiêu đen, sả') },
      { name: T('Pollo a la brasa', 'Grilled Chicken', 'Thịt Gà Nướng'), p: '9,50 €', img: IMG + 't-grill-flame.png', desc: T('Pollo, miel, ajo, soja, cinco especias', 'Chicken, honey, garlic, soy, five-spice', 'Thịt gà, mật ong, tỏi, xì dầu, ngũ vị') },
      { name: T('Alitas de pollo fritas', 'Fried Chicken Wings', 'Cánh Gà Chiên'), p: '8,50 €', img: IMG + 't-grill-wings.png', desc: T('Alitas de pollo, nước mắm, ajo, miel', 'Chicken wings, fish sauce, garlic, honey', 'Cánh gà, nước mắm, tỏi, mật ong') },
      { name: T('Albóndigas de ternera', 'Beef Bouncy Meatballs', 'Bò Viên Chiên'), p: '8,50 €', img: IMG + 't-grill-meatballs.png', desc: T('Ternera picada, ajo, pimienta negra', 'Ground beef, garlic, black pepper', 'Bò viên, tỏi, tiêu đen') }
    ]});

    /* ===== MAIN DISH / Platos principales ===== */
    CAT = T('Platos principales', 'Main dishes', 'Món chính');
    list({ anchor: 'pho', img: IMG + 'hero-pho.png', eyebrow: T('Sopa de fideos', 'Noodle soup', 'Phở'), title: T('Phở', 'Phở', 'Phở'), items: [
      { name: 'What The Phở', p: '39,00 €', desc: T('Phở especial · para compartir', 'Special phở · for sharing', 'Phở đặc biệt · để chia sẻ') },
      { name: T('Phở de ternera', 'Beef Phở', 'Phở Bò'), p: '16,90 €', desc: T('Albóndiga de ternera casera +1,80 €', 'Homemade beef ball +1,80 €', 'Bò viên nhà làm +1,80 €') },
      { name: T('Phở de pollo', 'Chicken Phở', 'Phở Gà'), p: '14,90 €' },
      { name: T('Phở Heura (vegano)', 'Heura Phở (vegan)', 'Phở Heura'), p: '14,90 €', t: ['VG'] },
      { name: T('Phở vegano', 'Vegan Phở', 'Phở Chay'), p: '14,90 €', t: ['VG'], desc: T('Tofu y champiñones', 'Tofu & mushroom', 'Đậu hũ & nấm') }
    ]});
    list({ img: IMG + 'hero-bun.png', eyebrow: T('Bol de fideos', 'Noodle bowl', 'Bún'), title: T('Bún', 'Bún', 'Bún'), items: [
      { name: T('Bún Chả de Hanói', 'Hanoi Bún Chả', 'Bún Chả Hà Nội'), p: '16,90 €', desc: T('Cerdo a la brasa, fideos, hierbas, salsa para mojar', 'Grilled pork, vermicelli, herbs, dipping sauce', 'Thịt nướng, bún, rau thơm, nước chấm') },
      { name: T('Bún Bò Huế', 'Bún Bò Huế', 'Bún Bò Huế'), p: '16,90 €', t: ['✦'], desc: T('Ternera, salchicha de cerdo casera, citronela, caldo picante', 'Beef, homemade pork sausage, lemongrass, spicy broth', 'Thịt bò, chả heo nhà làm, sả, nước dùng cay') }
    ]});
    list({ img: IMG + 'hero-banhxeo.png', eyebrow: T('Crep vietnamita', 'Vietnamese pancake', 'Bánh xèo'), title: T('Bánh Xèo', 'Bánh Xèo', 'Bánh Xèo'),
      note: T('Con papel de arroz para enrollar · +2,00 €', 'With rice paper for wrapping · +2,00 €', 'Kèm bánh tráng cuốn · +2,00 €'), items: [
      { name: T('Bánh Xèo de cerdo y gambas', 'Pork & Shrimp Bánh Xèo', 'Bánh Xèo'), p: '16,90 €', desc: T('Crep de arroz y cúrcuma, brotes, hierbas', 'Rice & turmeric crepe, sprouts, herbs', 'Bánh xèo bột nghệ, giá, rau thơm') },
      { name: T('Bánh Xèo de pollo', 'Chicken Bánh Xèo', 'Bánh Xèo Gà'), p: '16,90 €' },
      { name: T('Bánh Xèo de ternera', 'Beef Bánh Xèo', 'Bánh Xèo Bò'), p: '16,90 €' },
      { name: T('Bánh Xèo vegano', 'Vegan Bánh Xèo', 'Bánh Xèo Chay'), p: '16,90 €', t: ['VG'], desc: T('Tofu y champiñones', 'Tofu & mushroom', 'Đậu hũ & nấm') }
    ]});
    list({ anchor: 'salteados', img: IMG + 'hero-wok.png', eyebrow: T('Salteado al wok', 'Stir-fried', 'Xào'), title: T('Fideos al wok', 'Wok Noodles', 'Phở Xào'), items: [
      { name: T('Phở salteado con ternera', 'Beef Wok Noodles', 'Phở Xào Bò'), p: '14,90 €', desc: T('Fideos salteados, ajo, cebolla, soja, ostras, cacahuete', 'Stir-fried noodles, garlic, onion, soy, oyster sauce, peanut', 'Phở xào, tỏi, hành, xì dầu, sốt hào, đậu phộng') },
      { name: T('Phở salteado con gambas', 'Shrimp Wok Noodles', 'Phở Xào Tôm'), p: '14,50 €' },
      { name: T('Phở salteado con pollo', 'Chicken Wok Noodles', 'Phở Xào Gà'), p: '14,50 €' },
      { name: T('Phở salteado con tofu', 'Tofu Wok Noodles', 'Phở Xào Đậu'), p: '14,50 €', t: ['VG'] },
      { name: T('Phở salteado con Heura', 'Heura Wok Noodles', 'Phở Xào Heura'), p: '14,90 €', t: ['VG'] }
    ]});
    list({ img: IMG + 'flatlay-curry.jpg', eyebrow: T('Bún trộn', 'Mixed noodles', 'Bún trộn'), title: T('Ensalada de fideos', 'Noodle Salad', 'Bún Trộn'), items: [
      { name: T('Bún con ternera', 'Beef Bún', 'Bún Bò'), p: '14,50 €', desc: T('Fideos, lechuga, pepino, zanahoria, hierbas, cacahuete, nước mắm', 'Vermicelli, lettuce, cucumber, carrot, herbs, peanut, fish sauce', 'Bún, xà lách, dưa leo, cà rốt, rau thơm, đậu phộng, nước mắm') },
      { name: T('Bún con tofu', 'Tofu Bún', 'Bún Đậu'), p: '14,50 €', t: ['VG'] },
      { name: T('Bún con Heura', 'Heura Bún', 'Bún Heura'), p: '14,50 €', t: ['VG'] }
    ]});
    list({ anchor: 'curry', eyebrow: T('Al coco', 'Coconut', 'Nước cốt dừa'), title: T('Curry', 'Curry', 'Cà Ri'), items: [
      { name: T('Curry de gambas', 'Shrimp Curry', 'Cà Ri Tôm'), p: '14,50 €', img: IMG + 't-curry-shrimp.png', desc: T('Leche de coco, patata, pasta de curry, especias', 'Coconut milk, potato, curry paste, spices', 'Nước cốt dừa, khoai tây, cà ri, gia vị') },
      { name: T('Curry de pollo', 'Chicken Curry', 'Cà Ri Gà'), p: '14,50 €', img: IMG + 't-curry-chicken.png' },
      { name: T('Curry de tofu', 'Tofu Curry', 'Cà Ri Đậu'), p: '14,50 €', t: ['VG'], img: IMG + 't-curry-tofu.png' },
      { name: T('Curry de Heura', 'Heura Curry', 'Cà Ri Heura'), p: '14,50 €', t: ['VG'], img: IMG + 't-curry-heura.png' }
    ]});
    list({ eyebrow: T('Agridulce', 'Sweet & sour', 'Chua ngọt'), title: T('Tamarindo', 'Tamarind Dream', 'Me Xào'),
      note: T('¡Intenso, ácido, inolvidable!', 'Bold, tangy, unforgettable!', 'Đậm đà, chua thanh, khó quên!'), items: [
      { name: T('Gambas al tamarindo', 'Tamarind Shrimp', 'Me Xào Tôm'), p: '14,50 €', img: IMG + 't-tam-shrimp.png', desc: T('Arroz, salsa de tamarindo, hierbas, especias', 'Rice, tamarind sauce, herbs, spices', 'Cơm, sốt me, rau thơm, gia vị') },
      { name: T('Ternera al tamarindo', 'Tamarind Beef', 'Me Xào Bò'), p: '14,50 €', img: IMG + 't-tam-beef.png' },
      { name: T('Tofu al tamarindo', 'Tamarind Tofu', 'Me Xào Đậu'), p: '14,50 €', t: ['VG'], img: IMG + 't-tam-tofu.png' },
      { name: T('Heura al tamarindo', 'Tamarind Heura', 'Me Xào Heura'), p: '14,50 €', t: ['VG'], img: IMG + 't-tam-heura.png' }
    ]});
    list({ anchor: 'arroz', eyebrow: T('Con arroz', 'With rice', 'Cơm'), title: T('Platos de Arroz', 'Rice Dishes', 'Cơm'), items: [
      { name: T('Merluza en salsa de tomate', 'Hake in Tomato Sauce', 'Cá Sốt Cà'), p: '14,50 €', img: IMG + 't-rice-hake.png', desc: T('Filetes de merluza, salsa de tomate, arroz', 'Hake fillets, tomato sauce, rice', 'Cá, sốt cà chua, cơm') },
      { name: T('Costillas caramelizadas', 'Caramelized Pork Ribs', 'Sườn Ram Mặn'), p: '14,50 €', img: IMG + 't-rice-ribs.png', desc: T('Costillas de cerdo, salsa de caramelo, arroz', 'Pork ribs, caramel sauce, rice', 'Sườn heo, nước màu, cơm') },
      { name: T('Pollo a la citronela', 'Chicken Lemongrass', 'Gà Kho Sả'), p: '14,50 €', img: IMG + 't-rice-chicken.png', desc: T('Pollo, citronela, chili, arroz', 'Chicken, lemongrass, chilli, rice', 'Gà, sả, ớt, cơm') },
      { name: T('Cerdo estofado', 'Pork Stew', 'Thịt Kho Tàu'), p: '14,50 €', img: IMG + 't-rice-stew.png', desc: T('Panceta, huevo cocido, agua de coco, arroz', 'Pork belly, boiled egg, coconut water, rice', 'Thịt ba chỉ, trứng, nước dừa, cơm') }
    ]});
    list({ img: IMG + 'hero-friedrice.png', eyebrow: T('Arroz frito', 'Fried rice', 'Cơm rang'), title: T('Arroz Frito', 'Fried Rice', 'Cơm Rang'), items: [
      { name: T('Arroz frito con ternera', 'Beef Fried Rice', 'Cơm Rang Bò'), p: '13,90 €' },
      { name: T('Arroz frito con pollo', 'Chicken Fried Rice', 'Cơm Rang Gà'), p: '13,90 €' },
      { name: T('Arroz frito con gambas', 'Shrimp Fried Rice', 'Cơm Rang Tôm'), p: '13,90 €' },
      { name: T('Arroz blanco', 'Steamed Rice', 'Cơm Trắng'), p: '3,50 €' }
    ]});

    /* ===== DESSERT / Postres ===== */
    CAT = T('Postres', 'Desserts', 'Tráng miệng');
    list({ anchor: 'postres', img: IMG + 'hero-desserts.png', eyebrow: T('Dulces', 'Sweets', 'Món ngọt'), title: T('Postres', 'Desserts', 'Tráng Miệng'), items: [
      { name: T('Helado de pandan', 'Pandan Ice Cream', 'Kem Lá Dứa'), p: '5,90 €', desc: T('Especialidad de Viet Kitchen', "Viet Kitchen's special", 'Đặc biệt của Viet Kitchen') },
      { name: T('Panna cotta tropical', 'Tropical Panna Cotta', 'Panna Cotta Nhiệt Đới'), p: '4,90 €' },
      { name: T('Yogur con arroz negro', 'Yogurt & Black Rice', 'Sữa Chua Nếp Cẩm'), p: '5,90 €' },
      { name: T('Panna cotta de almendra', 'Almond Panna Cotta', 'Chè Khúc Bạch'), p: '6,90 €' },
      { name: T('Pudín de plátano', 'Banana Pudding', 'Chè Chuối'), p: '5,90 €' },
      { name: T('Brownie de chocolate', 'Chocolate Brownie', 'Sô Cô La Brownie'), p: '5,90 €' }
    ]});

    /* ===== DRINKS / Bebidas ===== */
    CAT = T('Bebidas', 'Drinks', 'Đồ uống');
    list({ anchor: 'bebidas', img: IMG + 'hero-drinks.png', eyebrow: T('Caseras', 'Homemade', 'Tự pha'), title: T('Bebidas de la Casa', 'House Drinks', 'Pha Chế'), items: [
      { name: T('Té helado de citronela', 'Lemongrass Iced Tea', 'Trà Đá Sả'), p: '5,90 €' },
      { name: T('Limonada de piña y menta', 'Mint Pineapple Lemonade', 'Nước Chanh Dứa Bạc Hà'), p: '5,90 €' },
      { name: T('Limonada con jengibre', 'Ginger Lemonade', 'Nước Chanh Gừng'), p: '5,90 €' },
      { name: T('Ginger beer con limón', 'Ginger Beer Lemonade', 'Bia Gừng Chanh'), p: '5,90 €', desc: T('Sin alcohol', 'Non-alcoholic', 'Không cồn') },
      { name: T('Café helado vietnamita', 'Vietnamese Iced Coffee', 'Cà Phê Đá'), p: '5,90 €', desc: T('Con leche condensada', 'With condensed milk', 'Với sữa đặc') },
      { name: T('Café con huevo', 'Egg Coffee', 'Cà Phê Trứng'), p: '7,90 €' }
    ]});
    list({ eyebrow: T('Infusiones', 'Tea', 'Trà'), title: T('Tés', 'Tea', 'Trà'), items: [
      { name: T('Tetera', 'Teapot', 'Bình Trà'), p: '7,90 €', desc: T('Oolong / Jazmín / Pu-erh · para 2-4 personas', 'Oolong / Jasmine / Pu-erh · for 2-4 people', 'Ô long / Lài / Phổ nhĩ · cho 2-4 người') },
      { name: T('Té de jazmín', 'Jasmine Tea', 'Trà Lài'), p: '3,50 €' },
      { name: T('Té verde', 'Green Tea', 'Trà Xanh'), p: '3,50 €' },
      { name: T('Té de jengibre fresco', 'Fresh Ginger Tea', 'Trà Gừng'), p: '3,50 €' },
      { name: T('Manzanilla', 'Camomile Tea', 'Trà Cúc'), p: '3,50 €' },
      { name: T('Té chai', 'Chai Tea', 'Trà Chai'), p: '3,50 €' },
      { name: T('Té de menta fresca', 'Fresh Mint Tea', 'Trà Bạc Hà'), p: '3,50 €' }
    ]});
    list({ eyebrow: T('Café', 'Coffee', 'Cà phê'), title: T('Cafés', 'Coffee', 'Cà Phê'), items: [
      { name: T('Café con leche', 'Coffee with Milk', 'Cà Phê Sữa'), p: '2,90 €' },
      { name: 'Espresso', p: '1,90 €' },
      { name: 'Cortado', p: '2,50 €', desc: T('+ leche de coco 0,60 €', '+ coconut milk 0,60 €', '+ sữa dừa 0,60 €') },
      { name: 'Americano', p: '2,90 €' }
    ]});
    list({ eyebrow: T('Sin alcohol', 'Soft', 'Giải khát'), title: T('Refrescos', 'Soft Drinks', 'Nước Ngọt'), items: [
      { name: 'Coca-Cola / Zero / Fanta / Sprite / Nestea', p: '2,90 €' },
      { name: T('Tónica', 'Tonic Water', 'Nước Tonic'), p: '3,30 €' },
      { name: T('Ginger beer', 'Ginger Beer', 'Bia Gừng'), p: '3,30 €' },
      { name: T('Agua con gas', 'Sparkling Water', 'Nước Có Ga'), p: '2,90 €' },
      { name: T('Agua mineral', 'Still Mineral Water', 'Nước Khoáng'), p: '2,50 €' }
    ]});
    list({ eyebrow: T('Cervezas', 'Beers', 'Bia'), title: T('Cervezas', 'Beers', 'Bia'), items: [
      { name: T('Cerveza Saigon', 'Saigon Beer', 'Bia Sài Gòn'), p: '4,50 €' },
      { name: 'Moritz Cañita', p: '2,90 €' },
      { name: 'Moritz Caña', p: '3,50 €' },
      { name: 'Moritz 0%', p: '3,50 €', desc: T('Sin alcohol', 'Non-alcoholic', 'Không cồn') },
      { name: 'Moritz Epidor', p: '3,50 €' },
      { name: 'Moritz Clara', p: '3,50 €' },
      { name: T('Cerveza sin gluten', 'Gluten Free Beer', 'Bia Không Gluten'), p: '3,50 €' }
    ]});

    /* ===== SET MENU / Menús ===== */
    CAT = T('Menús', 'Set menus', 'Thực đơn');
    list({ anchor: 'menus', img: IMG + 'hero-tasting.png', eyebrow: T('Mín. 2 personas · por persona', 'Min. 2 people · per person', 'Tối thiểu 2 người · mỗi người'), title: T('Menús Degustación', 'Tasting Menus', 'Thực Đơn Nếm Thử'), items: [
      { name: T('Menú Degustación', 'Tasting Menu', 'Thực Đơn Nếm Thử'), p: '22,90 €', desc: T('Rollito frito · rollito fresco · ensalada de pollo · curry de pollo · phở de ternera', 'Fried roll · fresh roll · chicken salad · chicken curry · beef phở', 'Chả giò · gỏi cuốn · gỏi gà · cà ri gà · phở bò') },
      { name: T('Menú Degustación Vegano', 'Vegan Tasting Menu', 'Thực Đơn Nếm Thử Chay'), p: '22,90 €', t: ['VG'], desc: T('Rollito frito · rollito fresco · ensalada de tofu · curry vegano · phở vegano', 'Fried roll · fresh roll · tofu salad · veg curry · veg phở', 'Chả giò · gỏi cuốn · gỏi đậu hũ · cà ri chay · phở chay') },
      { name: T('Menú Deluxe', 'Deluxe Tasting Menu', 'Thực Đơn Deluxe'), p: '29,90 €', desc: T('Rollitos · phở de ternera · ensalada y curry de pollo · postre o café · bebidas', 'Rolls · beef phở · chicken salad & curry · dessert or coffee · drinks', 'Cuốn · phở bò · gỏi & cà ri gà · tráng miệng hoặc cà phê · đồ uống') },
      { name: T('Menú Deluxe Vegano', 'Deluxe Vegan Menu', 'Thực Đơn Deluxe Chay'), p: '29,90 €', t: ['VG'], desc: T('Rollitos · phở vegano · ensalada de tofu · curry vegano · postre · bebidas', 'Rolls · veg phở · tofu salad · veg curry · dessert · drinks', 'Cuốn · phở chay · gỏi đậu hũ · cà ri chay · tráng miệng · đồ uống') }
    ]});

    /* ===== LA CASA ===== */
    story({ anchor: 'about', img: IMG + 'storefront.png', eyebrow: T('Nuestra historia', 'Our story', 'Câu chuyện'), title: T('La Casa', 'The House', 'Quán'),
      paras: [
        T('Un rincón cálido del Eixample donde se cocinan las recetas de familia: caldos a fuego lento, hierbas del mercado y el sabor honesto de la comida de calle de Hanoi y Huế.',
          'A warm corner of the Eixample where family recipes are cooked: slow-simmered broths, market herbs and the honest flavour of the street food of Hanoi and Huế.',
          'Một góc ấm áp của Eixample nơi nấu những công thức gia đình: nước dùng ninh chậm, rau thơm chợ phiên và hương vị mộc mạc của ẩm thực đường phố Hà Nội và Huế.'),
        T('La cocina la lidera la familia fundadora, que llegó a Barcelona con un cuaderno de recetas y la idea de servir cada plato como en casa.',
          'The kitchen is led by the founding family, who arrived in Barcelona with a notebook of recipes and the idea of serving every dish like at home.',
          'Bếp do gia đình sáng lập dẫn dắt, những người đến Barcelona với cuốn sổ công thức và mong muốn phục vụ mỗi món như ở nhà.')
      ] });
    hours({ anchor: 'hours', eyebrow: T('Visítanos', 'Visit us', 'Ghé thăm'), title: T('Horarios & contacto', 'Hours & contact', 'Giờ mở cửa & liên hệ'), hours: [
      { d: T('Lunes', 'Monday', 'Thứ Hai'), h: T('Cerrado', 'Closed', 'Đóng cửa') },
      { d: T('Martes – Viernes', 'Tuesday – Friday', 'Thứ Ba – Thứ Sáu'), h: '13:00–16:00 · 20:00–23:30' },
      { d: T('Sábado – Domingo', 'Saturday – Sunday', 'Thứ Bảy – Chủ Nhật'), h: '13:00–16:30 · 20:00–24:00' }
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
  var pages, leafCount, anchorSpread;
  var spread = 0;          // current open spread (0 .. leafCount-1)
  var activeLeaf = -1;     // leaf currently mid-flip (for z-index)
  var leafEls = [];        // built leaf DOM nodes

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var bookEl, stageEl, scaleEl;

  function isMobile() { return window.innerWidth < MOBILE_BP; }

  /* Recompute pages + anchor map (called on language change). */
  function rebuildData() {
    pages = buildPages();
    leafCount = Math.ceil(pages.length / 2);
    anchorSpread = {};
    pages.forEach(function (pg, i) {
      if (!pg.anchor) return;
      anchorSpread[pg.anchor] = (i % 2 === 0) ? (i / 2) : ((i + 1) / 2);
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

  /* Footer label for a spread: the title of whichever page on it has one. */
  function spreadLabel(i) {
    var fp = pages[2 * i], bp = pages[2 * i + 1];
    if (fp && fp.type === 'title') return tx(I18N.titleEyebrow);
    return tx((fp && fp.title) || (bp && bp.title) || '');
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
      return '<button type="button" data-cat="' + n.id + '">' + esc(tx(n.label)) + '</button>';
    }).join('');
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
    buildBook();
    render();
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
    stageEl = $('#vk-scroll');
    scaleEl = $('.scale-wrap');

    mountSwitchers();
    rebuildData();
    applyStatic();
    buildNav();
    buildBook();
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

    window.addEventListener('resize', function () { applyScale(); });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
