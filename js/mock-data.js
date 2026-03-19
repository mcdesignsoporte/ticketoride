
(function () {
  function rowsFromSpec(spec) {
    return spec.map(([row, seats]) => ({ row, seats }));
  }

  const theatreEvent = {
    id: "TDP-001",
    slug: "teatro-de-la-paz-slp",
    title: "Teatro de la Paz",
    category: "Teatro",
    city: "San Luis Potosí, MX",
    venue: "Teatro de la Paz, S.L.P.",
    date: "2026-03-20",
    dateLabel: "20 Mar 2026",
    time: "8:00 PM",
    heroTag: "Simulación activa",
    status: "Layout listo",
    startingPrice: 350,
    summary: "Simulación de compra con layout de referencia, secciones en español, asientos numerados y control de acceso.",
    description: "Base demo para presentar una boletera funcional del Teatro de la Paz con Planta Baja, Mezzanine y Balcón.",
    sections: [
      {
        id: "PB",
        shortCode: "PB",
        name: "Planta Baja",
        price: 1000,
        colorClass: "pb",
        description: "Zona principal del recinto. Mayor cercanía y precio premium.",
        rows: rowsFromSpec([
          ["A",17],["B",19],["C",21],["D",23],["E",25],
          ["F",27],["G",29],["H",31],["I",33],["J",37],["K",41]
        ])
      },
      {
        id: "MEZ",
        shortCode: "MEZ",
        name: "Mezzanine",
        price: 750,
        colorClass: "mez",
        description: "Sección intermedia con excelente visibilidad y valor balanceado.",
        rows: rowsFromSpec([
          ["A",14],["B",16],["C",18],["D",20],["E",22],["F",24],["G",26],["H",28]
        ])
      },
      {
        id: "BAL",
        shortCode: "BAL",
        name: "Balcón",
        price: 350,
        colorClass: "bal",
        description: "Zona alta del recinto con acceso más económico para el público general.",
        rows: rowsFromSpec([
          ["A",12],["B",14],["C",16],["D",18],["E",20],["F",22]
        ])
      }
    ],
    demoSoldSeats: [
      "PB-A2","PB-A3","PB-B5","PB-B6","PB-C10","PB-D7","PB-E14","PB-F21","PB-H8","PB-I20","PB-K37",
      "MEZ-A4","MEZ-B7","MEZ-C9","MEZ-D12","MEZ-E15","MEZ-H24",
      "BAL-A3","BAL-B9","BAL-C12","BAL-F20"
    ],
    demoHeldSeats: [
      "PB-A1","PB-C11","PB-G15","PB-J18",
      "MEZ-B8","MEZ-F18",
      "BAL-D11","BAL-E14"
    ]
  };

  const supportEvent = {
    id: "TDP-002",
    slug: "teatro-demo-wordpress",
    title: "Demo integración WordPress",
    category: "Concierto",
    city: "San Luis Potosí, MX",
    venue: "Recinto demo",
    date: "2026-04-02",
    dateLabel: "02 Abr 2026",
    time: "9:00 PM",
    heroTag: "Demo secundaria",
    status: "Disponible",
    startingPrice: 450,
    summary: "Evento adicional para mostrar cartelera y navegación.",
    description: "Se conserva como apoyo visual para la lista de eventos.",
    sections: [
      { id:"GEN", shortCode:"GEN", name:"General", price:450, colorClass:"bal", description:"Acceso general", rows: rowsFromSpec([["A",10],["B",12],["C",12]]) }
    ],
    demoSoldSeats: [],
    demoHeldSeats: []
  };

  window.TICKETORIDE_MOCK_DATA = {
    venueReference: {
      name: "Teatro de la Paz, S.L.P."
    },
    events: [theatreEvent, supportEvent]
  };
})();
