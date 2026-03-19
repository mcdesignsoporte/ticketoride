
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const ORDERS_KEY = "ticketoride_demo_orders";
  const CART_KEY = "ticketoride_demo_cart";
  const RECENT_SCANS_KEY = "ticketoride_demo_recent_scans";

  const events = (window.TICKETORIDE_MOCK_DATA && window.TICKETORIDE_MOCK_DATA.events) || [];
  const mainEvent = events.find(e => e.slug === "teatro-de-la-paz-slp") || events[0];

  const storage = {
    getOrders() {
      try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
      catch { return []; }
    },
    setOrders(orders) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    },
    getCart() {
      try { return JSON.parse(localStorage.getItem(CART_KEY)) || null; }
      catch { return null; }
    },
    setCart(cart) {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    },
    clearCart() {
      localStorage.removeItem(CART_KEY);
    },
    getRecentScans() {
      try { return JSON.parse(localStorage.getItem(RECENT_SCANS_KEY)) || []; }
      catch { return []; }
    },
    setRecentScans(items) {
      localStorage.setItem(RECENT_SCANS_KEY, JSON.stringify(items.slice(0, 12)));
    },
    resetDemo() {
      localStorage.removeItem(ORDERS_KEY);
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(RECENT_SCANS_KEY);
    }
  };

  function slugParam() {
    return new URLSearchParams(window.location.search).get("slug");
  }

  function formatMXN(n) {
    return `$${Number(n || 0).toLocaleString("es-MX")} MXN`;
  }

  function formatDateTime(value) {
    try {
      return new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return value;
    }
  }

  function findEvent(slug) {
    return events.find(e => e.slug === slug) || mainEvent;
  }

  function sectionSeatLabel(section, row, number) {
    return `${section.shortCode} ${row}${number}`;
  }

  function seatCode(section, row, number) {
    return `${section.id}-${row}${number}`;
  }

  function getAllTickets() {
    return storage.getOrders().flatMap(order => (order.tickets || []).map(ticket => ({ ...ticket, orderCode: order.code, buyer: order.buyer, purchasedAt: order.purchasedAt })));
  }

  function isSeatSoldByOrders(eventSlug, code) {
    return getAllTickets().some(ticket => ticket.eventSlug === eventSlug && ticket.seatCode === code);
  }

  function getSeatStatus(event, code) {
    if (isSeatSoldByOrders(event.slug, code)) return "sold";
    if ((event.demoSoldSeats || []).includes(code)) return "sold";
    if ((event.demoHeldSeats || []).includes(code)) return "held";
    return "available";
  }

  function createEventCard(event) {
    const sectionInfo = (event.sections || [])[0] || {};
    return `
      <article class="event-card" data-category="${event.category}" data-search="${[event.title, event.city, event.venue, event.category].join(" ").toLowerCase()}">
        <div class="event-cover">
          <span class="section-chip ${sectionInfo.colorClass || "bal"}-chip">${event.heroTag || event.category}</span>
        </div>
        <div class="event-content">
          <h3>${event.title}</h3>
          <p>${event.summary}</p>
          <div class="event-meta">
            <span>${event.dateLabel} · ${event.time}</span>
            <span>${event.city}</span>
            <span>${event.venue}</span>
          </div>
          <div class="event-bottom">
            <strong>Desde ${formatMXN(event.startingPrice)}</strong>
            <a class="btn btn-secondary" href="evento.html?slug=${encodeURIComponent(event.slug)}">Ver evento</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderHome() {
    const target = $("#homeSections");
    if (!target || !mainEvent) return;
    target.innerHTML = mainEvent.sections.map(section => {
      const total = section.rows.reduce((acc, row) => acc + row.seats, 0);
      return `
        <article class="section-card ${section.colorClass}">
          <span class="section-chip ${section.colorClass}-chip">${section.id}</span>
          <h3>${section.name}</h3>
          <p>${section.description}</p>
          <div class="price">${formatMXN(section.price)}</div>
          <p style="margin-top:10px;">${total} butacas configuradas para la simulación.</p>
        </article>
      `;
    }).join("");
  }

  function renderEvents() {
    const grid = $("#eventsGrid");
    if (!grid) return;
    grid.innerHTML = events.map(createEventCard).join("");
    updateEventFilters();
    $("#filterSearch")?.addEventListener("input", updateEventFilters);
    $("#filterCategory")?.addEventListener("change", updateEventFilters);
  }

  function updateEventFilters() {
    const grid = $("#eventsGrid");
    if (!grid) return;
    const search = ($("#filterSearch")?.value || "").trim().toLowerCase();
    const category = $("#filterCategory")?.value || "all";
    let visible = 0;
    $$(".event-card", grid).forEach(card => {
      const matchesSearch = !search || (card.dataset.search || "").includes(search);
      const matchesCategory = category === "all" || (card.dataset.category || "") === category;
      const show = matchesSearch && matchesCategory;
      card.style.display = show ? "" : "none";
      if (show) visible += 1;
    });
    const count = $("#eventsCount");
    if (count) count.textContent = `${visible} evento(s)`;
  }

  function renderSectionCards(event) {
    const wrap = $("#sectionCards");
    const overview = $("#overviewCards");
    if (overview) {
      overview.innerHTML = event.sections.map(section => {
        const total = section.rows.reduce((acc, row) => acc + row.seats, 0);
        return `
          <button class="overview-card ${section.colorClass}" data-overview="${section.id}">
            <span>${section.name}</span>
            <strong>${formatMXN(section.price)}</strong>
            <small>${total} butacas</small>
          </button>
        `;
      }).join("");
    }
    if (wrap) {
      wrap.innerHTML = event.sections.map(section => {
        const total = section.rows.reduce((acc, row) => acc + row.seats, 0);
        return `
          <article class="section-card ${section.colorClass}">
            <span class="section-chip ${section.colorClass}-chip">${section.id}</span>
            <h3>${section.name}</h3>
            <p>${section.description}</p>
            <div class="summary-list">
              <div class="summary-item"><span>Precio</span><strong>${formatMXN(section.price)}</strong></div>
              <div class="summary-item"><span>Filas</span><strong>${section.rows[0].row} - ${section.rows[section.rows.length - 1].row}</strong></div>
              <div class="summary-item"><span>Butacas demo</span><strong>${total}</strong></div>
            </div>
          </article>
        `;
      }).join("");
    }
  }

  function renderEvent() {
  const page = document.body.dataset.page;
  if (page !== "event") return;
  const event = findEvent(slugParam());
  if (!event) return;

  $("#eventHeroTag").textContent = event.heroTag;
  $("#eventTitle").textContent = event.title;
  $("#eventSummary").textContent = event.summary;
  $("#eventDate").textContent = event.dateLabel;
  $("#eventTime").textContent = event.time;
  $("#eventVenue").textContent = `${event.city} · ${event.venue}`;
  renderSectionCards(event);

  let activeSection = event.sections[0];
  let selectedSeats = [];
  let currentView = "overview";
  let currentZoom = 1;

  const tabs = $("#sectionTabs");
  const map = $("#seatMap");
  const meta = $("#sectionMeta");
  const overviewMap = $("#overviewMap");
  const guideSvg = $("#guideSvg");
  const rowLabels = $("#rowLabels");
  const activeSectionHero = $("#activeSectionHero");
  const hoverSeatCard = $("#hoverSeatCard");
  const detailScene = $("#detailScene");
  const overviewView = $("#overviewView");
  const detailView = $("#detailView");
  const viewOverviewBtn = $("#viewOverviewBtn");
  const viewDetailBtn = $("#viewDetailBtn");
  const zoomRange = $("#zoomRange");

  const activeSectionName = $("#activeSectionName");
  const activeSectionPrice = $("#activeSectionPrice");
  const selectedCount = $("#selectedCount");
  const selectedTotal = $("#selectedTotal");
  const selectedPills = $("#selectedPills");

  const geometry = {
    PB: { centerX: 500, centerY: 900, frontRadius: 730, rowGap: 42, spreadStart: 72, spreadStep: 4.8, seatClass: "pb-seat" },
    MEZ: { centerX: 500, centerY: 900, frontRadius: 675, rowGap: 40, spreadStart: 64, spreadStep: 4.6, seatClass: "mez-seat" },
    BAL: { centerX: 500, centerY: 900, frontRadius: 630, rowGap: 42, spreadStart: 58, spreadStep: 4.2, seatClass: "bal-seat" }
  };

  function statusLabel(status) {
    if (status === "selected") return "Seleccionado";
    if (status === "held") return "Apartado demo";
    if (status === "sold") return "Vendido demo";
    return "Disponible";
  }

  function statusClass(status) {
    if (status === "selected") return "status-selected";
    if (status === "held") return "status-held";
    if (status === "sold") return "status-sold";
    return "status-available";
  }

  function getTotalSeats(section) {
    return section.rows.reduce((acc, row) => acc + row.seats, 0);
  }

  function getSectionCounts(section) {
    return section.rows.reduce((acc, row) => {
      for (let i = 1; i <= row.seats; i += 1) {
        const code = seatCode(section, row.row, i);
        const status = getSeatStatus(event, code);
        if (status === "sold") acc.sold += 1;
        if (status === "held") acc.held += 1;
      }
      return acc;
    }, { sold: 0, held: 0 });
  }

  function toPoint(cx, cy, radius, degrees) {
    const radians = degrees * (Math.PI / 180);
    return {
      x: cx + Math.cos(radians) * radius,
      y: cy + Math.sin(radians) * radius
    };
  }

  function getRowSpread(section, rowIndex) {
    const conf = geometry[section.id] || geometry.PB;
    return conf.spreadStart + (rowIndex * conf.spreadStep);
  }

  function getRowRadius(section, rowIndex) {
    const conf = geometry[section.id] || geometry.PB;
    return conf.frontRadius - (rowIndex * conf.rowGap);
  }

  function seatAngles(section, rowIndex, totalSeats) {
    const spread = getRowSpread(section, rowIndex);
    const start = 270 - (spread / 2);
    const end = 270 + (spread / 2);
    const aisleGap = totalSeats >= 18 ? 3.2 : totalSeats >= 12 ? 2.4 : 0;

    if (!aisleGap || totalSeats < 4) {
      return Array.from({ length: totalSeats }, (_, index) => {
        if (totalSeats === 1) return 270;
        return start + ((end - start) * index) / (totalSeats - 1);
      });
    }

    const leftCount = Math.ceil(totalSeats / 2);
    const rightCount = totalSeats - leftCount;
    const leftEnd = 270 - aisleGap;
    const rightStart = 270 + aisleGap;
    const angles = [];

    for (let i = 0; i < leftCount; i += 1) {
      angles.push(leftCount === 1 ? start : start + ((leftEnd - start) * i) / (leftCount - 1));
    }
    for (let i = 0; i < rightCount; i += 1) {
      angles.push(rightCount === 1 ? end : rightStart + ((end - rightStart) * i) / (rightCount - 1));
    }
    return angles;
  }

  function renderHoverCard(section, row, number, label, status) {
    if (!hoverSeatCard) return;
    hoverSeatCard.innerHTML = `
      <strong>${label}</strong>
      <p>${section.name} · Fila ${row} · Butaca ${number}</p>
      <div class="hover-meta">
        <span>Precio: ${formatMXN(section.price)}</span>
        <span>Código: ${seatCode(section, row, number)}</span>
      </div>
      <span class="hover-status ${statusClass(status)}">${statusLabel(status)}</span>
    `;
  }

  function updateSummary() {
    if (activeSectionName) activeSectionName.textContent = activeSection.name;
    if (activeSectionPrice) activeSectionPrice.textContent = formatMXN(activeSection.price);
    if (selectedCount) selectedCount.textContent = selectedSeats.length.toString();
    if (selectedTotal) selectedTotal.textContent = formatMXN(activeSection.price * selectedSeats.length);
    if (selectedPills) {
      selectedPills.innerHTML = selectedSeats.length
        ? selectedSeats.map(seat => `<span class="selection-pill">${seat.label}</span>`).join("")
        : `<span class="selection-pill">Sin asientos seleccionados</span>`;
    }

    const counts = getSectionCounts(activeSection);
    const totalSeats = getTotalSeats(activeSection);
    if (meta) {
      meta.innerHTML = `
        <div class="summary-item"><span>Sección</span><strong>${activeSection.name}</strong></div>
        <div class="summary-item"><span>Precio</span><strong>${formatMXN(activeSection.price)}</strong></div>
        <div class="summary-item"><span>Filas</span><strong>${activeSection.rows[0].row} - ${activeSection.rows[activeSection.rows.length - 1].row}</strong></div>
        <div class="summary-item"><span>Butacas demo</span><strong>${totalSeats}</strong></div>
        <div class="summary-item"><span>Vendidas</span><strong>${counts.sold}</strong></div>
        <div class="summary-item"><span>Apartadas</span><strong>${counts.held}</strong></div>
      `;
    }

    if (activeSectionHero) {
      activeSectionHero.innerHTML = `
        <div class="section-hero-card ${activeSection.colorClass}">
          <strong>${activeSection.name}</strong>
          <small>${activeSection.description}</small>
          <div class="hero-price">${formatMXN(activeSection.price)}</div>
          <div class="hero-mini">
            <span>${activeSection.id}</span>
            <span>${getTotalSeats(activeSection)} butacas</span>
            <span>${counts.sold} vendidas</span>
          </div>
        </div>
      `;
    }
  }

  function setView(mode) {
    currentView = mode;
    overviewView?.classList.toggle("is-visible", mode === "overview");
    detailView?.classList.toggle("is-visible", mode === "detail");
    viewOverviewBtn?.classList.toggle("is-active", mode === "overview");
    viewDetailBtn?.classList.toggle("is-active", mode === "detail");
  }

  function applyZoom(value) {
    currentZoom = Math.max(0.85, Math.min(1.7, Number(value) || 1));
    if (detailScene) detailScene.style.transform = `scale(${currentZoom})`;
    if (zoomRange) zoomRange.value = String(currentZoom);
  }

  function renderTabs() {
    if (!tabs) return;
    tabs.innerHTML = event.sections.map(section => `
      <button class="section-tab ${section.id === activeSection.id ? "is-active" : ""}" data-section="${section.id}">
        ${section.name} · ${formatMXN(section.price)}
      </button>
    `).join("");

    $$(".section-tab", tabs).forEach(btn => {
      btn.addEventListener("click", () => {
        activeSection = event.sections.find(section => section.id === btn.dataset.section) || activeSection;
        selectedSeats = [];
        renderTabs();
        renderOverviewMap();
        renderSeatMap();
        updateSummary();
      });
    });
  }

  function renderOverviewMap() {
    if (!overviewMap) return;
    overviewMap.innerHTML = `
      <svg class="overview-svg" viewBox="0 0 1000 760" preserveAspectRatio="xMidYMid meet" aria-label="Mapa general del Teatro de la Paz">
        <g class="overview-stage">
          <path d="M330 86 Q500 42 670 86 L650 164 Q500 194 350 164 Z"></path>
          <text x="500" y="120" text-anchor="middle">ESCENARIO</text>
        </g>

        <g class="overview-region pb ${activeSection.id === "PB" ? "is-active" : ""}" data-section="PB">
          <path d="M136 620 Q500 260 864 620 L792 686 Q500 388 208 686 Z"></path>
          <text x="500" y="520" text-anchor="middle" font-size="36">PLANTA BAJA</text>
          <text class="overview-sub" x="500" y="552" text-anchor="middle">${formatMXN((event.sections.find(s => s.id === "PB") || activeSection).price)}</text>
        </g>

        <g class="overview-region mez ${activeSection.id === "MEZ" ? "is-active" : ""}" data-section="MEZ">
          <path d="M214 506 Q500 220 786 506 L734 560 Q500 326 266 560 Z"></path>
          <text x="500" y="432" text-anchor="middle" font-size="32">MEZZANINE</text>
          <text class="overview-sub" x="500" y="462" text-anchor="middle">${formatMXN((event.sections.find(s => s.id === "MEZ") || activeSection).price)}</text>
        </g>

        <g class="overview-region bal ${activeSection.id === "BAL" ? "is-active" : ""}" data-section="BAL">
          <path d="M302 400 Q500 188 698 400 L658 448 Q500 290 342 448 Z"></path>
          <text x="500" y="344" text-anchor="middle" font-size="28">BALCÓN</text>
          <text class="overview-sub" x="500" y="372" text-anchor="middle">${formatMXN((event.sections.find(s => s.id === "BAL") || activeSection).price)}</text>
        </g>

        <text class="overview-note" x="500" y="730" text-anchor="middle">Haz clic en una sección para entrar a la vista detallada</text>
      </svg>
      <div class="overview-caption">
        <span class="overview-chip"><strong>PB</strong> Planta Baja premium</span>
        <span class="overview-chip"><strong>MEZ</strong> Mezzanine intermedio</span>
        <span class="overview-chip"><strong>BAL</strong> Balcón acceso general</span>
      </div>
    `;

    $$(".overview-region", overviewMap).forEach(region => {
      region.addEventListener("click", () => {
        activeSection = event.sections.find(section => section.id === region.dataset.section) || activeSection;
        selectedSeats = [];
        renderTabs();
        renderOverviewMap();
        renderSeatMap();
        updateSummary();
        setView("detail");
      });
    });
  }

  function renderSeatMap() {
    if (!map || !guideSvg || !rowLabels) return;
    const conf = geometry[activeSection.id] || geometry.PB;
    const seatButtons = [];
    const guidePaths = [];
    const rowTagHtml = [];

    activeSection.rows.forEach((row, rowIndex) => {
      const radius = getRowRadius(activeSection, rowIndex);
      const spread = getRowSpread(activeSection, rowIndex);
      const startDeg = 270 - (spread / 2);
      const endDeg = 270 + (spread / 2);
      const startPoint = toPoint(conf.centerX, conf.centerY, radius, startDeg);
      const endPoint = toPoint(conf.centerX, conf.centerY, radius, endDeg);
      guidePaths.push(`<path d="M ${startPoint.x.toFixed(2)} ${startPoint.y.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 0 1 ${endPoint.x.toFixed(2)} ${endPoint.y.toFixed(2)}"></path>`);

      const leftLabel = toPoint(conf.centerX, conf.centerY, radius + 36, startDeg - 2.5);
      const rightLabel = toPoint(conf.centerX, conf.centerY, radius + 36, endDeg + 2.5);
      rowTagHtml.push(`<span class="row-tag" style="left:${(leftLabel.x / 10).toFixed(2)}%; top:${(leftLabel.y / 9).toFixed(2)}%;">${row.row}</span>`);
      rowTagHtml.push(`<span class="row-tag" style="left:${(rightLabel.x / 10).toFixed(2)}%; top:${(rightLabel.y / 9).toFixed(2)}%;">${row.row}</span>`);

      const angles = seatAngles(activeSection, rowIndex, row.seats);
      angles.forEach((deg, index) => {
        const number = index + 1;
        const code = seatCode(activeSection, row.row, number);
        const label = sectionSeatLabel(activeSection, row.row, number);
        const point = toPoint(conf.centerX, conf.centerY, radius, deg);
        const status = getSeatStatus(event, code);
        const isSelected = selectedSeats.some(item => item.code === code);
        const finalStatus = isSelected ? "selected" : status;
        const disabled = status !== "available" ? "disabled" : "";
        const title = `${label} · ${statusLabel(finalStatus)}`;
        seatButtons.push(`
          <button
            class="seat-pos ${finalStatus} ${conf.seatClass}"
            type="button"
            data-code="${code}"
            data-label="${label}"
            data-row="${row.row}"
            data-number="${number}"
            data-section="${activeSection.id}"
            data-status="${finalStatus}"
            title="${title}"
            style="left:${(point.x / 10).toFixed(2)}%; top:${(point.y / 9).toFixed(2)}%;"
            ${disabled}
          ></button>
        `);
      });
    });

    guideSvg.innerHTML = `
      ${guidePaths.join("")}
      <path class="guide-center" d="M 500 182 L 500 690"></path>
      <path class="aisle-line" d="M 465 236 Q 500 438 500 660"></path>
      <path class="aisle-line" d="M 535 236 Q 500 438 500 660"></path>
    `;
    rowLabels.innerHTML = rowTagHtml.join("");
    map.innerHTML = seatButtons.join("");

    $$(".seat-pos", map).forEach(btn => {
      btn.addEventListener("mouseenter", () => {
        renderHoverCard(activeSection, btn.dataset.row, btn.dataset.number, btn.dataset.label, btn.dataset.status);
      });

      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const code = btn.dataset.code;
        const label = btn.dataset.label;
        const row = btn.dataset.row;
        const number = Number(btn.dataset.number);
        const exists = selectedSeats.find(item => item.code === code);
        if (exists) {
          selectedSeats = selectedSeats.filter(item => item.code !== code);
        } else {
          if (selectedSeats.length >= 8) {
            alert("La simulación permite hasta 8 butacas por compra.");
            return;
          }
          selectedSeats.push({ code, label, row, number, sectionId: activeSection.id, sectionName: activeSection.name });
          selectedSeats.sort((a, b) => a.row.localeCompare(b.row) || a.number - b.number);
        }
        renderSeatMap();
        updateSummary();
      });
    });
  }

  viewOverviewBtn?.addEventListener("click", () => setView("overview"));
  viewDetailBtn?.addEventListener("click", () => setView("detail"));
  $("#zoomIn")?.addEventListener("click", () => applyZoom(currentZoom + 0.1));
  $("#zoomOut")?.addEventListener("click", () => applyZoom(currentZoom - 0.1));
  $("#zoomReset")?.addEventListener("click", () => applyZoom(1));
  zoomRange?.addEventListener("input", () => applyZoom(zoomRange.value));

  $("#continueCheckout")?.addEventListener("click", () => {
    if (!selectedSeats.length) {
      alert("Selecciona al menos una butaca para continuar.");
      return;
    }
    storage.setCart({
      eventSlug: event.slug,
      eventTitle: event.title,
      city: event.city,
      venue: event.venue,
      dateLabel: event.dateLabel,
      time: event.time,
      sectionId: activeSection.id,
      sectionName: activeSection.name,
      sectionShort: activeSection.shortCode,
      price: activeSection.price,
      seats: selectedSeats,
      qty: selectedSeats.length,
      total: activeSection.price * selectedSeats.length
    });
    window.location.href = "checkout.html";
  });

  $("#clearSelection")?.addEventListener("click", () => {
    selectedSeats = [];
    renderSeatMap();
    updateSummary();
  });

  renderTabs();
  renderOverviewMap();
  renderSeatMap();
  updateSummary();
  setView("overview");
  applyZoom(1);
}

  function buildCheckoutLayout(cart) {
    return `
      <section class="summary-card">
        <span class="kicker">Datos del comprador</span>
        <h3>Finalizar compra</h3>
        <p>Completa los datos y genera los boletos digitales de la simulación.</p>

        <div class="field-grid">
          <label class="field-wrap">
            <span>Nombre</span>
            <input id="buyerName" class="field" type="text" placeholder="Nombre del comprador" />
          </label>
          <label class="field-wrap">
            <span>Correo</span>
            <input id="buyerEmail" class="field" type="email" placeholder="correo@ejemplo.com" />
          </label>
          <label class="field-wrap">
            <span>Teléfono</span>
            <input id="buyerPhone" class="field" type="tel" placeholder="444 000 0000" />
          </label>
          <label class="field-wrap">
            <span>Evento</span>
            <input class="field" type="text" value="${cart.eventTitle}" disabled />
          </label>
        </div>

        <div class="split-actions" style="margin-top:20px;">
          <a href="evento.html?slug=${encodeURIComponent(cart.eventSlug)}" class="btn btn-secondary">Volver al layout</a>
          <button id="confirmCheckout" class="btn btn-primary">Pagar y generar boletos</button>
        </div>
      </section>

      <aside class="summary-card">
        <span class="kicker">Resumen</span>
        <h3>Detalle de la orden</h3>
        <div class="summary-list">
          <div class="summary-item"><span>Evento</span><strong>${cart.eventTitle}</strong></div>
          <div class="summary-item"><span>Sede</span><strong>${cart.venue}</strong></div>
          <div class="summary-item"><span>Sección</span><strong>${cart.sectionName}</strong></div>
          <div class="summary-item"><span>Precio unitario</span><strong>${formatMXN(cart.price)}</strong></div>
          <div class="summary-item"><span>Boletos</span><strong>${cart.qty}</strong></div>
          <div class="summary-item"><span>Total</span><strong>${formatMXN(cart.total)}</strong></div>
        </div>
        <hr class="soft" />
        <strong style="display:block;margin-bottom:12px;">Butacas seleccionadas</strong>
        <div class="selection-pills">
          ${cart.seats.map(seat => `<span class="selection-pill">${seat.label}</span>`).join("")}
        </div>
      </aside>
    `;
  }

  function makeOrderCode() {
    return `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;
  }

  function makeTicketFolio(index) {
    return `TDP-${Date.now().toString().slice(-6)}-${String(index).padStart(2, "0")}`;
  }

  function renderCheckout() {
    if (document.body.dataset.page !== "checkout") return;
    const wrap = $("#checkoutWrap");
    if (!wrap) return;
    const cart = storage.getCart();

    if (!cart || !cart.seats || !cart.seats.length) {
      wrap.innerHTML = `
        <div class="empty-state">
          <h3>No hay una selección activa</h3>
          <p>Primero elige tus butacas en el layout del Teatro de la Paz.</p>
          <div class="split-actions" style="justify-content:center;">
            <a href="evento.html?slug=teatro-de-la-paz-slp" class="btn btn-primary">Ir al layout</a>
            <a href="eventos.html" class="btn btn-secondary">Ver eventos</a>
          </div>
        </div>
      `;
      return;
    }

    wrap.innerHTML = buildCheckoutLayout(cart);

    $("#confirmCheckout")?.addEventListener("click", () => {
      const buyerName = ($("#buyerName")?.value || "").trim();
      const buyerEmail = ($("#buyerEmail")?.value || "").trim();
      const buyerPhone = ($("#buyerPhone")?.value || "").trim();

      if (!buyerName || !buyerEmail) {
        alert("Captura nombre y correo para continuar.");
        return;
      }

      const orderCode = makeOrderCode();
      const now = new Date().toISOString();
      const tickets = cart.seats.map((seat, idx) => ({
        folio: makeTicketFolio(idx + 1),
        eventSlug: cart.eventSlug,
        eventTitle: cart.eventTitle,
        city: cart.city,
        venue: cart.venue,
        dateLabel: cart.dateLabel,
        time: cart.time,
        sectionId: cart.sectionId,
        sectionName: cart.sectionName,
        seatCode: seat.code,
        seatLabel: seat.label,
        qrPayload: JSON.stringify({
          folio: `SIM-${idx + 1}`,
          evento: cart.eventTitle,
          seccion: cart.sectionId,
          asiento: seat.label
        }),
        usedAt: null
      }));

      const order = {
        code: orderCode,
        eventSlug: cart.eventSlug,
        eventTitle: cart.eventTitle,
        sectionId: cart.sectionId,
        sectionName: cart.sectionName,
        qty: cart.qty,
        total: cart.total,
        price: cart.price,
        buyer: {
          name: buyerName,
          email: buyerEmail,
          phone: buyerPhone
        },
        purchasedAt: now,
        tickets
      };

      const orders = storage.getOrders();
      orders.unshift(order);
      storage.setOrders(orders);
      storage.clearCart();
      window.location.href = `mis-boletos.html?order=${encodeURIComponent(order.code)}`;
    });
  }

  function drawQrLike(canvas, text) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const modules = 29;
    const size = 150;
    const cell = size / modules;
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);

    function hashString(value) {
      let hash = 2166136261;
      for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
      }
      return hash >>> 0;
    }

    function drawFinder(x, y) {
      ctx.fillStyle = "#000";
      ctx.fillRect(x * cell, y * cell, 7 * cell, 7 * cell);
      ctx.fillStyle = "#fff";
      ctx.fillRect((x + 1) * cell, (y + 1) * cell, 5 * cell, 5 * cell);
      ctx.fillStyle = "#000";
      ctx.fillRect((x + 2) * cell, (y + 2) * cell, 3 * cell, 3 * cell);
    }

    drawFinder(1, 1);
    drawFinder(modules - 8, 1);
    drawFinder(1, modules - 8);

    let hash = hashString(text);
    for (let y = 0; y < modules; y += 1) {
      for (let x = 0; x < modules; x += 1) {
        const inFinder =
          (x >= 1 && x <= 7 && y >= 1 && y <= 7) ||
          (x >= modules - 8 && x <= modules - 2 && y >= 1 && y <= 7) ||
          (x >= 1 && x <= 7 && y >= modules - 8 && y <= modules - 2);
        if (inFinder) continue;
        hash = (hash * 1664525 + 1013904223) >>> 0;
        const on = ((hash >> 5) & 1) === 1;
        if (on) {
          ctx.fillStyle = "#000";
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
  }

  function renderTickets() {
    if (document.body.dataset.page !== "tickets") return;
    const wrap = $("#ticketsWrap");
    if (!wrap) return;
    const orders = storage.getOrders();

    if (!orders.length) {
      wrap.innerHTML = `
        <div class="empty-state">
          <h3>Aún no hay boletos emitidos</h3>
          <p>Realiza una compra demo para que los tickets aparezcan aquí.</p>
          <div class="split-actions" style="justify-content:center;">
            <a href="evento.html?slug=teatro-de-la-paz-slp" class="btn btn-primary">Comprar boletos</a>
          </div>
        </div>
      `;
      return;
    }

    const orderQuery = new URLSearchParams(window.location.search).get("order");
    const filteredOrders = orderQuery ? orders.filter(order => order.code === orderQuery) : orders;

    wrap.innerHTML = filteredOrders.flatMap(order => order.tickets.map(ticket => `
      <article class="ticket-card">
        <div>
          <span class="kicker">Boleto digital</span>
          <h3>${ticket.eventTitle}</h3>
          <p>${ticket.venue} · ${ticket.dateLabel} · ${ticket.time}</p>
          <div class="ticket-tags">
            <span class="tag">${ticket.sectionName}</span>
            <span class="tag">${ticket.seatLabel}</span>
            <span class="tag">${ticket.folio}</span>
            <span class="tag ${ticket.usedAt ? "used" : "ok"}">${ticket.usedAt ? "Acceso usado" : "Disponible"}</span>
          </div>
          <div class="summary-list">
            <div class="summary-item"><span>Comprador</span><strong>${order.buyer.name}</strong></div>
            <div class="summary-item"><span>Correo</span><strong>${order.buyer.email}</strong></div>
            <div class="summary-item"><span>Orden</span><strong>${order.code}</strong></div>
            <div class="summary-item"><span>Emitido</span><strong>${formatDateTime(order.purchasedAt)}</strong></div>
          </div>
        </div>
        <div class="ticket-qr">
          <canvas class="ticket-canvas" data-folio="${ticket.folio}"></canvas>
          <strong style="display:block;margin-top:12px;">QR visual demo</strong>
          <p style="margin-top:8px;">Folio de acceso: <strong>${ticket.folio}</strong></p>
        </div>
      </article>
    `)).join("");

    $$(".ticket-canvas", wrap).forEach(canvas => drawQrLike(canvas, canvas.dataset.folio || ""));
  }

  function buildScanStats() {
    const tickets = getAllTickets();
    const used = tickets.filter(ticket => ticket.usedAt).length;
    const pending = tickets.length - used;
    const stats = $("#scannerStats");
    if (!stats) return;
    stats.innerHTML = `
      <div class="summary-item"><span>Boletos emitidos</span><strong>${tickets.length}</strong></div>
      <div class="summary-item"><span>Accesos usados</span><strong>${used}</strong></div>
      <div class="summary-item"><span>Pendientes</span><strong>${pending}</strong></div>
      <div class="summary-item"><span>Evento</span><strong>${mainEvent ? mainEvent.title : "Demo"}</strong></div>
    `;
  }

  function renderScanner() {
    if (document.body.dataset.page !== "scanner") return;
    const select = $("#scannerSelect");
    const tickets = getAllTickets();
    if (select) {
      select.innerHTML = `<option value="">Selecciona un boleto</option>` + tickets.map(ticket => `
        <option value="${ticket.folio}">${ticket.folio} · ${ticket.seatLabel} · ${ticket.sectionName}</option>
      `).join("");
    }
    buildScanStats();

    function paintRecentScans() {
      const wrap = $("#recentScansWrap");
      if (!wrap) return;
      const scans = storage.getRecentScans();
      if (!scans.length) {
        wrap.innerHTML = `
          <div class="empty-state">
            <h3>Sin lecturas todavía</h3>
            <p>Los accesos validados aparecerán aquí en tiempo real dentro de la demo.</p>
          </div>
        `;
        return;
      }
      wrap.innerHTML = scans.map(scan => `
        <article class="scan-card">
          <h3>${scan.folio}</h3>
          <p>${scan.eventTitle} · ${scan.sectionName} · ${scan.seatLabel}</p>
          <div class="ticket-tags">
            <span class="tag ${scan.status === "Aprobado" ? "ok" : scan.status === "Duplicado" ? "used" : "pending"}">${scan.status}</span>
          </div>
          <p style="margin-top:8px;">${scan.message}</p>
          <p style="margin-top:8px;"><strong>${formatDateTime(scan.at)}</strong></p>
        </article>
      `).join("");
    }

    function saveTicketUpdate(folio, updater) {
      const orders = storage.getOrders().map(order => ({
        ...order,
        tickets: (order.tickets || []).map(ticket => ticket.folio === folio ? updater(ticket) : ticket)
      }));
      storage.setOrders(orders);
    }

    function validateFolio(folio) {
      const result = $("#scannerResult");
      const ticket = getAllTickets().find(item => item.folio === folio);
      const scans = storage.getRecentScans();

      if (!folio) {
        result.className = "scan-result warn";
        result.innerHTML = `<strong>Sin folio</strong><p style="margin-top:8px;">Captura o selecciona un folio antes de validar.</p>`;
        return;
      }

      if (!ticket) {
        const at = new Date().toISOString();
        scans.unshift({ folio, eventTitle: "No encontrado", sectionName: "-", seatLabel: "-", status: "Inválido", message: "El folio no existe en la simulación.", at });
        storage.setRecentScans(scans);
        result.className = "scan-result error";
        result.innerHTML = `<strong>Boleto inválido</strong><p style="margin-top:8px;">No existe un ticket con ese folio en la simulación.</p>`;
        paintRecentScans();
        return;
      }

      if (ticket.usedAt) {
        const at = new Date().toISOString();
        scans.unshift({ folio, eventTitle: ticket.eventTitle, sectionName: ticket.sectionName, seatLabel: ticket.seatLabel, status: "Duplicado", message: "Este boleto ya fue utilizado anteriormente.", at });
        storage.setRecentScans(scans);
        result.className = "scan-result warn";
        result.innerHTML = `
          <strong>Acceso ya utilizado</strong>
          <p style="margin-top:8px;">${ticket.folio} · ${ticket.seatLabel} ya fue validado el ${formatDateTime(ticket.usedAt)}.</p>
        `;
        paintRecentScans();
        buildScanStats();
        return;
      }

      const usedAt = new Date().toISOString();
      saveTicketUpdate(folio, ticketItem => ({ ...ticketItem, usedAt }));
      scans.unshift({ folio, eventTitle: ticket.eventTitle, sectionName: ticket.sectionName, seatLabel: ticket.seatLabel, status: "Aprobado", message: "Acceso permitido. Ticket validado correctamente.", at: usedAt });
      storage.setRecentScans(scans);
      result.className = "scan-result ok";
      result.innerHTML = `
        <strong>Acceso permitido</strong>
        <p style="margin-top:8px;">${ticket.eventTitle} · ${ticket.sectionName} · ${ticket.seatLabel}</p>
        <p style="margin-top:8px;"><strong>${ticket.folio}</strong> validado correctamente.</p>
      `;
      buildScanStats();
      paintRecentScans();
    }

    $("#scannerValidate")?.addEventListener("click", () => {
      const folio = ($("#scannerInput")?.value || $("#scannerSelect")?.value || "").trim();
      validateFolio(folio);
    });

    $("#scannerSelect")?.addEventListener("change", () => {
      const selectValue = $("#scannerSelect")?.value || "";
      if ($("#scannerInput")) $("#scannerInput").value = selectValue;
    });

    $("#resetDemoData")?.addEventListener("click", () => {
      storage.resetDemo();
      window.location.reload();
    });

    paintRecentScans();
  }

  function countSectionTotals(event) {
    return event.sections.map(section => {
      const total = section.rows.reduce((acc, row) => acc + row.seats, 0);
      const soldFromSeed = section.rows.reduce((acc, row) => {
        let count = 0;
        for (let i = 1; i <= row.seats; i += 1) {
          if ((event.demoSoldSeats || []).includes(seatCode(section, row.row, i))) count += 1;
        }
        return acc + count;
      }, 0);
      const soldFromOrders = getAllTickets().filter(ticket => ticket.eventSlug === event.slug && ticket.sectionId === section.id).length;
      return {
        ...section,
        total,
        sold: soldFromSeed + soldFromOrders,
        available: Math.max(total - (soldFromSeed + soldFromOrders), 0)
      };
    });
  }

  function renderPanel() {
    if (document.body.dataset.page !== "panel") return;
    const event = mainEvent;
    const orders = storage.getOrders();
    const tickets = getAllTickets();
    const used = tickets.filter(ticket => ticket.usedAt).length;
    const revenue = orders.reduce((acc, order) => acc + Number(order.total || 0), 0);
    const metrics = $("#panelMetrics");
    if (metrics) {
      metrics.innerHTML = `
        <article class="metric-card"><strong class="big">${tickets.length}</strong><h3>Boletos emitidos</h3><small>Generados en el checkout demo</small></article>
        <article class="metric-card"><strong class="big">${used}</strong><h3>Accesos usados</h3><small>Validados desde el módulo de acceso</small></article>
        <article class="metric-card"><strong class="big">${tickets.length - used}</strong><h3>Pendientes</h3><small>Disponibles para ingreso</small></article>
        <article class="metric-card"><strong class="big">${formatMXN(revenue)}</strong><h3>Venta demo</h3><small>Total acumulado de órdenes simuladas</small></article>
      `;
    }

    const sectionsWrap = $("#panelSections");
    if (sectionsWrap) {
      const totals = countSectionTotals(event);
      sectionsWrap.innerHTML = totals.map(section => `
        <div class="summary-item">
          <div>
            <strong>${section.name}</strong>
            <p style="margin:6px 0 0;color:var(--muted);">${formatMXN(section.price)} · ${section.total} butacas</p>
          </div>
          <div style="text-align:right;">
            <strong>${section.sold} ocupadas</strong>
            <p style="margin:6px 0 0;color:var(--muted);">${section.available} disponibles</p>
          </div>
        </div>
      `).join("");
    }

    const recent = $("#panelRecentScans");
    if (recent) {
      const scans = storage.getRecentScans();
      recent.innerHTML = scans.length ? scans.map(scan => `
        <div class="summary-item">
          <div>
            <strong>${scan.folio}</strong>
            <p style="margin:6px 0 0;color:var(--muted);">${scan.sectionName} · ${scan.seatLabel}</p>
          </div>
          <div style="text-align:right;">
            <strong>${scan.status}</strong>
            <p style="margin:6px 0 0;color:var(--muted);">${formatDateTime(scan.at)}</p>
          </div>
        </div>
      `).join("") : `<div class="empty-state"><h3>Sin lecturas</h3><p>Aún no hay accesos validados en la demo.</p></div>`;
    }

    const ordersWrap = $("#panelOrders");
    if (ordersWrap) {
      if (!orders.length) {
        ordersWrap.innerHTML = `<div class="empty-state"><h3>Sin órdenes</h3><p>Todavía no se generan boletos desde el checkout demo.</p></div>`;
      } else {
        ordersWrap.innerHTML = `
          <table class="table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Comprador</th>
                <th>Sección</th>
                <th>Boletos</th>
                <th>Total</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => `
                <tr>
                  <td>${order.code}</td>
                  <td>${order.buyer.name}</td>
                  <td>${order.sectionName}</td>
                  <td>${order.qty}</td>
                  <td>${formatMXN(order.total)}</td>
                  <td>${formatDateTime(order.purchasedAt)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      }
    }
  }

  function markActiveMenu() {
    const page = document.body.dataset.page;
    const map = {
      home: "index.html",
      events: "eventos.html",
      event: "eventos.html",
      checkout: "eventos.html",
      tickets: "mis-boletos.html",
      scanner: "scanner.html",
      panel: "panel.html"
    };
    const current = map[page];
    if (!current) return;
    $$(".menu a").forEach(link => {
      const href = link.getAttribute("href") || "";
      if ((page === "event" || page === "checkout") && href === "eventos.html") {
        link.classList.add("is-active");
      } else if (href === current) {
        link.classList.add("is-active");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    markActiveMenu();
    renderHome();
    renderEvents();
    renderEvent();
    renderCheckout();
    renderTickets();
    renderScanner();
    renderPanel();
  });
})();
