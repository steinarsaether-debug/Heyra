const nbMessages = {
  common: {
    language: "Språk",
    actions: {
      exploreListings: "Utforsk annonser",
      browseServices: "Se tjenester",
      createAccount: "Opprett konto",
      logIn: "Logg inn",
      search: "Søk",
      save: "Lagre",
      clear: "Nullstill",
      updateSearch: "Oppdater søk",
    },
    legal: {
      privacy: "Personvern",
      terms: "Vilkår",
    },
  },
  locales: {
    nb: "Bokmål",
    nn: "Nynorsk",
    en: "Engelsk",
    sv: "Svenska",
    da: "Dansk",
    fi: "Suomi",
    de: "Deutsch",
  },
  shell: {
    eyebrow: "Norge ute",
    tagline: "Jakt, fiske og trygg lokal tilgang",
    nav: {
      home: "Hjem",
      listings: "Annonser",
      services: "Tjenester",
      dashboard: "Oversikt",
      profile: "Profil",
      alerts: "Varsler",
      compliance: "Etterlevelse",
      legal: "Juridisk",
      bookings: "Bestillinger",
      myProperties: "Mine eiendommer",
      marketing: "Markedsføring",
      addProperty: "Legg til eiendom",
      payouts: "Utbetalinger",
      reviewQueue: "Gjennomgang",
      complianceQueue: "Etterlevelseskø",
      trips: "Turer",
      land: "Areal",
      account: "Konto",
    },
    guest: {
      logIn: "Logg inn",
      createAccount: "Opprett konto",
    },
  },
  home: {
    metadataTitle: "Hjem",
    eyebrow: "Norsk markedsplass for jakt og fiske",
    title: "Jakt- og fiskeopplevelser med en lysere, roligere og mer brukbar flate.",
    body:
      "Heyra skal fortsatt ha karakter, men det må også være lett å lese og bruke. Denne retningen beholder logoen og naturpreget, men gir bedre oversikt for beslutninger, drift og eldre brukere.",
    highlights: [
      "Rask oppdagelse av fiskemuligheter for reisende som finner vann underveis.",
      "Jaktflyt som tar hensyn til delt styring og vald-virkeligheten.",
      "Lokale tjenester som gjor turen enklere a planlegge og gjennomfore.",
    ],
    cardsEyebrow: "Utforsk",
    cards: {
      listings: {
        title: "Finn terreng og vann",
        body:
          "Søk i jakt- og fisketilbud over hele Norge, med raskere flyt for spontant fiske og tydeligere opplegg for storvilt.",
      },
      dashboard: {
        title: "Hold styr på turen",
        body:
          "Samle bestillinger, lisenser, etterlevelsesoppgaver og felthjelp i ett rolig arbeidsområde.",
      },
      services: {
        title: "Bestill lokal hjelp",
        body:
          "Finn hundeførere, slaktere, overnatting og transport rundt annonsene som betyr noe for deg.",
      },
      beta: {
        title: "Norge-først lansering",
        body:
          "Se lanserings- og betaoverflater bygget rundt tillit, drift og klarhet for videre vekst.",
      },
    },
  },
  listings: {
    metadataTitle: "Annonser",
    metadataFilteredTitle: "Filtrerte annonser",
    metadataDescription: "Se offentlige jakt- og fiskeannonser i hele Norge.",
    metadataFilteredDescription: "Filtrerte offentlige jakt- og fiskeannonser i Norge.",
    eyebrow: "Annonser",
    title: "Oppdag jakt- og fisketilbud over hele Norge.",
    body:
      "Søk på kommune, art, pris, kartutsnitt eller din egen posisjon. Dette er hovedflaten for offentlig oppdagelse, ikke bare en enkel liste over publiserte annonser.",
    nearbyFishingView: "Fiske-først i nærheten",
    listView: "Listevisning",
    mapView: "Kartvisning",
    form: {
      searchPlaceholder: "Søk i tittel, kommune eller beskrivelse",
      municipalityPlaceholder: "Kommune",
      allOfferTypes: "Alle tilbudstyper",
      allSpecies: "Alle arter",
      minPrice: "Min pris",
      maxPrice: "Maks pris",
      allAvailability: "All tilgjengelighet",
      openNow: "Åpen nå",
    },
    offlineOnline:
      "Nylig åpne annonser kan brukes igjen mer robust hvis signalet forsvinner underveis, men kart- og nærsøk fungerer best med aktiv tilkobling.",
    offlineOffline:
      "Du er offline. Nylige resultater kan fortsatt finnes i lokal hurtigbuffer, men kartsøk, nærsøk og direkte tilgjengelighet kan være utdatert.",
    stats: {
      results: "Resultater",
      resultsBody: "Publiserte tilbud matcher de aktive filtrene.",
      nearby: "I nærheten",
      nearbyOff: "Av",
      nearbyBody: "Avstandsbasert rangering er aktiv når du søker nær din egen posisjon.",
      mapArea: "Kartområde",
      mapAreaActive: "Aktivt",
      mapAreaAll: "Hele Norge",
      mapAreaBody: "Panorer og zoom i kartet, og søk deretter i det synlige området.",
      api: "API",
      openJson: "Åpne JSON-søk",
    },
    empty: "Ingen publiserte annonser matcher dette søket ennå.",
    card: {
      kmAway: "{distance} km unna",
      species: "Art",
      pricing: "Pris",
      availability: "Tilgjengelighet",
      trust: "Tillit",
    },
  },
  site: {
    name: "Heyra",
    description:
      "Markedsplass for jaktterreng, fiskekort og trygge lokale verter i Norge.",
  },
} as const;

export default nbMessages;
