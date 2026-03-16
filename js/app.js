
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const storage = {
    getCart() {
      try { return JSON.parse(localStorage.getItem("ticketoride_cart")) || null; } catch { return null; }
    },
    setCart(cart) {
      localStorage.setItem("ticketoride_cart", JSON.stringify(cart));
    },
    getOrders() {
      try { return JSON.parse(localStorage.getItem("ticketoride_orders")) || []; } catch { return []; }
    },
    setOrders(orders) {
      localStorage.setItem("ticketoride_orders", JSON.stringify(orders));
    }
  };

  function formatMXN(n) {
    return `$${Number(n || 0).toLocaleString("es-MX")} MXN`;
  }

  function slugParam() {
    const params = new URLSearchParams(window.location.search);
    return params.get("slug");
  }

  function getCoverClass(slug) {
    const map = {
      "festival-live-night-2026": "cover-live-night",
      "electro-wave-tour": "cover-electro-wave",
      "sunset-beats": "cover-sunset-beats"
    };
    return map[slug] || "cover-live-night";
  }

  function buildEventCard(event) {
    return `
      <article class="event-card">
        <div class="event-cover ${event.coverClass || getCoverClass(event.slug)}">
          <span class="pill">${event.category}</span>
        </div>
        <div class="event-card-body">
          <div class="eyebrow-row">
            <span>${event.dateLabel}</span>
            <span>${event.time}</span>
          </div>
          <h3>${event.title}</h3>
          <p>${event.city} · ${event.venue}</p>
          <p class="muted">${event.summary}</p>
          <div class="card-bottom">
            <strong>${formatMXN(event.startingPrice)}</strong>
            <a class="text-link" href="evento.html?slug=${event.slug}">Ver evento</a>
          </div>
        </div>
      </article>
    `;
  }

  async function renderHome() {
    const events = await window.TicketorideBridge.getEvents();
    const grid = $("#homeEventGrid");
    if (grid) {
      grid.innerHTML = events.slice(0, 3).map(buildEventCard).join("");
    }
    const featured = events[0];
    const hero = $("#heroFeatured");
    if (hero && featured) {
      hero.innerHTML = `
        <div class="hero-ticket ${featured.coverClass}">
          <div class="hero-ticket-top">
            <span class="pill">${featured.heroTag}</span>
            <span class="pill pill-soft">${featured.status}</span>
          </div>
          <h2>${featured.title}</h2>
          <p>${featured.city} · ${featured.venue}</p>
          <div class="hero-ticket-meta">
            <span>${featured.dateLabel}</span>
            <span>${featured.time}</span>
            <span>Desde ${formatMXN(featured.startingPrice)}</span>
          </div>
          <div class="hero-ticket-actions">
            <a class="btn btn-primary" href="evento.html?slug=${featured.slug}">Comprar boletos</a>
            <a class="btn btn-ghost" href="scanner.html">Ver scanner</a>
          </div>
        </div>
      `;
    }
  }

  async function renderEventsPage() {
    const events = await window.TicketorideBridge.getEvents();
    const grid = $("#eventsGrid");
    const category = $("#filterCategory");
    const search = $("#filterSearch");

    function paint() {
      let filtered = [...events];
      const term = (search?.value || "").trim().toLowerCase();
      const cat = category?.value || "all";
      if (cat !== "all") filtered = filtered.filter(e => e.category.toLowerCase() === cat.toLowerCase());
      if (term) filtered = filtered.filter(e =>
        [e.title, e.city, e.venue, e.category].join(" ").toLowerCase().includes(term)
      );
      grid.innerHTML = filtered.length
        ? filtered.map(buildEventCard).join("")
        : `<div class="empty-state"><h3>Sin resultados</h3><p>Prueba otro filtro o palabra clave.</p></div>`;
      $("#eventsCount").textContent = `${filtered.length} evento(s)`;
    }

    if (grid) {
      paint();
      category?.addEventListener("change", paint);
      search?.addEventListener("input", paint);
    }
  }

  async function renderEventPage() {
    const slug = slugParam();
    const event = await window.TicketorideBridge.getEventBySlug(slug);
    if (!event) return;

    const titleNodes = $$(".event-title");
    titleNodes.forEach(n => n.textContent = event.title);
    const cityNodes = $$(".event-city");
    cityNodes.forEach(n => n.textContent = `${event.city} · ${event.venue}`);
    const summaryNodes = $$(".event-summary");
    summaryNodes.forEach(n => n.textContent = event.description);
    const startPriceNodes = $$(".event-starting-price");
    startPriceNodes.forEach(n => n.textContent = formatMXN(event.startingPrice));
    const dateNodes = $$(".event-date-label");
    dateNodes.forEach(n => n.textContent = event.dateLabel);
    const timeNodes = $$(".event-time-label");
    timeNodes.forEach(n => n.textContent = event.time);
    const heroPanel = $("#eventHeroPanel");
    if (heroPanel) heroPanel.className = `event-hero-panel ${event.coverClass}`;

    const zonesGrid = $("#zonesGrid");
    if (zonesGrid) {
      zonesGrid.innerHTML = event.zones.map((z, idx) => `
        <article class="zone-card ${idx === 1 ? 'zone-card-featured' : ''}">
          <span class="zone-name">${z.name}</span>
          <strong>${formatMXN(z.price)}</strong>
          <p>${z.desc}</p>
          <button class="btn ${idx === 1 ? 'btn-primary' : 'btn-secondary'} zone-select" data-zone="${z.id}" data-price="${z.price}" data-name="${z.name}">
            Seleccionar ${z.name}
          </button>
        </article>
      `).join("");
    }

    const faq = $("#faqGrid");
    if (faq) {
      faq.innerHTML = event.faqs.map(([q,a]) => `
        <div class="faq-card">
          <h3>${q}</h3>
          <p>${a}</p>
        </div>
      `).join("");
    }

    const summaryCard = $("#eventQuickBuy");
    if (summaryCard) {
      summaryCard.innerHTML = `
        <div class="quick-buy-head">
          <span class="small-tag">${event.status}</span>
          <strong>Desde ${formatMXN(event.startingPrice)}</strong>
        </div>
        <div class="quick-buy-lines">
          <div><span>Fecha</span><strong>${event.dateLabel}</strong></div>
          <div><span>Hora</span><strong>${event.time}</strong></div>
          <div><span>Sede</span><strong>${event.venue}</strong></div>
        </div>
        <div class="quick-buy-actions">
          <button class="btn btn-primary full buy-default">Comprar general</button>
          <a class="btn btn-secondary full" href="#zonas">Elegir otra zona</a>
        </div>
      `;
      $(".buy-default", summaryCard)?.addEventListener("click", () => {
        const z = event.zones[0];
        saveCartAndGo(event, z, 1);
      });
    }

    const venueMap = $("#venueMap");
    if (venueMap) {
      venueMap.innerHTML = `
        <div class="stage">ESCENARIO</div>
        <div class="map-row">
          <button class="map-zone zone-select" data-zone="vip" data-price="${event.zones[2]?.price || event.zones[0].price}" data-name="${event.zones[2]?.name || 'VIP'}">VIP</button>
        </div>
        <div class="map-row">
          <button class="map-zone zone-select" data-zone="preferente" data-price="${event.zones[1]?.price || event.zones[0].price}" data-name="${event.zones[1]?.name || 'Preferente'}">PREFERENTE</button>
        </div>
        <div class="map-row">
          <button class="map-zone zone-select" data-zone="general" data-price="${event.zones[0]?.price}" data-name="${event.zones[0]?.name || 'General'}">GENERAL</button>
        </div>
      `;
    }

    $$(".zone-select").forEach(btn => {
      btn.addEventListener("click", () => {
        const zone = {
          id: btn.dataset.zone,
          name: btn.dataset.name,
          price: Number(btn.dataset.price)
        };
        saveCartAndGo(event, zone, 1);
      });
    });
  }

  function saveCartAndGo(event, zone, qty) {
    storage.setCart({
      eventId: event.id,
      slug: event.slug,
      title: event.title,
      city: event.city,
      venue: event.venue,
      dateLabel: event.dateLabel,
      time: event.time,
      zone,
      qty,
      subtotal: zone.price * qty
    });
    window.location.href = "checkout.html";
  }

  function makeOrderCode() {
    const ts = Date.now().toString().slice(-6);
    const rand = Math.floor(Math.random() * 900 + 100);
    return `TTR-${ts}-${rand}`;
  }

  function paintCheckout() {
    const cart = storage.getCart();
    const box = $("#checkoutBox");
    if (!box) return;
    if (!cart) {
      box.innerHTML = `<div class="empty-state"><h3>No hay selección activa</h3><p>Primero elige un evento y una zona.</p><a class="btn btn-primary" href="eventos.html">Ir a eventos</a></div>`;
      return;
    }

    box.innerHTML = `
      <div class="checkout-layout">
        <section class="checkout-form-card">
          <h2>Datos del comprador</h2>
          <div class="field-grid">
            <label><span>Nombre completo</span><input id="buyerName" type="text" placeholder="Nombre del comprador" /></label>
            <label><span>Correo</span><input id="buyerEmail" type="email" placeholder="correo@ejemplo.com" /></label>
            <label><span>Teléfono</span><input id="buyerPhone" type="tel" placeholder="444 000 0000" /></label>
            <label><span>Cantidad</span><input id="buyerQty" type="number" min="1" max="8" value="${cart.qty}" /></label>
          </div>
          <div class="field-grid single">
            <label><span>Cupón</span>
              <div class="coupon-row">
                <input id="promoCode" type="text" placeholder="Ejemplo: PROMO10" />
                <button type="button" id="applyPromo" class="btn btn-secondary">Aplicar</button>
              </div>
            </label>
            <p class="hint">Cupones demo: <strong>PROMO10</strong> o <strong>VIP15</strong>.</p>
          </div>
          <div class="checkout-actions">
            <a class="btn btn-secondary" href="evento.html?slug=${cart.slug}">Volver al evento</a>
            <button class="btn btn-primary" id="confirmPurchase">Confirmar compra</button>
          </div>
        </section>

        <aside class="summary-card">
          <h3>Resumen</h3>
          <div class="summary-line"><span>Evento</span><strong>${cart.title}</strong></div>
          <div class="summary-line"><span>Sede</span><strong>${cart.city}</strong></div>
          <div class="summary-line"><span>Zona</span><strong id="sumZone">${cart.zone.name}</strong></div>
          <div class="summary-line"><span>Precio unitario</span><strong id="sumPrice">${formatMXN(cart.zone.price)}</strong></div>
          <div class="summary-line"><span>Cantidad</span><strong id="sumQty">${cart.qty}</strong></div>
          <div class="summary-line"><span>Descuento</span><strong id="sumDiscount">${formatMXN(0)}</strong></div>
          <div class="summary-total"><span>Total</span><strong id="sumTotal">${formatMXN(cart.subtotal)}</strong></div>
          <div class="payment-badges">
            <span>Checkout visual</span>
            <span>Preparado para Woo</span>
            <span>QR posterior</span>
          </div>
        </aside>
      </div>
    `;

    let discount = 0;
    const qtyInput = $("#buyerQty");
    const sumQty = $("#sumQty");
    const sumDiscount = $("#sumDiscount");
    const sumTotal = $("#sumTotal");

    function updateSummary() {
      const qty = Math.max(1, Math.min(8, Number(qtyInput.value || 1)));
      qtyInput.value = qty;
      cart.qty = qty;
      cart.subtotal = cart.zone.price * qty;
      sumQty.textContent = qty;
      sumDiscount.textContent = formatMXN(discount);
      sumTotal.textContent = formatMXN(Math.max(0, cart.subtotal - discount));
      storage.setCart(cart);
    }

    qtyInput.addEventListener("input", updateSummary);
    $("#applyPromo").addEventListener("click", () => {
      const code = ($("#promoCode").value || "").trim().toUpperCase();
      if (code === "PROMO10") discount = Math.round(cart.zone.price * Number(cart.qty) * 0.10);
      else if (code === "VIP15" && cart.zone.name.toLowerCase() === "vip") discount = Math.round(cart.zone.price * Number(cart.qty) * 0.15);
      else discount = 0;
      updateSummary();
    });

    $("#confirmPurchase").addEventListener("click", async () => {
      const buyer = {
        name: ($("#buyerName").value || "").trim(),
        email: ($("#buyerEmail").value || "").trim(),
        phone: ($("#buyerPhone").value || "").trim()
      };
      if (!buyer.name || !buyer.email) {
        alert("Captura al menos nombre y correo.");
        return;
      }
      const qty = Number(qtyInput.value || 1);
      const total = Math.max(0, cart.zone.price * qty - discount);
      const order = {
        code: makeOrderCode(),
        eventSlug: cart.slug,
        title: cart.title,
        city: cart.city,
        venue: cart.venue,
        dateLabel: cart.dateLabel,
        time: cart.time,
        zone: cart.zone.name,
        unitPrice: cart.zone.price,
        qty,
        discount,
        total,
        buyer,
        status: "Pagado",
        scanStatus: "Pendiente",
        purchasedAt: new Date().toLocaleString("es-MX")
      };
      await window.TicketorideBridge.checkout(order);
      const orders = storage.getOrders();
      orders.unshift(order);
      storage.setOrders(orders);
      localStorage.removeItem("ticketoride_cart");
      window.location.href = "mis-boletos.html?order=" + encodeURIComponent(order.code);
    });

    updateSummary();
  }

  function pseudoQR(canvas, seed) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const cells = 25;
    const cell = size / cells;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,size,size);
    let hash = 0;
    for (let i=0;i<seed.length;i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    function bit(x,y) {
      const n = Math.abs(Math.sin(hash + x * 13.13 + y * 7.77) * 10000);
      return Math.floor(n) % 2 === 0;
    }
    const markers = [[0,0],[cells-7,0],[0,cells-7]];
    markers.forEach(([mx,my]) => {
      ctx.fillStyle="#000";
      ctx.fillRect(mx*cell,my*cell,7*cell,7*cell);
      ctx.fillStyle="#fff";
      ctx.fillRect((mx+1)*cell,(my+1)*cell,5*cell,5*cell);
      ctx.fillStyle="#000";
      ctx.fillRect((mx+2)*cell,(my+2)*cell,3*cell,3*cell);
    });
    for (let y=0;y<cells;y++){
      for(let x=0;x<cells;x++){
        const inMarker = markers.some(([mx,my])=>x>=mx&&x<mx+7&&y>=my&&y<my+7);
        if (inMarker) continue;
        if (bit(x,y)) {
          ctx.fillStyle="#000";
          ctx.fillRect(Math.floor(x*cell),Math.floor(y*cell),Math.ceil(cell),Math.ceil(cell));
        }
      }
    }
  }

  function paintTickets() {
    const wrap = $("#ticketsWrap");
    if (!wrap) return;
    const orders = storage.getOrders();
    const focus = new URLSearchParams(location.search).get("order");
    const title = $("#ticketsTitle");
    if (focus && title) title.textContent = `Compra realizada: ${focus}`;

    if (!orders.length) {
      wrap.innerHTML = `<div class="empty-state"><h3>Aún no tienes boletos</h3><p>Haz una compra demo desde el checkout para visualizar tu cartera digital.</p><a class="btn btn-primary" href="eventos.html">Comprar boletos</a></div>`;
      return;
    }

    wrap.innerHTML = orders.map((o, idx) => `
      <article class="ticket-wallet-card ${focus === o.code ? 'highlight' : ''}">
        <div class="ticket-main">
          <div>
            <span class="small-tag">${o.status}</span>
            <h3>${o.title}</h3>
            <p>${o.city} · ${o.venue}</p>
            <div class="ticket-info-grid">
              <div><span>Código</span><strong>${o.code}</strong></div>
              <div><span>Zona</span><strong>${o.zone}</strong></div>
              <div><span>Cantidad</span><strong>${o.qty}</strong></div>
              <div><span>Total</span><strong>${formatMXN(o.total)}</strong></div>
            </div>
          </div>
          <canvas width="180" height="180" class="qr-canvas" data-seed="${o.code}"></canvas>
        </div>
        <div class="ticket-foot">
          <span>Comprado: ${o.purchasedAt}</span>
          <span>Estado de acceso: ${o.scanStatus}</span>
        </div>
      </article>
    `).join("");

    $$(".qr-canvas").forEach(c => pseudoQR(c, c.dataset.seed || "TTR"));
  }

  function paintScanner() {
    const orders = storage.getOrders();
    const select = $("#scannerSelect");
    const result = $("#scannerResult");
    if (!select || !result) return;

    const baseOptions = `<option value="">Selecciona un boleto</option>`;
    select.innerHTML = baseOptions + orders.map(o => `<option value="${o.code}">${o.code} · ${o.title}</option>`).join("");

    function validate(code) {
      const order = orders.find(o => o.code === code.trim());
      if (!order) {
        result.innerHTML = `<div class="scan-result danger"><h3>Boleto no encontrado</h3><p>Verifica el código o integra validación real desde WordPress/QR backend.</p></div>`;
        return;
      }
      const alreadyUsed = order.scanStatus === "Ingresado";
      if (alreadyUsed) {
        result.innerHTML = `<div class="scan-result warn"><h3>QR ya utilizado</h3><p>${order.code} ya fue marcado como ingresado.</p></div>`;
        return;
      }
      order.scanStatus = "Ingresado";
      const updated = storage.getOrders().map(o => o.code === order.code ? order : o);
      storage.setOrders(updated);
      result.innerHTML = `<div class="scan-result ok"><h3>Acceso autorizado</h3><p>${order.buyer.name} · ${order.title} · ${order.zone}</p></div>`;
      paintPanel();
    }

    $("#scannerValidate").addEventListener("click", () => {
      const manual = ($("#scannerInput").value || "").trim();
      const selected = select.value;
      validate(manual || selected);
    });
  }

  function paintPanel() {
    const wrap = $("#panelWrap");
    if (!wrap) return;
    const orders = storage.getOrders();
    const totalVentas = orders.reduce((s,o)=>s+Number(o.total || 0),0);
    const totalBoletos = orders.reduce((s,o)=>s+Number(o.qty || 0),0);
    const escaneados = orders.filter(o=>o.scanStatus === "Ingresado").reduce((s,o)=>s+Number(o.qty || 0),0);
    const pendientes = totalBoletos - escaneados;

    wrap.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><span>Ventas acumuladas</span><strong>${formatMXN(totalVentas)}</strong></div>
        <div class="kpi-card"><span>Boletos emitidos</span><strong>${totalBoletos}</strong></div>
        <div class="kpi-card"><span>Ingresados</span><strong>${escaneados}</strong></div>
        <div class="kpi-card"><span>Pendientes</span><strong>${pendientes}</strong></div>
      </div>
      <div class="table-card">
        <div class="table-head">
          <h3>Órdenes recientes</h3>
          <a class="text-link" href="mis-boletos.html">Ver cartera</a>
        </div>
        <div class="simple-table">
          <div class="simple-row head"><span>Código</span><span>Cliente</span><span>Evento</span><span>Total</span><span>Acceso</span></div>
          ${orders.length ? orders.map(o => `
            <div class="simple-row">
              <span>${o.code}</span>
              <span>${o.buyer.name}</span>
              <span>${o.title}</span>
              <span>${formatMXN(o.total)}</span>
              <span>${o.scanStatus}</span>
            </div>
          `).join("") : `<div class="empty-state small"><p>Sin órdenes todavía. Completa una compra demo.</p></div>`}
        </div>
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;
    if (page === "home") renderHome();
    if (page === "events") renderEventsPage();
    if (page === "event") renderEventPage();
    if (page === "checkout") paintCheckout();
    if (page === "tickets") paintTickets();
    if (page === "scanner") paintScanner();
    if (page === "panel") paintPanel();
  });
})();
