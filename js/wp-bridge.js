
window.TicketorideConfig = window.TicketorideConfig || {
  mode: "mock",
  endpoints: {
    events: "/wp-json/ticketoride/v1/events",
    event: "/wp-json/ticketoride/v1/events/{slug}",
    checkout: "/wp-json/ticketoride/v1/checkout",
    tickets: "/wp-json/ticketoride/v1/tickets",
    scan: "/wp-json/ticketoride/v1/scan"
  },
  nonce: null,
  siteName: "Ticketoride"
};

window.TicketorideBridge = {
  async getEvents() {
    if (window.TicketorideConfig.mode === "wordpress" && window.TicketorideConfig.endpoints.events) {
      try {
        const res = await fetch(window.TicketorideConfig.endpoints.events, {
          headers: this._headers()
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn("Fallo endpoint WP, usando mock", err);
      }
    }
    return window.TICKETORIDE_MOCK_DATA.events;
  },
  async getEventBySlug(slug) {
    const events = await this.getEvents();
    return events.find(e => e.slug === slug) || events[0];
  },
  async checkout(orderPayload) {
    if (window.TicketorideConfig.mode === "wordpress" && window.TicketorideConfig.endpoints.checkout) {
      try {
        const res = await fetch(window.TicketorideConfig.endpoints.checkout, {
          method: "POST",
          headers: this._headers({"Content-Type":"application/json"}),
          body: JSON.stringify(orderPayload)
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn("Checkout WP no disponible, usando checkout mock", err);
      }
    }
    return { ok:true, mode:"mock", order: orderPayload };
  },
  _headers(extra = {}) {
    const headers = Object.assign({}, extra);
    if (window.TicketorideConfig.nonce) headers["X-WP-Nonce"] = window.TicketorideConfig.nonce;
    return headers;
  }
};
