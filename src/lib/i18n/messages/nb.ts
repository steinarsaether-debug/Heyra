const nbMessages = {
  common: {
    language: "Språk",
    actions: {
      exploreListings: "Utforsk annonser",
      browseServices: "Se tjenester",
      createAccount: "Opprett konto",
      logIn: "Logg inn",
      signOut: "Logg ut",
      search: "Søk",
      save: "Lagre",
      clear: "Nullstill",
      updateSearch: "Oppdater søk",
    },
    legal: {
      privacy: "Personvern",
      terms: "Vilkår",
    },
    roles: {
      landowner: "grunneier",
      hunter: "jeger / fisker",
      admin: "administrator",
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
      explore: "Utforsk",
      listings: "Annonser",
      services: "Tjenester",
      dashboard: "Oversikt",
      more: "Mer",
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
      nearbyFishing: "Fiske i nærheten",
      adminPanel: "Adminpanel",
      backToApp: "Til hovedappen",
    },
    sections: {
      account: "Konto",
      legal: "Juridisk",
      landowner: "Grunneier",
      provider: "Leverandør",
      admin: "Admin",
      discover: "Utforsk",
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
  legalPages: {
    terms: {
      eyebrow: "Vilkår",
      title: "Markedsplassvilkår for Heyra",
      paragraphs: [
        "Heyra fungerer som en markedsplass for jakt, fiske og tilhørende tjenester. Grunneiere publiserer tilgang og opplevelser, jegere og fiskere sender forespørsler, og begge parter følger opp prosessen gjennom plattformen.",
        "En annonse garanterer ikke en bestilling. En bestillingsforespørsel blir først aktiv når grunneieren eller ansvarlig part har godkjent den, og eventuelle krav til kontrakt, betaling eller annen avklaring er gjennomført.",
        "Grunneiere og tilbydere er ansvarlige for at informasjon om område, grenser, regler, tilgjengelighet og praktiske forhold er så korrekt som mulig. Gjester er ansvarlige for å oppgi riktige opplysninger og følge lokale regler, lisenskrav og sikkerhetsforventninger.",
        "Varsler om etterlevelse, som for eksempel overlapp med CWD-sone, er hjelp til arbeidsflyten. De erstatter ikke partenes egne juridiske plikter eller offentlige rapporteringskrav.",
      ],
    },
    privacy: {
      eyebrow: "Personvern",
      title: "Slik håndterer Heyra personopplysninger",
      paragraphs: [
        "Heyra lagrer bare informasjonen som trengs for å drive markedsplassen: kontoid, rolle, profilopplysninger, eiendomsutkast, annonser, bestillinger, samtykker og relevante etterlevelsesmarkører som for eksempel CWD-overlapp.",
        "Sensitive profilopplysninger skilles ut i beskyttede poster, og samtykkehistorikken versjoneres. Valgfritt markedsføringssamtykke holdes adskilt fra de samtykkene som kreves for å bruke tjenesten.",
        "I utviklingsmiljø kan opplastede bilder og vedlegg lagres lokalt sammen med appen. Før produksjonslansering skal lagring, verifikasjonstjenester og betalingsleverandører dokumenteres tydelig her.",
        "Hvis du vil se eller korrigere profildata, bruker du profilsidene i oversikten. Hvis du vil stoppe valgfritt markedsføringssamtykke, kan du oppdatere kakevalgene eller fremtidige kontoinnstillinger.",
      ],
    },
  },
} as const;

export default nbMessages;
