(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const fallbackEvents = [
    {
      id: 1,
      slug: "festival-live-night-2026",
      title: "Festival Live Night 2026",
      category: "Festival",
      city: "San Luis Potosí, MX",
      venue: "Arena Open Stage",
      summary: "Una experiencia de alto impacto con zonas, acceso digital y compra rápida.",
      description: "Vive una experiencia única con música en vivo, ambiente premium y una compra de boletos clara, rápida y segura desde cualquier dispositivo.",
      dateLabel: "20 Mar 2026",
      time: "8:00 PM",
      startingPrice: 450,
      status: "Venta activa",
      heroTag: "Evento destacado",
      coverClass: "cover-live-night",
      zones: [
        { id: "general", name: "General", price: 450, desc: "Acceso estándar con flujo de compra rápido." },
        { id: "preferente", name: "Preferente", price: 850, desc: "Mejor ubicación para una experiencia más destacada." },
        { id: "vip", name: "VIP", price: 1250, desc: "Zona exclusiva para una experiencia premium." }
      ],
      faqs: [
        ["¿Cuándo recibo mis boletos?", "Después de completar la compra, tus boletos quedan disponibles para consulta y acceso."],
        ["¿Puedo entrar con mi boleto en celular?", "Sí, el acceso digital está pensado para mostrarse desde tu dispositivo móvil."],
        ["¿Puedo elegir otra zona?", "Sí, puedes revisar las distintas categorías y seleccionar la experiencia que mejor se adapte a ti."]
      ]
    },
    {
      id: 2,
      slug: "electro-wave-tour",
      title: "Electro Wave Tour",
      category: "Concierto",
      city: "San Luis Potosí, MX",
      venue: "Foro Central",
      summary: "Una noche intensa con estética premium y una experiencia de compra clara.",
      description: "Un concierto con energía nocturna, visual premium y un flujo claro para convertir más ventas.",
      dateLabel: "15 Abr 2026",
      time: "9:00 PM",
      startingPrice: 590,
      status: "Venta activa",
      heroTag: "Concierto",
      coverClass: "cover-electro-wave",
      zones: [
        { id: "general", name: "General", price: 590, desc: "Acceso general con excelente ambiente." },
        { id: "preferente", name: "Preferente", price: 890, desc: "Mayor cercanía y mejor visibilidad." },
        { id: "vip", name: "VIP", price: 1390, desc: "Acceso premium y zona exclusiva." }
      ],
      faqs: [
        ["¿Puedo transferir mi boleto?", "La política depende del evento y puede configurarse según la operación."],
        ["¿Hay acceso digital?", "Sí, el boleto puede mostrarse desde celular."],
        ["¿La compra es inmediata?", "Sí, al confirmar el pago se registra la orden y se entrega el boleto digital."]
      ]
    },
    {
      id: 3,
      slug: "sunset-beats",
      title: "Sunset Beats",
      category: "Festival",
      city: "San Luis Potosí, MX",
      venue: "Terraza Sunset",
      summary: "Ideal para mostrar zonas, precios y una experiencia más visual para el asistente.",
      description: "Festival con una presentación moderna, pensado para impulsar intención de compra y experiencia del usuario.",
      dateLabel: "28 May 2026",
      time: "6:00 PM",
      startingPrice: 720,
      status: "Preventa",
      heroTag: "Festival",
      coverClass: "cover-sunset-beats",
      zones: [
        { id: "general", name: "General", price: 720, desc: "Acceso estándar al festival." },
        { id: "preferente", name: "Preferente", price: 980, desc: "Ubicación mejorada y mayor comodidad." },
        { id: "vip", name: "VIP", price: 1480, desc: "Acceso premium para una mejor experiencia." }
      ],
      faqs: [
        ["¿Habrá varias áreas?", "Sí, la estructura contempla zonas y categorías de acceso."],
        ["¿Se puede acceder con QR?", "Sí, el ingreso es digital y práctico."],
        ["¿Se puede comprar desde celular?", "Sí, toda la experiencia está pensada para móvil."]
      ]
    }
  ];

  const bridge = {
    async getEvents() {
      try {
        if (window.TicketorideBridge && typeof window.TicketorideBridge.getEvents === "function") {
          const result = await window.TicketorideBridge.getEvents();
          if (Array.isArray(result) && result.length) return result;
        }
      } catch (_) {}
      return fallbackEvents;
    },
    async getEventBySlug(slug) {
      try {
        if (window.TicketorideBridge && typeof window.TicketorideBridge.getEventBySlug === "function") {
          const result = await window.TicketorideBridge.getEventBySlug(slug);
          if (result) return result;
        }
      } catch (_) {}
      return fallbackEvents.find(e => e.slug === slug) || fallbackEvents[0];
    },
    async checkout(order) {
      try {
        if (window.TicketorideBridge && typeof window.TicketorideBridge.checkout === "function") {
          return await window.TicketorideBridge.checkout(order);
        }
      } catch (_) {}
      return { ok: true, order };
    }
  };

  const storage = {
    getCart() {
      try { return JSON.parse(localStorage.getItem("ticketoride_cart")) || null; } catch (_) { return null; }
    },
    setCart(cart) {
      localStorage.setItem("ticketoride_cart", JSON.stringify(cart));
    },
    clearCart() {
      localStorage.removeItem("ticketoride_cart");
    },
    getOrders() {
      try {
        const raw = JSON.parse(localStorage.getItem("ticketoride_orders")) || [];
        return raw.map(normalizeOrder);
      } catch (_) {
        return [];
      }
    },
    setOrders(orders) {
      localStorage.setItem("ticketoride_orders", JSON.stringify(orders.map(normalizeOrder)));
    }
  };

  function normalizeOrder(order) {
    const qtyPurchased = Number(order.qtyPurchased ?? order.qty ?? 1);
    let qtyEntered = Number(order.qtyEntered ?? 0);

    if (!("qtyEntered" in order) && order.scanStatus === "Ingresado") {
      qtyEntered = qtyPurchased;
    }

    qtyEntered = Math.max(0, Math.min(qtyPurchased, qtyEntered));

    return {
      ...order,
      qtyPurchased,
      qtyEntered,
      qty: qtyPurchased,
      scanStatus: getScanStatus(qtyPurchased, qtyEntered)
    };
  }

  function getScanStatus(qtyPurchased, qtyEntered) {
    if (qtyEntered <= 0) return "Pendiente";
    if (qtyEntered >= qtyPurchased) return "Acceso completo";
    return "Acceso parcial";
  }

  function formatMXN(n) {
    return `$${Number(n || 0).toLocaleString("es-MX")} MXN`;
  }

  function slugParam() {
    const params = new URLSearchParams(window.location.search);
    return params.get("slug");
  }

  function makeOrderCode() {
    const ts = Date.now().toString().slice(-6);
    const rand = Math.floor(Math.random() * 900 + 100);
    return `TTR-${ts}-${rand}`;
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
      <article class="event-card" data-category="${event.category}" data-search="${[event.title, event.city, event.venue, event.category].join(" ").toLowerCase()}">
        <div class="event-cover ${event.coverClass || getCoverClass(event.slug)}">
          <span class="mini-badge">${event.category}</span>
        </div>
        <div class="event-content">
          <div class="event-date">${event.dateLabel} · ${event.time}</div>
          <h3>${event.title}</h3>
          <p>${event.summary}</p>
          <div class="event-bottom">
            <strong>${formatMXN(event.startingPrice)}</strong>
            <a href="evento.html?slug=${event.slug}">Ver evento</a>
          </div>
        </div>
      </article>
    `;
  }

  async function renderHome() {
    const events = await bridge.getEvents();
    const grid = $("#homeEventGrid");
    if (grid && !grid.querySelector(".event-card")) {
      grid.innerHTML = events.slice(0, 3).map(buildEventCard).join("");
    }

    const featured = events[0];
    const hero = $("#heroFeatured");
    if (hero && featured && !hero.children.length) {
      hero.innerHTML = `
        <div class="featured-card ${featured.coverClass || getCoverClass(featured.slug)}">
          <div class="panel-top">
            <span class="live-pill">${featured.heroTag || "Evento destacado"}</span>
            <span class="status-dot">${featured.status || "Venta activa"}</span>
          </div>
          <div class="featured-head">
            <div>
              <p class="featured-label">${featured.category}</p>
              <h2>${featured.title}</h2>
            </div>
          </div>
          <p class="featured-place">${featured.city} · ${featured.venue}</p>
          <div class="chip-row">
            <span class="chip">${featured.dateLabel}</span>
            <span class="chip">${featured.time}</span>
            <span class="chip">Desde ${formatMXN(featured.startingPrice)}</span>
          </div>
          <div class="featured-footer">
            <div>
              <small>Precio desde</small>
              <strong class="price">${formatMXN(featured.startingPrice)}</strong>
            </div>
            <a class="btn btn-primary" href="evento.html?slug=${featured.slug}">Comprar boletos</a>
          </div>
        </div>
      `;
    }
  }

  async function renderEventsPage() {
    const grid = $("#eventsGrid");
    const category = $("#filterCategory");
    const search = $("#filterSearch");
    const countEl = $("#eventsCount");
    if (!grid) return;

    if (!grid.querySelector(".event-card")) {
      const events = await bridge.getEvents();
      grid.innerHTML = events.map(buildEventCard).join("");
    }

    const cards = $$(".event-card", grid);

    cards.forEach(card => {
      if (!card.dataset.category || !card.dataset.search) {
        const title = $("h3", card)?.textContent || "";
        const contentText = card.textContent || "";
        const badge = $(".mini-badge, .pill", card)?.textContent || "";
        card.dataset.category = badge.trim();
        card.dataset.search = [title, contentText].join(" ").toLowerCase();
      }
    });

    function paint() {
      const term = (search?.value || "").trim().toLowerCase();
      const cat = (category?.value || "all").toLowerCase();
      let visible = 0;

      cards.forEach(card => {
        const cardCategory = (card.dataset.category || "").toLowerCase();
        const cardSearch = (card.dataset.search || "").toLowerCase();
        const matchCat = cat === "all" || cardCategory === cat;
        const matchTerm = !term || cardSearch.includes(term);
        const show = matchCat && matchTerm;
        card.style.display = show ? "" : "none";
        if (show) visible += 1;
      });

      if (countEl) countEl.textContent = `${visible} evento(s)`;
    }

    category?.addEventListener("change", paint);
    search?.addEventListener("input", paint);
    paint();
  }

  async function renderEventPage() {
    const slug = slugParam();
    const event = await bridge.getEventBySlug(slug);
    if (!event) return;

    $$(".event-title").forEach(n => n.textContent = event.title);
    $$(".event-city").forEach(n => n.textContent = `${event.city} · ${event.venue}`);
    $$(".event-summary").forEach(n => n.textContent = event.description);
    $$(".event-date-label").forEach(n => n.textContent = event.dateLabel);
    $$(".event-time-label").forEach(n => n.textContent = event.time);

    const heroPanel = $("#eventHeroPanel");
    if (heroPanel) heroPanel.className = `event-hero-panel ${event.coverClass || getCoverClass(event.slug)}`;

    const zonesGrid = $("#zonesGrid");
    if (zonesGrid && !zonesGrid.children.length) {
      zonesGrid.innerHTML = event.zones.map((z, idx) => `
        <article class="feature-card">
          <h3>${z.name}</h3>
          <p>${z.desc}</p>
          <p><strong>Precio:</strong> ${formatMXN(z.price)}</p>
          <button class="btn ${idx === 1 ? "btn-primary" : "btn-secondary"} zone-select" data-zone="${z.id}" data-price="${z.price}" data-name="${z.name}">
            Seleccionar
          </button>
        </article>
      `).join("");
    }

    const faq = $("#faqGrid");
    if (faq && !faq.children.length) {
      faq.innerHTML = event.faqs.map(([q, a]) => `
        <article class="feature-card">
          <h3>${q}</h3>
          <p>${a}</p>
        </article>
      `).join("");
    }

    const summaryCard = $("#eventQuickBuy");
    if (summaryCard && !summaryCard.children.length) {
      summaryCard.innerHTML = `
        <div class="feature-card" style="padding:22px;">
          <span class="section-kicker red" style="margin-bottom:14px;">Compra rápida</span>
          <h3 style="margin-top:0;">${event.title}</h3>
          <p class="muted" style="margin-bottom:18px;">${event.city} · ${event.venue}</p>
          <div style="display:grid;gap:12px;margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;gap:12px;"><span>Fecha</span><strong>${event.dateLabel}</strong></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><span>Hora</span><strong>${event.time}</strong></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><span>Desde</span><strong>${formatMXN(event.startingPrice)}</strong></div>
          </div>
          <button class="btn btn-primary full buy-default">Comprar general</button>
        </div>
      `;
      $(".buy-default", summaryCard)?.addEventListener("click", () => saveCartAndGo(event, event.zones[0], 1));
    }

    const venueMap = $("#venueMap");
    if (venueMap && !venueMap.children.length) {
      venueMap.innerHTML = `
        <div class="stage">ESCENARIO</div>
        <div class="map-row"><button class="map-zone zone-select" data-zone="${event.zones[2]?.id || event.zones[0].id}" data-price="${event.zones[2]?.price || event.zones[0].price}" data-name="${event.zones[2]?.name || event.zones[0].name}">${event.zones[2]?.name || "VIP"}</button></div>
        <div class="map-row"><button class="map-zone zone-select" data-zone="${event.zones[1]?.id || event.zones[0].id}" data-price="${event.zones[1]?.price || event.zones[0].price}" data-name="${event.zones[1]?.name || event.zones[0].name}">${event.zones[1]?.name || "Preferente"}</button></div>
        <div class="map-row"><button class="map-zone zone-select" data-zone="${event.zones[0].id}" data-price="${event.zones[0].price}" data-name="${event.zones[0].name}">${event.zones[0].name}</button></div>
      `;
    }

    bindStaticEventSelection(event);
  }

  function bindStaticEventSelection(event) {
    const zoneButtons = $$(".zone-select");
    zoneButtons.forEach(btn => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        const zone = {
          id: btn.dataset.zone,
          name: btn.dataset.name,
          price: Number(btn.dataset.price)
        };
        saveCartAndGo(event, zone, 1);
      });
    });

    const zoneCards = $$("#zonas .feature-card");
    zoneCards.forEach(card => {
      const btn = $(".btn", card);
      const title = $("h3", card)?.textContent?.trim();
      const cardText = card.textContent || "";
      const priceMatch = cardText.replace(/\./g, "").match(/\$([\d,]+)/);
      if (!btn || !title || !priceMatch) return;

      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        const zone = {
          id: title.toLowerCase().replace(/\s+/g, "-"),
          name: title,
          price: Number(priceMatch[1].replace(/,/g, ""))
        };
        saveCartAndGo(event, zone, 1);
      });
    });

    const quickBuyButton = $(".quick-buy-card .btn-primary");
    if (quickBuyButton) {
      quickBuyButton.addEventListener("click", (ev) => {
        ev.preventDefault();
        saveCartAndGo(event, event.zones[0], 1);
      });
    }
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
      subtotal: Number(zone.price) * Number(qty)
    });
    window.location.href = "checkout.html";
  }

  function extractStaticCheckoutData() {
    const cart = storage.getCart();
    if (cart) return cart;

    return {
      eventId: 1,
      slug: "festival-live-night-2026",
      title: "Festival Live Night 2026",
      city: "San Luis Potosí, MX",
      venue: "Arena Open Stage",
      dateLabel: "20 Mar 2026",
      time: "8:00 PM",
      zone: { id: "general", name: "General", price: 450 },
      qty: 1,
      subtotal: 450
    };
  }

  function bindStaticCheckout() {
    const payButton = $('.btn.btn-primary[href="mis-boletos.html"]');
    if (!payButton) return;

    payButton.addEventListener("click", async (ev) => {
      ev.preventDefault();

      const firstName = ($("#nombre")?.value || "").trim();
      const lastName = ($("#apellido")?.value || "").trim();
      const email = ($("#correo")?.value || "").trim();
      const phone = ($("#telefono")?.value || "").trim();

      const buyerName = [firstName, lastName].join(" ").trim();
      if (!buyerName || !email) {
        alert("Captura nombre y correo para continuar.");
        return;
      }

      const cart = extractStaticCheckoutData();
      const qty = Number(cart.qty || 1);
      const total = Number(cart.subtotal || cart.zone.price || 0);

      const order = normalizeOrder({
        code: makeOrderCode(),
        eventSlug: cart.slug,
        title: cart.title,
        city: cart.city,
        venue: cart.venue,
        dateLabel: cart.dateLabel,
        time: cart.time,
        zone: cart.zone.name,
        unitPrice: cart.zone.price,
        qtyPurchased: qty,
        qtyEntered: 0,
        discount: 0,
        total,
        buyer: {
          name: buyerName,
          email,
          phone
        },
        status: "Pagado",
        purchasedAt: new Date().toLocaleString("es-MX")
      });

      await bridge.checkout(order);
      const orders = storage.getOrders();
      orders.unshift(order);
      storage.setOrders(orders);
      storage.clearCart();
      window.location.href = `mis-boletos.html?order=${encodeURIComponent(order.code)}`;
    });
  }

  function paintCheckoutLegacy() {
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
          <div class="checkout-actions">
            <a class="btn btn-secondary" href="evento.html?slug=${cart.slug}">Volver al evento</a>
            <button class="btn btn-primary" id="confirmPurchase">Confirmar compra</button>
          </div>
        </section>

        <aside class="summary-card">
          <h3>Resumen</h3>
          <div class="summary-line"><span>Evento</span><strong>${cart.title}</strong></div>
          <div class="summary-line"><span>Sede</span><strong>${cart.city}</strong></div>
          <div class="summary-line"><span>Zona</span><strong>${cart.zone.name}</strong></div>
          <div class="summary-line"><span>Precio unitario</span><strong>${formatMXN(cart.zone.price)}</strong></div>
          <div class="summary-line"><span>Cantidad</span><strong id="sumQty">${cart.qty}</strong></div>
          <div class="summary-total"><span>Total</span><strong id="sumTotal">${formatMXN(cart.subtotal)}</strong></div>
        </aside>
      </div>
    `;

    const qtyInput = $("#buyerQty");
    const sumQty = $("#sumQty");
    const sumTotal = $("#sumTotal");

    function updateSummary() {
      const qty = Math.max(1, Math.min(8, Number(qtyInput.value || 1)));
      qtyInput.value = qty;
      cart.qty = qty;
      cart.subtotal = cart.zone.price * qty;
      if (sumQty) sumQty.textContent = qty;
      if (sumTotal) sumTotal.textContent = formatMXN(cart.subtotal);
      storage.setCart(cart);
    }

    qtyInput?.addEventListener("input", updateSummary);

    $("#confirmPurchase")?.addEventListener("click", async () => {
      const buyer = {
        name: ($("#buyerName")?.value || "").trim(),
        email: ($("#buyerEmail")?.value || "").trim(),
        phone: ($("#buyerPhone")?.value || "").trim()
      };

      if (!buyer.name || !buyer.email) {
        alert("Captura al menos nombre y correo.");
        return;
      }

      const order = normalizeOrder({
        code: makeOrderCode(),
        eventSlug: cart.slug,
        title: cart.title,
        city: cart.city,
        venue: cart.venue,
        dateLabel: cart.dateLabel,
        time: cart.time,
        zone: cart.zone.name,
        unitPrice: cart.zone.price,
        qtyPurchased: Number(cart.qty || 1),
        qtyEntered: 0,
        discount: 0,
        total: Number(cart.subtotal || 0),
        buyer,
        status: "Pagado",
        purchasedAt: new Date().toLocaleString("es-MX")
      });

      await bridge.checkout(order);
      const orders = storage.getOrders();
      orders.unshift(order);
      storage.setOrders(orders);
      storage.clearCart();
      window.location.href = `mis-boletos.html?order=${encodeURIComponent(order.code)}`;
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
    ctx.fillRect(0, 0, size, size);

    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);

    function bit(x, y) {
      const n = Math.abs(Math.sin(hash + x * 13.13 + y * 7.77) * 10000);
      return Math.floor(n) % 2 === 0;
    }

    const markers = [[0, 0], [cells - 7, 0], [0, cells - 7]];
    markers.forEach(([mx, my]) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(mx * cell, my * cell, 7 * cell, 7 * cell);
      ctx.fillStyle = "#fff";
      ctx.fillRect((mx + 1) * cell, (my + 1) * cell, 5 * cell, 5 * cell);
      ctx.fillStyle = "#000";
      ctx.fillRect((mx + 2) * cell, (my + 2) * cell, 3 * cell, 3 * cell);
    });

    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const inMarker = markers.some(([mx, my]) => x >= mx && x < mx + 7 && y >= my && y < my + 7);
        if (inMarker) continue;
        if (bit(x, y)) {
          ctx.fillStyle = "#000";
          ctx.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell), Math.ceil(cell));
        }
      }
    }
  }

  function paintTickets() {
    const wrap = $("#ticketsWrap");
    const title = $("#ticketsTitle");
    const orders = storage.getOrders();
    const focus = new URLSearchParams(location.search).get("order");

    if (focus && title) title.textContent = `Compra realizada: ${focus}`;
    if (!wrap) return;

    if (!orders.length) {
      wrap.innerHTML = `<div class="empty-state"><h3>Aún no tienes boletos</h3><p>Haz una compra desde el checkout para visualizar tu cartera digital.</p><a class="btn btn-primary" href="eventos.html">Comprar boletos</a></div>`;
      return;
    }

    wrap.innerHTML = orders.map(o => {
      const available = Math.max(0, o.qtyPurchased - o.qtyEntered);
      return `
        <article class="ticket-wallet-card ${focus === o.code ? "highlight" : ""}">
          <div class="ticket-main">
            <div>
              <span class="small-tag">${o.status}</span>
              <h3>${o.title}</h3>
              <p>${o.city} · ${o.venue}</p>
              <div class="ticket-info-grid">
                <div><span>Código</span><strong>${o.code}</strong></div>
                <div><span>Zona</span><strong>${o.zone}</strong></div>
                <div><span>Comprados</span><strong>${o.qtyPurchased}</strong></div>
                <div><span>Ya ingresaron</span><strong>${o.qtyEntered}</strong></div>
                <div><span>Disponibles</span><strong>${available}</strong></div>
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
      `;
    }).join("");

    $$(".qr-canvas").forEach(c => pseudoQR(c, c.dataset.seed || "TTR"));
  }

  function renderScannerOrderCard(order) {
    const available = Math.max(0, order.qtyPurchased - order.qtyEntered);

    if (available <= 0) {
      return `
        <div class="scan-result warn">
          <h3>QR ya utilizado</h3>
          <p><strong>${order.code}</strong> ya completó todos sus accesos.</p>
          <div class="ticket-info-grid" style="margin-top:14px;">
            <div><span>Comprados</span><strong>${order.qtyPurchased}</strong></div>
            <div><span>Ya ingresaron</span><strong>${order.qtyEntered}</strong></div>
            <div><span>Disponibles</span><strong>0</strong></div>
            <div><span>Estado</span><strong>${order.scanStatus}</strong></div>
          </div>
        </div>
      `;
    }

    return `
      <div class="scan-result ok">
        <h3>Compra localizada</h3>
        <p><strong>${order.buyer?.name || "Cliente"}</strong> · ${order.title} · ${order.zone}</p>
        <div class="ticket-info-grid" style="margin-top:14px;">
          <div><span>Boletos comprados</span><strong>${order.qtyPurchased}</strong></div>
          <div><span>Ya ingresaron</span><strong>${order.qtyEntered}</strong></div>
          <div><span>Disponibles</span><strong>${available}</strong></div>
          <div><span>Estado</span><strong>${order.scanStatus}</strong></div>
        </div>
        <div style="margin-top:18px;">
          <label for="scannerEnterQty" style="display:block;font-weight:700;margin-bottom:8px;">¿Cuántas personas ingresan ahora?</label>
          <input id="scannerEnterQty" type="number" min="1" max="${available}" value="1" />
        </div>
        <div class="row-actions" style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap;">
          <button type="button" class="btn btn-primary" id="confirmScannerEntry" data-code="${order.code}">Registrar ingreso</button>
          <button type="button" class="btn btn-secondary" id="markScannerComplete" data-code="${order.code}">Marcar ingreso completo</button>
          <button type="button" class="btn btn-secondary" id="clearScannerResult">Limpiar</button>
        </div>
      </div>
    `;
  }

  function bindScannerResultActions() {
    $("#confirmScannerEntry")?.addEventListener("click", () => {
      const code = $("#confirmScannerEntry")?.dataset.code;
      const qtyNow = Number($("#scannerEnterQty")?.value || 1);
      registerScannerEntry(code, qtyNow);
    });

    $("#markScannerComplete")?.addEventListener("click", () => {
      const code = $("#markScannerComplete")?.dataset.code;
      const order = storage.getOrders().find(o => o.code === code);
      if (!order) return;
      const available = Math.max(0, order.qtyPurchased - order.qtyEntered);
      registerScannerEntry(code, available);
    });

    $("#clearScannerResult")?.addEventListener("click", () => {
      const result = $("#scannerResult");
      if (result) {
        result.innerHTML = `<div class="scan-result"><h3 style="margin-top:0;">Esperando validación</h3><p>Selecciona o captura un código para simular el acceso del asistente.</p></div>`;
      }
      const input = $("#scannerInput");
      const select = $("#scannerSelect");
      if (input) input.value = "";
      if (select) select.value = "";
    });
  }

  function registerScannerEntry(code, qtyNow) {
    const orders = storage.getOrders();
    const index = orders.findIndex(o => o.code === code);
    const result = $("#scannerResult");
    if (index < 0 || !result) return;

    const order = normalizeOrder(orders[index]);
    const available = Math.max(0, order.qtyPurchased - order.qtyEntered);

    if (available <= 0) {
      result.innerHTML = `<div class="scan-result warn"><h3>QR ya utilizado</h3><p>${order.code} ya completó todos sus accesos.</p></div>`;
      return;
    }

    if (!qtyNow || qtyNow < 1 || qtyNow > available) {
      result.innerHTML = `<div class="scan-result danger"><h3>Cantidad inválida</h3><p>Solo puedes registrar entre 1 y ${available} acceso(s) en este momento.</p></div>`;
      return;
    }

    order.qtyEntered += qtyNow;
    order.scanStatus = getScanStatus(order.qtyPurchased, order.qtyEntered);
    orders[index] = order;
    storage.setOrders(orders);

    const remaining = Math.max(0, order.qtyPurchased - order.qtyEntered);
    const statusClass = remaining === 0 ? "ok" : "warn";
    const statusTitle = remaining === 0 ? "Acceso completo registrado" : "Acceso parcial registrado";

    result.innerHTML = `
      <div class="scan-result ${statusClass}">
        <h3>${statusTitle}</h3>
        <p><strong>${order.code}</strong> · ${order.title}</p>
        <div class="ticket-info-grid" style="margin-top:14px;">
          <div><span>Comprados</span><strong>${order.qtyPurchased}</strong></div>
          <div><span>Ya ingresaron</span><strong>${order.qtyEntered}</strong></div>
          <div><span>Restantes</span><strong>${remaining}</strong></div>
          <div><span>Estado</span><strong>${order.scanStatus}</strong></div>
        </div>
      </div>
    `;

    paintPanel();
    paintTickets();
    populateScannerSelect();
  }

  function populateScannerSelect() {
    const select = $("#scannerSelect");
    if (!select) return;

    const orders = storage.getOrders();
    select.innerHTML = `<option value="">Selecciona un boleto</option>` + orders.map(o => {
      const available = Math.max(0, o.qtyPurchased - o.qtyEntered);
      return `<option value="${o.code}">${o.code} · ${o.title} · ${available} disponible(s)</option>`;
    }).join("");
  }

  function paintScanner() {
    const result = $("#scannerResult");
    const validateButton = $("#scannerValidate");
    const input = $("#scannerInput");
    const select = $("#scannerSelect");
    if (!result || !validateButton) return;

    populateScannerSelect();

    function locateOrder() {
      const code = (input?.value || select?.value || "").trim();
      if (!code) {
        result.innerHTML = `<div class="scan-result danger"><h3>Captura un código</h3><p>Ingresa un folio o selecciona una compra para continuar.</p></div>`;
        return;
      }

      const order = storage.getOrders().find(o => o.code === code);
      if (!order) {
        result.innerHTML = `<div class="scan-result danger"><h3>Boleto no encontrado</h3><p>Verifica el código e intenta nuevamente.</p></div>`;
        return;
      }

      result.innerHTML = renderScannerOrderCard(order);
      bindScannerResultActions();
    }

    validateButton.addEventListener("click", locateOrder);

    select?.addEventListener("change", () => {
      if (input) input.value = select.value || "";
    });
  }

  function paintPanel() {
    const wrap = $("#panelWrap");
    if (!wrap) return;

    const orders = storage.getOrders();
    const totalVentas = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalBoletos = orders.reduce((sum, o) => sum + Number(o.qtyPurchased || 0), 0);
    const ingresados = orders.reduce((sum, o) => sum + Number(o.qtyEntered || 0), 0);
    const pendientes = Math.max(0, totalBoletos - ingresados);

    wrap.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><span>Ventas acumuladas</span><strong>${formatMXN(totalVentas)}</strong></div>
        <div class="kpi-card"><span>Boletos emitidos</span><strong>${totalBoletos}</strong></div>
        <div class="kpi-card"><span>Ingresados</span><strong>${ingresados}</strong></div>
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
              <span>${o.buyer?.name || "Cliente"}</span>
              <span>${o.title}</span>
              <span>${formatMXN(o.total)}</span>
              <span>${o.qtyEntered}/${o.qtyPurchased}</span>
            </div>
          `).join("") : `<div class="empty-state small"><p>Sin órdenes todavía. Completa una compra para comenzar.</p></div>`}
        </div>
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    if (page === "home") renderHome();
    if (page === "events") renderEventsPage();
    if (page === "event") renderEventPage();

    if (page === "checkout") {
      bindStaticCheckout();
      paintCheckoutLegacy();
    }

    if (page === "tickets") paintTickets();
    if (page === "scanner") paintScanner();
    if (page === "panel") paintPanel();
  });
})();
