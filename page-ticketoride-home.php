
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
  siteName: "Ticketoride Teatro de la Paz Demo"
};

window.TicketorideBridge = {
  async getEvents() {
    return (window.TICKETORIDE_MOCK_DATA && window.TICKETORIDE_MOCK_DATA.events) || [];
  },
  async getEventBySlug(slug) {
    const events = await this.getEvents();
    return events.find(e => e.slug === slug) || events[0];
  },
  async checkout(orderPayload) {
    return { ok: true, mode: window.TicketorideConfig.mode || "mock", order: orderPayload };
  }
};
