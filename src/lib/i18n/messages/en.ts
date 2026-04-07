const enMessages = {
  common: {
    language: "Language",
    actions: {
      exploreListings: "Explore listings",
      browseServices: "Browse services",
      createAccount: "Create account",
      logIn: "Log in",
      signOut: "Sign out",
      search: "Search",
      save: "Save",
      clear: "Clear",
      updateSearch: "Update search",
    },
    legal: {
      privacy: "Privacy",
      terms: "Terms",
    },
    roles: {
      landowner: "landowner",
      hunter: "hunter / angler",
      admin: "administrator",
    },
  },
  locales: {
    nb: "Bokmål",
    nn: "Nynorsk",
    en: "English",
    sv: "Swedish",
    da: "Danish",
    fi: "Finnish",
    de: "German",
  },
  shell: {
    eyebrow: "Norway outdoors",
    tagline: "Hunting, fishing, and trusted local access",
    nav: {
      home: "Home",
      explore: "Explore",
      listings: "Listings",
      services: "Services",
      dashboard: "Overview",
      more: "More",
      profile: "Profile",
      alerts: "Alerts",
      compliance: "Compliance",
      legal: "Legal",
      bookings: "Bookings",
      myProperties: "My properties",
      marketing: "Marketing",
      addProperty: "Add property",
      payouts: "Payouts",
      reviewQueue: "Review",
      complianceQueue: "Compliance queue",
      trips: "Trips",
      land: "Land",
      account: "Account",
      nearbyFishing: "Nearby fishing",
      adminPanel: "Admin panel",
      backToApp: "Back to app",
    },
    sections: {
      account: "Account",
      legal: "Legal",
      landowner: "Landowner",
      provider: "Provider",
      admin: "Admin",
      discover: "Explore",
    },
    guest: {
      logIn: "Log in",
      createAccount: "Create account",
    },
  },
  home: {
    metadataTitle: "Home",
    eyebrow: "Norwegian hunting and fishing marketplace",
    title: "Hunting and fishing experiences with a brighter, calmer, more usable interface.",
    body:
      "Heyra should still have character, but it also needs to be easy to read and use. This direction keeps the logo and outdoor feel while improving clarity for decisions, operations, and older users.",
    highlights: [
      "Quick discovery of fishing access for travellers who find water along the way.",
      "A hunting flow that respects shared governance and the reality of vald areas.",
      "Local services that make trips easier to plan and carry out.",
    ],
    cardsEyebrow: "Explore",
    cards: {
      listings: {
        title: "Find terrain and waters",
        body:
          "Search hunting and fishing offers across Norway, with faster flows for spontaneous fishing and clearer structure for big-game access.",
      },
      dashboard: {
        title: "Keep the trip in view",
        body:
          "Gather bookings, licences, compliance tasks, and field support in one calm workspace.",
      },
      services: {
        title: "Book local help",
        body:
          "Find dog handlers, butchers, accommodation, and transport around the listings that matter to you.",
      },
      beta: {
        title: "Norway-first launch",
        body:
          "See launch and beta surfaces built around trust, operations, and clarity for further growth.",
      },
    },
  },
  listings: {
    metadataTitle: "Listings",
    metadataFilteredTitle: "Filtered listings",
    metadataDescription: "Browse public hunting and fishing listings across Norway.",
    metadataFilteredDescription: "Filtered public hunting and fishing listings in Norway.",
    eyebrow: "Listings",
    title: "Discover hunting and fishing offers across Norway.",
    body:
      "Search by municipality, species, price, map area, or your own position. This is the main public discovery surface, not just a simple list of published offers.",
    nearbyFishingView: "Fishing-first nearby",
    listView: "List view",
    mapView: "Map view",
    form: {
      searchPlaceholder: "Search by title, municipality, or description",
      municipalityPlaceholder: "Municipality",
      allOfferTypes: "All offer types",
      allSpecies: "All species",
      minPrice: "Min price",
      maxPrice: "Max price",
      allAvailability: "All availability",
      openNow: "Open now",
    },
    offlineOnline:
      "Recently opened listings can be reused more gracefully if signal drops while travelling, but map and nearby search work best with a live connection.",
    offlineOffline:
      "You are offline. Recent results may still exist in local cache, but map search, nearby search, and live availability may be out of date.",
    stats: {
      results: "Results",
      resultsBody: "Published offers match the active filters.",
      nearby: "Nearby",
      nearbyOff: "Off",
      nearbyBody: "Distance-based ranking becomes active when you search near your own position.",
      mapArea: "Map area",
      mapAreaActive: "Active",
      mapAreaAll: "All Norway",
      mapAreaBody: "Pan and zoom the map, then search inside the visible area.",
      api: "API",
      openJson: "Open JSON search",
    },
    empty: "No published listings match this search yet.",
    card: {
      kmAway: "{distance} km away",
      species: "Species",
      pricing: "Pricing",
      availability: "Availability",
      trust: "Trust",
    },
  },
  site: {
    name: "Heyra",
    description:
      "Marketplace for hunting access, fishing licences, and trusted local hosts in Norway.",
  },
  legalPages: {
    terms: {
      eyebrow: "Terms",
      title: "Marketplace terms for Heyra",
      paragraphs: [
        "Heyra operates as a marketplace for hunting, fishing, and related services. Landowners publish access and experiences, hunters and anglers send requests, and both parties manage the process through the platform.",
        "A listing does not guarantee a booking. A booking request only becomes active when the landowner or responsible party has approved it, and any contract, payment, or other required clarifications have been completed.",
        "Landowners and providers are responsible for making information about areas, boundaries, rules, availability, and practical details as accurate as possible. Guests are responsible for giving correct information and following local rules, licence requirements, and safety expectations.",
        "Compliance alerts, such as overlap with a CWD zone, are workflow aids. They do not replace the parties’ own legal duties or public reporting requirements.",
      ],
    },
    privacy: {
      eyebrow: "Privacy",
      title: "How Heyra handles personal data",
      paragraphs: [
        "Heyra stores only the information needed to run the marketplace: account identity, role, profile details, property drafts, listings, bookings, consents, and relevant compliance markers such as CWD overlap.",
        "Sensitive profile data is kept in protected records, and consent history is versioned. Optional marketing consent is kept separate from the consents required to use the service.",
        "In development, uploaded photos and attachments may be stored locally alongside the app. Before production launch, storage, verification services, and payment providers must be documented clearly here.",
        "If you want to review or correct profile data, use the profile pages in the overview. If you want to stop optional marketing consent, you can update cookie choices or future account settings.",
      ],
    },
  },
} as const;

export default enMessages;
