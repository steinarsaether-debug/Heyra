# Project Heyra — Platform Plan & Development Roadmap

---

## Executive Summary

Project Heyra is a full-stack, AirBnB-style marketplace for hunting and fishing access in Norway, designed to connect landowners (grunneiere) who hold exclusive wildlife rights with hunters and fishers seeking legal, premium-quality experiences on private land. The platform goes beyond the transactional licence-selling model of incumbents like [Inatur.no](https://www.inatur.no) by layering in compliance tooling, a community services marketplace (guides, dog handlers, butchers, veterinarians, accommodation), verified identity flows via [BankID](https://www.bankid.no) and [Vipps Login](https://vipps.no), and automated generation of the legally-required written hunting contracts mandated by [Viltloven §28](https://lovdata.no/lov/1981-05-29-38/§28).

The Norwegian market provides a concentrated and underserved launchpad: [SSB data for 2024–2025](https://www.ssb.no/en/jord-skog-jakt-og-fiskeri/jakt/statistikk/registrerte-jegere) records 550,846 registered hunters and 171,738 who paid the jegeravgift in the most recent hunting year, plus millions of freshwater fishing cards sold annually through platforms like [Inatur.no](https://www.inatur.no) — the primary incumbent. The global wildlife hunting tourism market is projected to grow from USD 666.9 million in 2025 to USD 2.6 billion by 2032 at a CAGR of 21.7% ([Coherent Market Insights](https://www.coherentmarketinsights.com/market-insight/wildlife-hunting-tourism-market-4922)), with Scandinavia representing a structurally underserved premium segment due to strong landowner property rights, high per-capita incomes, and deep outdoor cultural heritage.

Heyra's phased expansion follows a natural path: Phase 1 (Norway, Years 1–2) establishes the legal template, brand, and technical foundation; Phase 2 (Nordic — Sweden, Denmark, Finland, Months 7–18) leverages the closely-aligned legal traditions and payment infrastructure; Phase 3 (Europe — Germany, Austria, Scotland, Spain, Year 2+) adapts the modular platform to continental hunting regulation frameworks. The core differentiator versus Inatur.no is not a feature list but an experience stack: Heyra treats each hunt as a curated, bookable experience with verified identities, embedded contracts, compliance automation, local service bundling, and two-way reputation, rather than a bare licence transaction.

---

## Market Analysis

### Norwegian Hunting & Fishing Market

Norway's hunting and fishing culture is one of the most deeply embedded in Europe. According to [SSB's Register of Hunters](https://www.ssb.no/en/jord-skog-jakt-og-fiskeri/jakt/statistikk/registrerte-jegere), there are 550,846 registered hunters in Norway as of the 2024–2025 hunting year, of whom 171,738 paid the jegeravgift (hunting licence fee) — the prerequisite for legal hunting. Every one of those active hunters must secure land access independently each season, typically through informal networks, local hunting associations (NJFF), or platforms like Inatur.no. The current market for freshwater fishing cards is substantially larger: Inatur.no alone lists fishing licences for thousands of lakes and rivers across Norway, with millions of individual fiskekort transactions annually. Premium salmon rivers such as Alta, Gaula, and Namsen attract domestic and international anglers willing to pay NOK 500–1,500+ per day ([Fishing World Guide](https://www.fishingworldguide.com/en/blog/fishing-in-norway)).

The active hunting population skews male (90% of licence payers) and middle-aged, but younger cohorts are entering: 17% of licence payers under 30 are women, reflecting a generational diversification of the sport ([SSB 2025](https://www.ssb.no/jord-skog-jakt-og-fiskeri/jakt/statistikk/registrerte-jegere/artikler/stor-nedgang-i-betalende-jegere)). Foreign hunters from 36 nationalities paid the Norwegian jegeravgift in 2024–2025, with Danish and Swedish hunters representing the largest cohorts, demonstrating natural cross-border demand that Phase 2 directly addresses.

### Current Pain Points for Landowners

- **Access friction**: Most landowners lease hunting rights through informal networks, NJFF local boards, or municipal notices. No professional marketplace supports discovery by motivated, verified hunters.
- **Legal exposure**: Written contracts are legally required under Viltloven §28 but frequently not executed, leaving landowners with inadequate legal protection.
- **Revenue opportunity missed**: Many landowners — particularly private forestry estates, farms, and mountain properties — hold significant wildlife habitat with no mechanism to monetise it efficiently. A single moose quota (elgkvote) can command NOK 5,000–20,000 per animal from experienced hunters.
- **No compliance support**: Landowners are legally responsible for verifying that hunters have paid jegeravgift. No existing tool streamlines this.
- **Insurance uncertainty**: When strangers with firearms access their land, landowners need clear liability frameworks. None are currently embedded in any Norwegian platform.

### Current Pain Points for Hunters and Fishers

- **Land access is opaque**: Finding available, high-quality hunting ground outside of personal networks requires time-intensive outreach with no price transparency or quality signals.
- **No reviews or reputation**: There is no mechanism for hunters to evaluate a landowner's offering before booking, or for landowners to screen hunters.
- **Fragmented service ecosystem**: A productive hunt requires a tracking dog handler (legally required for big game), local transportation, a butcher for processing, and often accommodation. These must all be arranged separately.
- **Compliance complexity**: Harvest reporting requirements (Hjorteviltregisteret, SSB/Altinn, CWD sampling) are poorly understood, particularly by younger hunters and foreign visitors.
- **Digital experience gap**: Inatur.no's UX, built 22 years ago ([Rayon](https://rayon.no/project/inatur)), has not evolved to the standard users now expect from consumer platforms.

### Competitive Landscape

| Platform | Geography | Core Offering | Land Listing | Experience Booking | Compliance Tools | Service Marketplace | Identity Verification | Reviews |
|---|---|---|---|---|---|---|---|---|
| [Inatur.no](https://www.inatur.no) | Norway | Fishing cards, hunting licences, cabin rental | Basic | Licence only | None | None | None | None |
| [LandTrust](https://landtrust.com) | USA (40+ states) | Private land booking for hunters & anglers | Rich (maps, photos, acres) | Day/session booking | None | None | Basic | Yes |
| [BirdDog Adventure](https://www.birddog.com) | USA (60+ ranches) | Curated hunting ranch experiences | Curated/editorial | Full booking | None | Partial (guides) | None | Partial |
| [HuntBNB](https://www.huntbnb.com) | USA | Lodging + hunting access | Moderate | Lodging + access | None | None | None | Yes |
| Hubertus Worldwide | Europe (broad) | Trophy hunting travel agency | None (agency) | Agency-arranged | None | None | None | None |
| **Project Heyra** | **Norway → Nordic → EU** | **Full-stack hunting/fishing marketplace** | **Rich + map + legal** | **Full booking + contract** | **Full compliance suite** | **Full (guide, butcher, vet, transport)** | **BankID/Vipps mandatory** | **Two-way, verified** |

### Market Gap and Heyra's Positioning

No platform in any Scandinavian market offers the combination of: verified land listings with geospatial boundaries, legally-compliant auto-generated contracts, integrated wildlife compliance reminders, local service marketplace, and BankID-verified identities. Inatur.no holds strong brand equity as the transaction layer for fishing cards and basic hunting licences, but it explicitly does not position itself as an experience platform, guide marketplace, or compliance partner. Heyra's positioning is premium, trust-first, and compliance-native — capturing the segment of hunters and landowners who want professional-grade booking rather than a transactional licence kiosk.

---

## Legal & Regulatory Framework

### Hunting Rights & Leasing (Norway)

#### Viltloven §27: Exclusive Hunting Rights

[Viltloven §27](https://lovdata.no/lov/1981-05-29-38/§27) (the Wildlife Act of 29 May 1981) establishes that landowners hold exclusive rights to hunt and trap game on their own land — *enerett til jakt og fangst*. This right is intrinsic to land ownership and cannot be exercised by any other party without an explicit grant of permission from the landowner. For the platform, this means that every listing must originate with the verified landowner or their duly authorised representative; no third party may list or sub-let hunting rights without the landowner's explicit involvement.

#### Viltloven §28: Lease Requirements — Critical Platform Constraint

[Viltloven §28](https://lovdata.no/lov/1981-05-29-38/§28) establishes binding requirements for the leasing of hunting rights:

1. **Written form mandatory**: Every lease of hunting rights (*jaktleie*) must be in writing. Oral agreements are not legally enforceable.
2. **Maximum term**: A hunting rights lease may not exceed 10 years at a time. Shorter fixed-term leases are standard.
3. **Municipal notification**: Leases exceeding five years must be notified to the municipality.
4. **Sub-leasing prohibited without permission**: The lessee (hunter) cannot sub-let (*fremleie*) the hunting rights to a third party without the explicit written consent of the original rights holder.

**Critical platform design implication — Heyra as facilitator, not sub-lessor**: Point 4 above means that the platform itself must never be the contracting party in a hunting lease. If Heyra were to hold a master lease from a landowner and then "sub-let" access to hunters, this would constitute illegal fremleie. The legally compliant architecture is that Heyra functions as a marketplace facilitator: the contract (*jaktavtale*) is between the landowner and the hunter directly, with the platform generating, managing, and archiving the agreement on their behalf. This is structurally analogous to how Airbnb's host-guest contract is a direct relationship, with Airbnb as the payment and logistics intermediary, not the party in the accommodation contract.

The platform's Terms of Service must make this explicit, and legal counsel with a Norwegian specialist in viltrett should validate the contract template before launch.

#### Landowner Obligations

- **Jegeravgift verification**: [Brønnøysundregistrene](https://www.brreg.no/jegerregisteret/) (the Register of Hunters) records all jegeravgift payments. Landowners are legally responsible for confirming that every hunter on their land has paid. The platform facilitates this by prompting the hunter to self-attest and provide their hunter number, and by deep-linking to [brreg.no's foreign hunter lookup](https://www.brreg.no/jegerregisteret/foreign-hunters/) for international guests.
- **Damage liability**: Landowners assume general property liability for lawful guests. Platform insurance partnership (see Insurance section) provides a backstop analogous to AirCover.
- **Quota compliance**: For species with municipal quotas (moose, red deer), the landowner's vald-level quota allocation must be visible on the listing to prevent over-booking beyond legal limits.

### Fishing Rights (Norway)

#### Freshwater Fishing Rights

Freshwater fishing rights in Norway are owned by the riparian landowners, identical in structure to hunting rights. The governing law is [Lakse- og innlandsfiskloven](https://lovdata.no/lov/1992-05-15-47) (the Salmon and Inland Fisheries Act). A fisher wishing to access a private river or lake must obtain a fiskekort from the landowner or their designated licensor (often a fishing association). The platform facilitates this in the same contractual structure as hunting leases: the agreement is between landowner and fisher, with Heyra as the payment and documentation intermediary.

#### Fisketrygdavgift (State Fishing Fee)

Any angler targeting salmon (*laks*), sea trout (*sjøørret*), or Arctic char (*røye*) in Norwegian rivers must purchase the national fisketrygdavgift in addition to the local fiskekort. The 2026 rate is NOK 220/year for individuals or NOK 355/year for families ([Fishing World Guide](https://www.fishingworldguide.com/en/blog/fishing-in-norway)). The platform must surface this requirement in the booking flow for any salmon/sea trout listing, with a direct link to the payment portal. Failure to hold this fee makes the fishing session illegal, exposing both the angler and potentially the landowner.

#### Fishing Camp Reporting

Operators of registered salmon fishing camps (laksefiskevær) have statutory reporting obligations to Miljødirektoratet and Statsforvalteren. The platform's compliance module must prompt registered fishing camp operators to file their season harvest reports.

### Wildlife Reporting & Compliance

The Norwegian compliance landscape for hunters is more detailed than most European jurisdictions. The table below maps the principal obligations:

| Species / Category | Reporting Requirement | System | Deadline | CWD Risk? |
|---|---|---|---|---|
| Moose (*elg*) | Harvest by sex/age per vald | [Hjorteviltregisteret](https://www.hjorteviltregisteret.no) | Within 14 days of season end | Yes — targeted zones |
| Red deer (*hjort*) | Harvest by sex/age per vald | [Hjorteviltregisteret](https://www.hjorteviltregisteret.no) | Within 14 days of season end | Yes — scattered cases |
| Roe deer (*rådyr*) | Annual harvest report | [SSB via Altinn](https://www.ssb.no) | May 1 | Rare |
| Wild reindeer (*villrein*) | Harvest by sex/age | [Hjorteviltregisteret](https://www.hjorteviltregisteret.no) | Within 14 days | Yes — Hardangervidda, Nordfjella |
| Small game (grouse, hare, etc.) | Annual catch report | SSB/Altinn | May 1 | No |
| Daily moose observations | "Sett og skutt" daily log | Hjorteviltregisteret app | During moose season (daily) | N/A |
| Snaring (*villfangst*) | Pre-notification + post-season report | Municipal wildlife board | 10 days before + 10 days after | No |
| Salmon | Camp/beats harvest report | Fisheries directorate | End of season | N/A |
| All hunters paying jegeravgift | Annual catch report | [SSB via Altinn](https://www.ssb.no) | May 1 (NOK 260 late penalty) | N/A |

#### CWD (Chronic Wasting Disease) Surveillance

CWD was first detected in Europe in Norway in 2016. The [Veterinary Institute's 2024 surveillance report](https://www.vetinst.no) confirms that 10,932 cervid samples were analysed in 2024, with two moose testing positive in Nore og Uvdal and Notodden municipalities. The primary CWD outbreak zone remains Nordfjella (wild reindeer population culled in 2018), with Hardangervidda as a secondary risk zone following detections in 2020 and 2022. Hunters harvesting cervids in designated CWD monitoring zones are required to submit brain stem and lymph node samples to the Veterinary Institute for analysis. Platform compliance implications:

- CWD zone GeoJSON boundaries from [Miljødirektoratet](https://www.miljodirektoratet.no) must be overlaid on the listing map.
- Any booking in a CWD zone triggers an automatic in-app alert and sample submission instructions.
- The platform should maintain a contact directory of Statsautorisert veterinærer in each CWD zone to facilitate mandatory sampling.

### GDPR & Data Protection

#### Joint Controller Liability (Post-December 2025 CJEU Ruling)

The Court of Justice of the EU's ruling of 2 December 2025 (Case C-492/23) substantially expands the definition of joint controller liability for marketplace platforms. Platforms that set terms under which personal data is processed — even where the actual data collection is performed by the counterparty (landowner) — can be found to be joint controllers under GDPR Article 26. This eliminates the "neutral intermediary" defence that many platforms have relied upon. Heyra must therefore:

1. **Enter Article 26 Joint Controller Agreements with all landowners** before they go live. This agreement must specify which party is responsible for which data processing activity, how data subject requests are handled, and how breaches are notified.
2. **Appoint a Data Protection Officer (DPO)** if processing reaches the threshold of large-scale processing of personal data (likely from early Phase 1 onward given the sensitive nature of the data: identity documents, firearms permits, location data).
3. **Conduct a Data Protection Impact Assessment (DPIA)** before launch, specifically covering identity verification flows, biometric/eID data handling, and geolocation tracking during hunt logging.
4. **Implement explicit, unbundled consent** checkboxes (never pre-checked) separately for Terms of Service and Privacy Policy, logged with timestamp and policy version.

#### BankID and Vipps Login as Privacy-Preserving Identity

[BankID](https://www.bankid.no) and [Vipps Login](https://vipps.no) both deliver verified name, address, and date of birth without Heyra needing to store copies of physical identity documents. This is a privacy-by-design approach: the verification trust comes from the bank's KYC process, not from Heyra holding raw passport scans. Implementation should use a third-party BankID integration provider such as [Signicat](https://www.signicat.com) or [Criipto](https://www.criipto.com) to avoid the significant compliance overhead of direct integration.

#### Data Minimisation Strategy

- Collect only the fields strictly necessary at each stage (progressive disclosure pattern).
- Hunting licence status: self-attestation + hunter number, not a copy of the licence document.
- Shooting certificate (storviltprøve): store a hash/reference, not the raw PDF, after verification.
- Payment data: never stored directly; delegated entirely to Stripe and Vipps.
- GPS harvest logs: collected at hunter consent, stored under the hunter's account, shared with landowner only with consent.

#### Data Retention

- Booking contracts: retained 5 years (Norwegian VAT/accounting law, Bokføringsloven).
- PII: anonymised after 24 months of account inactivity, with exception for ongoing legal matters.
- Right to erasure: implemented as soft-delete + anonymisation. Contract data (legal obligation) cannot be erased but is severed from identifying PII.

### Insurance & Liability

Hunting involves firearms, animals, and remote terrain — a liability-intensive combination. The platform must address three insurance layers:

**Landowner liability**: When a lawful guest is injured on the landowner's property during a hunting session, Norwegian torts law (skadeserstatningsloven) applies. Landowners should hold an expanded property liability policy (*ansvarsforsikring*) covering hunting guests. The platform should partner with a major Nordic insurer — [Gjensidige](https://www.gjensidige.no), [If Forsikring](https://www.if.no), or [Tryg](https://www.tryg.no) — to offer an embedded insurance product at listing creation. This is analogous to AirCover (Airbnb's host protection) and is a key trust-building feature.

**Hunter personal accident insurance**: Active hunters should be recommended to carry personal accident (*ulykkesforsikring*) and third-party liability (*ansvarsforsikring for jegere*) coverage. The platform surfaces this at booking confirmation.

**Platform liability**: Heyra as facilitator takes no contractual position in the hunt itself, but should carry professional liability (E&O) and cyber/GDPR insurance appropriate for a marketplace platform processing sensitive personal data.

The partnership model — where Gjensidige, If, or Tryg offer an embedded, co-branded insurance product via API at listing creation — creates both a revenue stream (referral/revenue share) and a trust signal that differentiates Heyra from bare transaction platforms.

---

## Platform Architecture & Features

### Core User Roles

1. **Landowner (Grunneier)** — Lists land, sets pricing and quotas, approves/rejects bookings, receives payouts, manages compliance documentation.
2. **Hunter/Fisher (Jeger/Fisker)** — Discovers listings, requests bookings, completes contracts, pays, logs harvests, submits compliance reports.
3. **Service Provider (Tjenesteleverandør)** — Lists a local service (guide, dog handler, butcher, vet, transport, accommodation, taxidermist), manages availability and bookings.
4. **Platform Admin** — Reviews new listings, mediates disputes, monitors compliance flags, manages payouts and fraud.

### Landowner Registration & Listing

Onboarding a landowner is the most compliance-sensitive flow on the platform. Fields required:

```
Identity:
  - BankID verification (mandatory for Norwegian landowners)
  - Full legal name, fødselsnummer (national ID)
  - Contact address, phone, email
  - Bank account for payouts (Stripe Connect Custom account onboarding)

Property:
  - Cadastral number (gårds-/bruksnummer — required to verify ownership via Kartverket)
  - Area size (hectares)
  - County (fylke) + municipality (kommune)
  - Interactive boundary drawing on Norgeskart map
  - Terrain type: forest, mountain, fjord, wetland, farmland, coastal

Rights Documentation:
  - Hunting/fishing rights confirmation (landowner self-declaration + cadastral number match)
  - Upload of any existing lease agreements or exclusion areas
  - Property deed or other ownership documentation (optional, for premium verification badge)

Wildlife & Quota:
  - Species present (multi-select: elg, hjort, rådyr, villrein, rev, rype, hare, ender, etc.)
  - Population estimates (optional but boosts listing credibility)
  - Moose quota per vald (elgkvote) — mandatory for big game listings
  - Fishing species (laks, ørret, abbor, gjedde, etc.)
  - Season availability calendar

Infrastructure:
  - Cabins/accommodation on property (Y/N, capacity, amenities)
  - Vehicle access (road quality, parking capacity)
  - Hunting infrastructure: hides (jaktstige/jaktskjul), saltlicks, game trails mapped
  - Boats/watercraft available (for fishing listings)
  - Butchering facilities on-site (frysehus, slakteplasser)

Pricing:
  - Per day / per season / per animal (species-specific)
  - Group discounts
  - Deposit percentage and cancellation policy selection

Rules & Requirements:
  - Max group size
  - Minimum/maximum stay
  - Required qualifications (storviltprøve, dog handler requirement)
  - House rules free text
  - Allowed weapon types

Compliance:
  - Jegeravgift verification approach (self-attest required vs. manual verification)
  - CWD zone acknowledgment (auto-populated from GIS overlay)
  - Insurance documentation upload

Legal:
  - Joint Controller Agreement acceptance (GDPR Article 26) — mandatory to publish listing
  - Platform terms of service acceptance
```

### Hunter/Fisher Registration

```
Identity:
  - BankID or Vipps Login for Norwegian residents
  - EU eIDAS-compliant eID or passport scan (via Stripe Identity) for foreign hunters
  - Verified name, address, date of birth surfaced to platform

Qualifications:
  - Hunter number (jegernummer) — links to brreg.no for jegeravgift status check
  - Shooting test certificate (storviltprøve) upload — required before big game bookings
  - Species-specific qualifications (large predator licence where applicable)
  - Dog handler confirmation or waiver (for big game listings requiring tracking dog)
  - NKK ettersøkshundsregister number (for listed dog handlers)

Payments:
  - Vipps payment link (for Norwegian users)
  - Stripe-managed card payment (international fallback)
  - Saved payment methods

Safety & Emergency:
  - Emergency contact name and phone number (mandatory)
  - Weapon types intended (rifle calibre, shotgun — for landowner safety briefing)

Preferences:
  - Preferred species, terrain, region
  - Group or solo hunting preference
  - Service preferences (guided/self-guided, accommodation required)
```

### Search & Discovery

- **Map-based primary interface**: Listings are displayed as markers and cluster groups on an interactive map. Map tiles sourced from [Kartverket/Norgeskart](https://www.norgeskart.no) WMS layer, providing property boundary data (eiendomsgrenser) overlaid on topographic terrain. This is a critical differentiator from Inatur.no's catalogue-style listing.
- **Filters**: Species available, date range, terrain type, services included (accommodation, guide, dog handler), price range, group size capacity, property area (hectares), county/municipality, reviews rating threshold.
- **Listing detail page**: Full photo gallery (hero + 12 supplementary photos), terrain map with drawn property boundary, availability calendar, wildlife species cards, infrastructure amenities list, host (landowner) profile with verified badge, reviews, "Nearby Services" carousel showing local guides/butchers/accommodation.
- **SEO-optimised URLs**: `/jakt/elg/innlandet`, `/fiske/laks/vestland/sognefjord` — targeting Norwegian-language search terms such as *"leie jaktterreng"*, *"elgjakt privat grunn"*, *"laksefiskekort"*.

### Booking & Contract Flow

The end-to-end flow is the core product loop. Every step is designed around the legal constraint that the contract must be between landowner and hunter, not mediated by the platform as a contractual party:

```
Step 1: Discovery & Request
  Hunter views listing → selects dates → submits booking request
  Platform checks: jegeravgift status confirmed? storviltprøve uploaded (if big game)?
  Landowner receives push + email notification

Step 2: Landowner Review & Approval
  Landowner reviews hunter profile (identity verified badge, qualifications, reviews)
  Landowner approves or declines within 48 hours (auto-decline protection)
  Optional: pre-approval messaging via in-app encrypted chat

Step 3: Contract Generation & E-Signature
  Platform auto-generates PDF Jaktavtale using approved template
  Contract includes all Viltloven §28 required elements:
    - Parties (landowner name/org, hunter name/ID)
    - Property cadastral reference and boundary description
    - Species and quota covered
    - Season dates and duration (max 10 years, >5 years triggers municipal notification flag)
    - Pricing and payment terms
    - Sub-leasing prohibition (fremleie forbudt)
    - House rules and safety requirements
    - Force majeure and cancellation terms
  Both parties receive contract via email; e-sign via BankID digital signature
  (implementation: Signicat API or Verified.no)

Step 4: Payment & Escrow
  Hunter pays via Vipps or Stripe
  Funds held in Stripe Connect escrow
  On check-in date: 80–90% released to landowner (minus platform commission)
  Remaining 10% held 48 hours post-checkout (dispute window) then released

Step 5: Active Season
  Platform sends push notifications: season opens, harvest reporting reminders
  In-app harvest logger active for the duration of booking
  CWD sampling alert (if applicable)
  "Sett og skutt" daily observation reminders during moose season

Step 6: Post-Hunt
  48-hour dispute window opens on check-out date
  Both parties leave reviews (hunter reviews property + landowner; landowner reviews hunter)
  Platform sends compliance reminders: Hjorteviltregisteret deadline, SSB/Altinn report
  Payout finalised; invoice generated (VAT-compliant Norwegian format)
```

### Wildlife Reporting Module

The compliance module is Heyra's most distinctive feature relative to any competitor:

- **In-app harvest logger**: Per-animal entry form — species, sex, age estimate (calf/yearling/adult), estimated live weight, harvest date, GPS coordinates of kill site, photo upload. Data stored under the booking record.
- **Hjorteviltregisteret integration**: After moose/deer/reindeer harvest logging, the platform generates a deep-link pre-filled URL to [hjorteviltregisteret.no](https://www.hjorteviltregisteret.no) with all harvested animal data. The hunter is prompted to submit the official report within 14 days of season end.
- **"Sett og skutt" reminders**: During moose season, daily push notifications prompt hunters to log observation data (observed but not shot animals) through the platform, with a link to the official Hjorteviltregisteret app.
- **CWD zone overlay**: GeoJSON boundaries for all CWD monitoring zones (sourced from Miljødirektoratet and [Veterinary Institute](https://www.vetinst.no)) are rendered on all maps. Any booking with property boundaries intersecting a CWD zone triggers:
  - Booking confirmation alert explaining sampling obligations
  - In-app step-by-step guide to collecting brain stem/lymph node samples
  - Contact card for nearest approved veterinarian in the area
- **Annual catch report reminder (May 1)**: BullMQ cron job runs in early April, sending all active hunters a push notification and email reminding them to submit their annual fangstrapport via [Altinn](https://www.altinn.no). Late submission incurs a NOK 260 penalty ([Brønnøysundregistrene](https://www.brreg.no/jegerregisteret/)), which the platform explicitly communicates.
- **Salmon catch reporting**: Listings tagged as registered salmon fishing beats (laksefiskevær) prompt the operator (landowner) to submit season harvest data to Miljødirektoratet at season end.

### Community Services Marketplace

The second marketplace layer transforms Heyra from a land-access platform into a full outdoor experience ecosystem. Service listings are a distinct content type with their own onboarding, pricing, and geo-proximity search:

**Service categories and specific requirements**:

| Category | Norwegian Term | Specific Requirements |
|---|---|---|
| Hunting guide | Jaktveileder | Certified credential display, min. 3 hunter references |
| Fishing guide | Fiskeveileder | Certified guide credential, species-specific experience |
| Tracking dog handler | Ettersøkshundfører | NKK [ettersøkshundregister](https://www.nkk.no/ettersokshundregister/category1162.html) entry number — mandatory for big game |
| Game butcher | Viltslakter | Health authority (Mattilsynet) registration number |
| Veterinarian | Statsautorisert veterinær | Official ID from Statsforvalteren — critical for CWD zone sampling |
| Local accommodation | Hytteformidler | Organisasjonsnummer, Airbnb-style amenity listing |
| Field transport | Transport | Vehicle type display (4WD, snowmobile, ATV, boat), capacity |
| Catering | Feltmat/catering | Food handler registration where applicable |
| Taxidermist | Preparant | Portfolio display, turnaround time, species handled |
| Photography | Naturfotograf | Portfolio display |
| Equipment rental | Utstyrleie | Inventory list: boats, kayaks, horses, binoculars, spotting scopes |

**Bundled checkout**: A hunter booking a moose hunt in Innlandet can add, in a single checkout flow: (1) the hunting property for 5 days, (2) a local dog handler for 2 days, (3) a game butcher booking for the day after hunt end, and (4) a cabin for the group. Each booking creates a separate contract with each service provider, but a single payment is split via Stripe Connect with the appropriate commission deducted on each leg.

**Revenue share**: The platform takes a commission on all service bookings (8–10%, see Monetisation section). Service providers are onboarded with Stripe Connect Standard accounts.

**Geo-proximity requirement**: Service providers must declare their operating radius and primary region. The "Nearby Services" widget on a listing page surfaces providers within a configurable radius (default 50 km) of the property centre.

### Notification & Communication Architecture

- **In-app messaging**: Booking-scoped encrypted chat between hunter and landowner. No sensitive personal data (addresses, mobile numbers) shared until booking is confirmed and contract signed. Message history preserved for dispute resolution.
- **Push notifications**: Web Push (PWA) and APNs/FCM (native app, Phase 1C). Key notification categories: booking requests, booking confirmations, contract signature requests, payment confirmations, harvest report deadlines, CWD alerts, season opening reminders, review requests.
- **Email**: Transactional email via [Resend](https://resend.com) — booking confirmations, contract PDFs, invoices, compliance deadline reminders.
- **SMS fallback**: Via [Twilio](https://www.twilio.com) or [Sveve.no](https://www.sveve.no) (Norwegian provider) for time-critical notifications (e.g., "Season opens tomorrow — your harvest report is due in 14 days").
- **Language support**: Norwegian Bokmål (primary), Norwegian Nynorsk, English (Phase 1). Swedish, Danish, Finnish, German added in Phases 2–3 via next-intl.

---

## Technical Architecture

### Tech Stack

The following stack is optimised for development with **Claude Code on Ollama running Qwen3 14B** — favouring TypeScript throughout, well-documented libraries with strong community support, and minimal context-switching between languages and build systems.

#### Frontend

```typescript
// Core framework
Next.js 15 (App Router) — TypeScript strict mode
Tailwind CSS v4 + shadcn/ui component library

// Data fetching
TanStack Query (React Query) v5 — server state, caching, optimistic updates

// Maps
Mapbox GL JS (primary) OR Leaflet.js with Kartverket WMS tile layers
// Kartverket WMS endpoint: https://opencache.statkart.no/gatekeeper/gk/gk.open_wmts
// For property boundary overlays, Kartverket Matrikkel API (requires license)

// Internationalisation
next-intl — Norwegian Bokmål, Nynorsk, English, then Nordic languages

// Client state
Zustand — lightweight, TypeScript-first global state

// Forms
React Hook Form + Zod — validation schemas matching server-side Prisma types

// Rich text (listing descriptions)
TipTap or Lexical
```

#### Backend

```typescript
// API layer
Next.js API Routes / Route Handlers (App Router) — monorepo for Phase 1
// Migrate to separate NestJS or Hono API service at Phase 2 scale if needed

// Database
PostgreSQL 16 + PostGIS extension (geospatial queries)
// PostGIS enables: ST_Within (is booking property inside CWD zone?),
//                  ST_Distance (nearby service providers),
//                  ST_Area (property area calculation),
//                  ST_Intersects (map search bounding box queries)

// ORM
Prisma 5 — type-safe database client, migrations, schema management

// Caching & sessions
Redis (Upstash Redis for serverless) — session storage, API response cache, rate limiting

// Job queues
BullMQ (Redis-backed) — compliance reminder cron jobs, email sends,
//                        contract PDF generation, payout triggers
//                        Key recurring jobs:
//   - Harvest report reminder (April 1 annually)
//   - CWD deadline alert (post-season, zone-specific)
//   - Booking check-in payout trigger
//   - Review request (24h post-checkout)
```

#### Authentication

```typescript
// Primary auth library
NextAuth.js v5 (Auth.js) — supports multiple providers cleanly

providers: [
  // Norwegian users — primary
  VippsProvider({
    clientId: process.env.VIPPS_CLIENT_ID,
    clientSecret: process.env.VIPPS_CLIENT_SECRET,
    // Scopes: openid, name, email, phoneNumber, address, birthDate
  }),

  // BankID via third-party broker (highest assurance level)
  // Option A: Signicat (signicat.com) — OIDC provider for BankID
  // Option B: Criipto (criipto.com) — Norwegian BankID OIDC
  BankIDProvider({
    // Implemented as OIDC custom provider in NextAuth
    issuer: 'https://YOUR_SIGNICAT_ENDPOINT',
  }),

  // International hunters (Phase 1 onward)
  CredentialsProvider({ /* email + password */ }),

  // Phase 3 international expansion
  GoogleProvider({}),
  AppleProvider({}),
]
```

#### Payments

```typescript
// Primary marketplace payment infrastructure
Stripe Connect (Custom accounts for landowners — full control over payout timing)
// Key Stripe features used:
//   stripe.paymentIntents.create({ capture_method: 'manual' }) — for escrow hold
//   stripe.transfers.create() — split payment to landowner minus commission
//   stripe.accounts.create({ type: 'custom' }) — landowner Connect onboarding
//   stripe.identity.verificationSessions.create() — non-BankID identity verification

// Norwegian-local payment (hunter-facing)
Vipps eCommerce API / Vipps MobilePay Checkout
// Vipps Checkout supports embedded payment in Next.js via Vipps API

// Webhook handling — critical for payment lifecycle
// /api/webhooks/stripe — capture events: payment_intent.succeeded,
//                        account.updated, payout.paid, dispute.created
```

#### Document Generation & E-Signature

```typescript
// Contract PDF generation
@react-pdf/renderer (React PDF) — JSX-based PDF layout, type-safe
// Alternative: PDFKit for lower-level control

// E-signature via BankID
Signicat Document Signing API — accepts PDF, returns signed PDF with BankID certificate
// Endpoint: POST /sign with document + signers array
// Webhook on signing_completed → update Contract.status in DB

// Contract storage
Cloudflare R2 (S3-compatible) — signed URL access per booking
```

#### Infrastructure & DevOps

```
Deployment:  Vercel (Next.js native — edge runtime, ISR, image optimisation)
Database:    Neon.tech (serverless Postgres, branching for preview deployments)
             OR Supabase (managed Postgres + realtime subscriptions for chat)
CDN/Storage: Cloudflare R2 (object storage) + Cloudflare CDN
Email:       Resend (developer-friendly, React Email templates)
Monitoring:  Sentry (errors + performance), PostHog (analytics, GDPR-self-hostable)
SMS:         Twilio or Sveve.no
Maps:        Kartverket WMS + Mapbox GL JS
```

### Database Schema (Key Entities)

```prisma
// prisma/schema.prisma (key models — abbreviated for clarity)

model User {
  id            String    @id @default(cuid())
  role          Role      // LANDOWNER | HUNTER | SERVICE_PROVIDER | ADMIN
  email         String    @unique
  emailVerified DateTime?
  // PII stored in separate encrypted table
  piiId         String?   @unique
  pii           UserPii?
  // Relations
  properties    Property[]
  bookings      Booking[]    @relation("HunterBookings")
  reviews       Review[]
  messages      Message[]
  serviceListings ServiceListing[]
  stripeConnectAccountId String? // For landowners/service providers
  vippsSubject   String?  // Vipps Login sub claim
  bankIdSubject  String?  // BankID pid claim
  createdAt     DateTime  @default(now())
}

model UserPii {
  // Encrypted at rest (field-level encryption or PG column encryption)
  id              String  @id @default(cuid())
  userId          String  @unique
  user            User    @relation(fields: [userId], references: [id])
  fullName        String  @db.Text // encrypted
  nationalId      String? @db.Text // encrypted fødselsnummer — only stored if BankID verified
  address         String? @db.Text // encrypted
  phone           String? @db.Text // encrypted
  emergencyName   String? @db.Text
  emergencyPhone  String? @db.Text
  hunterNumber    String? // plain — public register
  shootingCertRef String? // reference/hash only
  bankIdVerified  Boolean @default(false)
  vippsVerified   Boolean @default(false)
}

model ConsentRecord {
  id           String   @id @default(cuid())
  userId       String
  type         ConsentType // TOS | PRIVACY_POLICY | MARKETING | JOINT_CONTROLLER_DPA
  version      String   // e.g. "2025-06-01"
  grantedAt    DateTime
  revokedAt    DateTime?
  ipAddress    String
}

model Property {
  id              String    @id @default(cuid())
  ownerId         String
  owner           User      @relation(fields: [ownerId], references: [id])
  cadastralRef    String    // gårds-/bruksnummer e.g. "0301-123/456"
  municipality    String
  county          String
  areaHectares    Float
  boundary        Unsupported("geometry(Polygon, 4326)") // PostGIS
  centerPoint     Unsupported("geometry(Point, 4326)")
  terrainTypes    TerrainType[]
  infrastructure  Json      // {cabins: bool, boats: bool, hides: int, ...}
  isInCwdZone     Boolean   @default(false)
  cwdZoneId       String?
  status          PropertyStatus // DRAFT | PENDING_REVIEW | ACTIVE | SUSPENDED
  listings        Listing[]
  createdAt       DateTime  @default(now())
}

model Listing {
  id              String    @id @default(cuid())
  propertyId      String
  property        Property  @relation(fields: [propertyId], references: [id])
  type            ListingType // HUNTING | FISHING
  title           String
  description     String    @db.Text
  species         Species[]
  quota           Json?     // {elg: {antall: 3, kjonn: {bukk: 2, ku: 1}}}
  pricingModel    PricingModel // PER_DAY | PER_SEASON | PER_ANIMAL
  priceNok        Float
  maxGroupSize    Int
  minNights       Int?
  availabilityCalendar Json  // Array of available date ranges
  photos          String[]  // R2 URLs
  status          ListingStatus
  bookings        Booking[]
  reviews         Review[]
  nearbyServices  ServiceListing[] // Populated via PostGIS proximity query
  createdAt       DateTime  @default(now())
}

model Booking {
  id              String    @id @default(cuid())
  listingId       String
  listing         Listing   @relation(fields: [listingId], references: [id])
  hunterId        String
  hunter          User      @relation("HunterBookings", fields: [hunterId], references: [id])
  startDate       DateTime
  endDate         DateTime
  status          BookingStatus // REQUESTED | APPROVED | CONTRACTED | ACTIVE | COMPLETED | CANCELLED | DISPUTED
  contractId      String?   @unique
  contract        Contract?
  stripePaymentIntentId String?
  totalNok        Float
  platformFeeNok  Float
  payoutNok       Float
  harvestReports  HarvestReport[]
  serviceBookings ServiceBooking[]
  messages        Message[]
  reviews         Review[]
  complianceTasks ComplianceTask[]
  createdAt       DateTime  @default(now())
}

model Contract {
  id              String    @id @default(cuid())
  bookingId       String    @unique
  booking         Booking   @relation(fields: [bookingId], references: [id])
  pdfUrl          String    // Cloudflare R2 signed URL
  termsVersion    String    // Legal terms version used to generate contract
  landOwnerSigned Boolean   @default(false)
  landOwnerSignedAt DateTime?
  hunterSigned    Boolean   @default(false)
  hunterSignedAt  DateTime?
  signicatDocumentId String? // For tracking BankID e-sign status
  municipalNotificationRequired Boolean @default(false) // true if lease > 5 years
  municipalNotificationSent     Boolean @default(false)
  createdAt       DateTime  @default(now())
}

model HarvestReport {
  id              String    @id @default(cuid())
  bookingId       String
  booking         Booking   @relation(fields: [bookingId], references: [id])
  species         Species
  sex             AnimalSex
  ageClass        AgeClass  // CALF | YEARLING | ADULT
  weightKg        Float?
  harvestDate     DateTime
  gpsLat          Float?
  gpsLng          Float?
  photoUrl        String?
  cwdSampleRequired Boolean @default(false)
  cwdSampleSubmitted Boolean @default(false)
  hjorteviltSubmitted Boolean @default(false)
  createdAt       DateTime  @default(now())
}

model ServiceListing {
  id              String    @id @default(cuid())
  providerId      String
  provider        User      @relation(fields: [providerId], references: [id])
  category        ServiceCategory
  title           String
  description     String    @db.Text
  priceNok        Float
  pricingUnit     String    // "per dag", "per booking", "per animal"
  operatingRadius Int       // km
  centerPoint     Unsupported("geometry(Point, 4326)")
  orgNr           String?   // Brønnøysund organisation number
  qualifications  Json      // {nkk_id: "...", mattilsynet_id: "...", etc.}
  photos          String[]
  status          ListingStatus
  bookings        ServiceBooking[]
  createdAt       DateTime  @default(now())
}

model ComplianceTask {
  id              String    @id @default(cuid())
  bookingId       String
  booking         Booking   @relation(fields: [bookingId], references: [id])
  taskType        ComplianceTaskType
  // HARVEST_REPORT_HJORTEVILT | ANNUAL_CATCH_REPORT_SSB |
  // CWD_SAMPLE_SUBMISSION | SETT_OG_SKUTT_REMINDER |
  // SALMON_SEASON_REPORT | MUNICIPAL_LEASE_NOTIFICATION
  dueDate         DateTime
  completedAt     DateTime?
  reminderSent    Boolean   @default(false)
  createdAt       DateTime  @default(now())
}
```

### GDPR Data Architecture

The GDPR architecture follows Privacy by Design principles — the schema above separates PII into a `UserPii` table that can be field-level encrypted and independently managed for retention and erasure:

```
┌─────────────────────────────────────────────────────┐
│                   PostgreSQL Database                │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌────────────────┐ │
│  │  User    │───▶│ UserPii  │    │ ConsentRecord  │ │
│  │  (non-   │    │ (PII,    │    │ (audit log of  │ │
│  │   PII)   │    │ encrypted│    │  all consents) │ │
│  └──────────┘    └──────────┘    └────────────────┘ │
│                                                     │
│  ┌──────────┐    ┌──────────┐    ┌────────────────┐ │
│  │ Booking  │───▶│ Contract │    │ HarvestReport  │ │
│  │ (5yr     │    │ (5yr     │    │ (anonymised    │ │
│  │  retain) │    │  retain) │    │  after 2yr)    │ │
│  └──────────┘    └──────────┘    └────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Right to erasure flow**:
1. User submits erasure request via account settings.
2. Platform checks for active bookings or open contracts — cannot erase during active legal obligations.
3. `UserPii` record is zeroed/replaced with `[ERASED]` placeholder.
4. `User.email` randomised; account deactivated.
5. `Booking` and `Contract` records retained but anonymised (name → "[DELETED USER]").
6. Erasure timestamped in ConsentRecord for audit trail.

---

## Development Roadmap

### Phase 0 — Foundation (Weeks 1–6)

**Goal**: Core infrastructure, authentication, basic land listing, CI/CD pipeline.

#### Sprint 0.1 (Weeks 1–2): Project Setup & Infrastructure

- `npx create-next-app@latest heyra --typescript --tailwind --eslint --app` — strict TypeScript config
- PostgreSQL + PostGIS setup: local Docker Compose for dev, Neon.tech for staging/production
- Prisma schema initialisation — User, Property, Listing, Booking (skeleton)
- NextAuth.js v5 setup with email/password Credentials provider
- shadcn/ui installation and design system configuration:
  - **Brand palette**: Deep forest green (`#1B4332`), amber (`#D97706`), stone (`#78716C`), off-white (`#FAFAF9`)
  - Component library: Button, Card, Input, Select, Dialog, Calendar, Badge, Avatar
- Vercel project setup + GitHub Actions CI pipeline (lint, typecheck, test, deploy preview)
- Base GDPR flows: cookie consent banner (uses Zustand + localStorage), Privacy Policy page, Terms of Service page, ConsentRecord DB writes
- Environment variable management: `.env.local` template, Vercel environment secrets

**AI-assisted dev note**: Qwen3 14B via Ollama performs well on Next.js App Router scaffolding and Prisma schema generation. Prompt with full schema requirements in a single context window for best coherence. Use Claude Code for complex multi-file refactors and BankID/Signicat integration flows where official SDK documentation must be read.

#### Sprint 0.2 (Weeks 3–4): User & Identity

- Full auth flows: register, login, forgot password, email verification (Resend transactional email)
- Vipps Login integration via NextAuth custom OIDC provider — test credentials from [Vipps MobilePay Developer Portal](https://developer.vippsmobilepay.com)
- User profile pages (landowner and hunter views)
- Role-based access control (RBAC) middleware — Next.js middleware.ts pattern
- BankID integration via Signicat OIDC — identity verification tier (distinct from basic Vipps Login)
- Document upload: React Dropzone → signed upload URL → Cloudflare R2 → reference stored in UserPii
- Hunting licence number field with brreg.no lookup stub

#### Sprint 0.3 (Weeks 5–6): Land Listing Core

- Property creation form (multi-step wizard with React Hook Form + Zod)
- **Kartverket map integration**: Leaflet.js with Norgeskart WMS tile layer (`https://opencache.statkart.no/gatekeeper/gk/gk.open_wmts`) + Leaflet.draw for polygon boundary drawing
- PostGIS storage of drawn property polygon
- Automated CWD zone check: `ST_Intersects(property.boundary, cwd_zones.geometry)` on save
- Photo upload pipeline: React Dropzone → Cloudflare R2 → CDN URL array stored on Listing
- Listing publish/unpublish flow with admin review queue
- Basic text + species filter search (full geospatial search in Sprint 1.1)

---

### Phase 1A — Booking & Payments (Weeks 7–12)

**Goal**: Full end-to-end booking flow with legally compliant contracts and payments.

#### Sprint 1.1 (Weeks 7–8): Geospatial Search & Discovery

- **Map-based search**: Mapbox GL JS (provides superior clustering and tile performance vs Leaflet for the scale needed)
- PostGIS bounding box query: `ST_Within(property.centerPoint, ST_MakeEnvelope($swLng, $swLat, $neLng, $neLat, 4326))`
- Advanced filter implementation: date range → availability calendar join, species array overlap, price range
- Listing detail page with full photo gallery (next/image with blur placeholder), terrain map, availability calendar component
- "Nearby Services" section: `ST_DWithin(service.centerPoint, listing.centerPoint, $radiusMetres)` via PostGIS
- ISR (Incremental Static Regeneration) for listing pages: `revalidate: 3600`
- SEO: next-seo or Next.js metadata API, Norwegian-language meta tags, Schema.org `Product` markup for listings

#### Sprint 1.2 (Weeks 9–10): Booking Flow & Contract

- Booking request system (hunter request → landowner notification → approve/decline)
- **Jaktavtale PDF generation**: `@react-pdf/renderer` template matching Norwegian legal standard
- BankID e-signature flow via Signicat:
  ```typescript
  // Signicat Document Signing API integration
  const signResponse = await signicat.createSigningOrder({
    documentTitle: `Jaktavtale - ${listing.title}`,
    documents: [{ id: contractId, pdfBase64: contractPdfBase64 }],
    signers: [
      { id: 'landowner', name: landowner.name, signingMethod: 'no_bankid' },
      { id: 'hunter', name: hunter.name, signingMethod: 'no_bankid' },
    ],
    notification: { email: { sender: 'Heyra <contracts@heyra.no>' } }
  });
  ```
- Jegeravgift verification: hunter self-attest checkbox + link to [brreg.no jegerregisteret](https://www.brreg.no/jegerregisteret/)
- Booking confirmation email (Resend + React Email template)
- iCal export endpoint for landowners (`/api/listings/[id]/calendar.ics`)

#### Sprint 1.3 (Weeks 11–12): Payments

- Stripe Connect Custom account onboarding for landowners (KYC, bank account, identity)
- Vipps Checkout integration for hunters (primary Norwegian payment method)
- Stripe Payment Intent with `capture_method: 'manual'` for escrow hold
- BullMQ job: capture payment on check-in date (`capture` PaymentIntent)
- Commission deduction logic in webhook handler (`payment_intent.payment_failed`, `payment_intent.succeeded`)
- Payout dashboard: landowner sees pending/completed payouts, commission breakdown
- Cancellation policy enforcement: configurable (Flexible/Moderate/Strict) refund tiers
- Norwegian VAT invoice generation (25% MVA): `@react-pdf/renderer` invoice template with org.nr, MVA number

---

### Phase 1B — Compliance & Community (Weeks 13–18)

**Goal**: Wildlife reporting module, community services marketplace, two-way reviews.

#### Sprint 1.4 (Weeks 13–14): Wildlife Reporting & CWD

- Per-animal harvest logger in-app form (species, sex, age class, weight, GPS, photo)
- Hjorteviltregisteret deep-link with pre-filled query parameters
- BullMQ cron: `0 8 1 4 *` (8am, April 1) — fire annual catch report reminder to all active hunters
- CWD zone GeoJSON import: fetch from Miljødirektoratet API (`https://api.miljodirektoratet.no`) → store as PostGIS MultiPolygon → nightly refresh job
- CWD alert system: on booking confirmation, check `isInCwdZone` on Property → trigger compliance task in `ComplianceTask` table
- "Sett og skutt" daily reminder: BullMQ cron scoped to active moose season bookings

#### Sprint 1.5 (Weeks 15–16): Community Services Marketplace

- ServiceListing content type — full CRUD with admin review queue
- Brønnøysund organisation number verification: `https://data.brreg.no/enhetsregisteret/api/enheter/{orgNr}` (public JSON API)
- Service provider onboarding: org.nr lookup → auto-fill business name, address, registration status
- Geo-proximity search for services (`ST_DWithin` query exposed via `/api/services/nearby?lat=&lng=&radius=`)
- Service listing pages with qualification badges (NKK ID, Mattilsynet ID, etc.)
- Bundled checkout: cart abstraction layer supporting multiple `Booking` + `ServiceBooking` objects in a single payment session (Stripe Payment Intent with multiple transfers)
- Commission configuration per service category (stored in platform config table)

#### Sprint 1.6 (Weeks 17–18): Trust & Reviews

- Two-way review system: both parties can submit after booking completes (48h window)
- Review moderation: admin queue for flagged reviews (spam/abuse detection)
- Aggregate rating calculation on Listing and User profiles
- Dispute resolution flow: in-app dispute ticket → admin notification → mediation → resolution
- "Superhost" badge (Heyra equivalent): auto-awarded to landowners with ≥10 reviews, ≥4.8 rating, <2% cancellation rate
- Identity verification badge: "BankID-verifisert" / "Vipps-verifisert" displayed on all profiles

---

### Phase 1C — Mobile & Launch Preparation (Weeks 19–24)

**Goal**: Mobile-optimised experience, performance, and controlled beta launch.

#### Sprint 1.7 (Weeks 19–20): PWA & Mobile

- Progressive Web App manifest (`manifest.json`), service worker (Workbox via `next-pwa`)
- Offline capability: cache listing pages, active booking details, harvest report drafts
- Web Push notifications implementation (VAPID keys, subscription management)
- "Jaktlogg" — offline-capable hunt day logger with GPS via browser Geolocation API
- Camera integration: `<input type="file" accept="image/*" capture="environment">` for harvest photo
- Mobile-optimised booking flow (bottom sheet UI pattern via shadcn/ui `Drawer`)

#### Sprint 1.8 (Weeks 21–22): Performance & SEO

- Next.js Image component with `sizes` prop for all listing photos
- WebP conversion via Cloudflare Images or Next.js built-in
- `next/font` for zero-layout-shift typography (IBM Plex Sans or Inter)
- Core Web Vitals target: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Schema.org structured data: `Product` for listings, `LocalBusiness` for service providers
- Norwegian sitemap: pre-generated listing URLs for all published listings, daily regeneration
- Target keyword clusters: *"leie jaktterreng"*, *"elgjakt privat grunn"*, *"fiskekort laks"*, *"jaktveileder Innlandet"*

#### Sprint 1.9 (Weeks 23–24): Beta Launch

- Playwright end-to-end test suite: auth flows, booking creation, contract signing, payment
- k6 load test: 500 concurrent users on search/listing pages (Vercel auto-scales, but DB connection pool must be configured)
- OWASP Top 10 review: SQL injection (Prisma parameterised queries), XSS (Next.js escaping), CSRF (Next.js built-in), auth bypass testing
- GDPR audit with DPO review of data flows, consent capture, and joint controller agreements
- **Beta landowner recruitment**: Target 20–30 landowners in Innlandet (Hedmark/Oppland), Trøndelag, and Troms — regions with highest hunting activity per [SSB data](https://www.ssb.no/en/jord-skog-jakt-og-fiskeri/jakt/statistikk/registrerte-jegere). Approach via NJFF (Norges Jeger- og Fiskerforbund) local chapters.
- Press kit, landing page, and media outreach to Norwegian outdoor press (Jeger & Fisker magazine, friluftsliv.no)

---

### Phase 2 — Nordic Expansion (Months 7–18)

**Goal**: Sweden, Denmark, Finland. Leverage shared legal traditions and payment infrastructure.

**Legal adaptations**:

| Country | Hunting Law | Key Differences vs Norway | Payments |
|---|---|---|---|
| Sweden | [Jaktlagen (1987:259)](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/jaktlag-1987259_sfs-1987-259/) | Hunting rights tied to land; lease (jakträtt arrende) similar to Norway; no equivalent to jegeravgift — hunters need hunting licence (jägarexamen) | [Swish](https://www.swish.nu), BankID SE (Swedish BankID via Signicat) |
| Denmark | [Jagtloven](https://www.retsinformation.dk/eli/lta/2013/1197) | Hunting rights tied to land ownership; state hunting licence (jagttegn) required; Danish MitID for identity | [MobilePay](https://www.mobilepay.dk), MitID |
| Finland | [Hunting Act (615/1993)](https://www.finlex.fi/en/laki/kaannokset/1993/en19930615) | Hunter must be member of hunting club and pass hunter's exam; hunting rights via landowner permission or state land access | Finnish Trust Network eID |

**Technical additions**:
- `next-intl` locale files: `sv`, `da`, `fi` added to existing `nb`, `nn`, `en`
- Currency: NOK, SEK, DKK — Stripe handles all natively
- Swish integration (Sweden): [Swish Merchant API](https://developer.swish.nu)
- Swedish property registry (Lantmäteriet) API for cadastral lookup
- Multi-country tax handling: VAT at local rates (Norway 25%, Sweden 25%, Denmark 25%, Finland 24%)
- Legal template variants: Swedish `Jakträttsavtal`, Danish `Jagtlejekontrakt`, Finnish `Metsästysoikeussopimus`

---

### Phase 3 — European Expansion (Year 2+)

**Goal**: Germany, Austria, Scotland, Spain, Czech Republic/Slovakia. Modular legal configuration system.

**Architecture change**: By Phase 3, the legal template system, tax handling, payment provider registry, and compliance task definitions must be fully modularised into a per-country configuration layer — a `country_config` table in the database driving UI strings, contract templates, compliance task types, and payment provider availability.

**Key European complexities**:

- **Germany** ([Bundesjagdgesetz](https://www.gesetze-im-internet.de/bjagdg/)): The Revierrecht system divides all German land into fixed hunting districts (Jagdreviere, minimum 75 ha). Hunting rights are managed by Jagdgenossenschaften (hunting cooperatives). This is a fundamentally different model — Heyra's role would be connecting cooperative managers with commercial hunters for driven hunts (Drückjagden) and trophy experiences.
- **Scotland**: Sporting estates model — large private estates lease stalking rights (red deer, grouse) on a weekly basis to groups, often including accommodation. [BookYourHunt](https://www.bookyourhunt.com) and traditional estate agents currently dominate. High-value trophy segment.
- **Spain**: Regional (*comunidad autónoma*) legislation varies enormously. *Cotos de caza* (private hunting preserves) are the primary access model, licensed by regional governments.
- **EU DSA (Digital Services Act)** compliance: As a marketplace operator with users in EU member states, Heyra will be subject to DSA transparency, notice-and-action, and reporting obligations.
- **Partnership targets**: [BookYourHunt](https://www.bookyourhunt.com) (aggregator), Hubertus Worldwide (luxury hunting travel) — API integration or white-label arrangement for European inventory distribution.

---

## Monetisation Model

| Revenue Stream | Mechanism | Rate | Notes |
|---|---|---|---|
| Hunter service fee | % of booking value, charged to hunter at checkout | 5–8% | Tiered by booking value; lower % on larger bookings |
| Landowner commission | % of gross booking value deducted from payout | 10–12% | Deducted via Stripe Connect transfer |
| Service provider commission | % of service booking deducted from payout | 8–10% | Applied across all service categories |
| Premium listing placement | Featured placement in search results | NOK 299–999/month | Per listing; landowner self-serve via Stripe subscription |
| Hunter premium membership | Priority access, saved searches, advanced filters | NOK 199/month | Stripe subscription; waives part of per-booking service fee |
| Embedded insurance referral | Revenue share on insurance products sold at listing creation | 15–25% of premium | Partner with Gjensidige or If Forsikring |
| B2B wildlife data analytics | Aggregated, anonymised harvest and observation data reports | NOK 25,000–200,000/year | Sold to Miljødirektoratet, municipalities, research institutions (Phase 2+) |
| International hunter packages | Curated multi-service packages for foreign hunters (Scandinavian hunting packages) | 15% premium on package value | Phase 2+ marketing channel |

**Unit economics benchmark**: A single moose hunt booking (3 nights, 2 hunters, NOK 12,000 total) generates approximately NOK 2,160 in gross revenue (12% landowner commission + 6% hunter fee). At 1,000 such bookings per year — a conservative Phase 1 target given ~172,000 active Norwegian hunters — annual gross revenue approaches NOK 2.16 million from big game alone, before fishing, small game, and service marketplace revenue.

---

## Key Challenges & Mitigations

| Challenge | Risk Level | Mitigation |
|---|---|---|
| **Fremleie (sub-leasing) prohibition** | High — operational legality | Platform as facilitator only; auto-generated contracts name landowner and hunter as direct parties; legal opinion from Norwegian viltrett specialist obtained pre-launch; T&C explicitly state Heyra's role |
| **Jegeravgift verification** | Medium — landowner liability | Mandatory self-attestation checkbox in booking flow; deep-link to [brreg.no lookup](https://www.brreg.no/jegerregisteret/) for landowner; ComplianceTask generated per booking |
| **CWD compliance ignorance** | Medium — wildlife health / legal | Auto-alert on all CWD-zone bookings; vet contact directory integrated; sample kit info in booking confirmation; platform bears no liability but documents all notifications |
| **GDPR joint controller liability (Dec 2025 CJEU)** | High — regulatory/financial | DPO appointed pre-launch; DPIA completed; Article 26 DPA signed by all landowners before going live; Privacy by Design data architecture |
| **Critical mass (chicken-egg)** | High — marketplace viability | Launch in 3 pilot regions (Innlandet, Trøndelag, Troms); direct NJFF chapter outreach for landowner recruitment; offer first 6 months at 0% commission for early landowners |
| **Trust — strangers on your land with weapons** | High — brand/safety | Mandatory BankID identity verification; insurance partnership embedded in onboarding; emergency contact collection; detailed house rules and mandatory safety briefing acknowledgment |
| **Seasonal demand spikes** | Medium — infrastructure | Vercel auto-scaling handles serverless functions; Neon.tech auto-scales Postgres; Redis caching for listing pages; ISR for static listing pages reduces DB load |
| **Inatur.no incumbent response** | Medium — competitive | Superior UX and mobile experience; compliance layer (unique); community services (unique); target premium segment Inatur ignores; avoid price war on commodity fishing cards |
| **BankID integration complexity** | Medium — technical | Use broker (Signicat or Criipto) rather than direct integration; Signicat provides full SDK and sandbox; budget 2 sprints for complete integration + testing |
| **Multi-country legal expansion** | Medium — Phase 2+ | Modular country_config architecture designed from Phase 1; legal review budget line per country; local legal partner in each new market |
| **Dog handler requirement for big game** | Low-medium — UX friction | Platform surfaces tracking dog requirement on big game listings; "Nearby Services" section prominently features dog handlers; NKK register link embedded |

---

## Appendix: Regulatory Reference Table

| Species | Season (typical) | Quota System | Harvest Reporting | System | Deadline | CWD Required? | Platform Action |
|---|---|---|---|---|---|---|---|
| Moose (*elg*) | Sep 25 – Nov 30 | Municipal vald-level quota | Sex + age per vald | [Hjorteviltregisteret](https://www.hjorteviltregisteret.no) | 14 days post-season | Yes (targeted zones) | Harvest log → deep-link; CWD alert if zone |
| Red deer (*hjort*) | Sep 1 – Jan 15 | Municipal quota | Sex + age per vald | [Hjorteviltregisteret](https://www.hjorteviltregisteret.no) | 14 days post-season | Low risk (scattered) | Harvest log → deep-link |
| Roe deer (*rådyr*) | Aug 10 – Jan 23 | No quota | Annual summary | SSB via [Altinn](https://www.altinn.no) | May 1 | Rare | Annual reminder |
| Wild reindeer (*villrein*) | Aug 20 – Oct 31 | Villreinnemnda quota | Sex + age | [Hjorteviltregisteret](https://www.hjorteviltregisteret.no) | 14 days post-season | Yes — Nordfjella, Hardangervidda | Mandatory CWD alert; vet contact |
| Grouse (*rype*, *skogsfugl*) | Sep 10 – Mar 28 | Local restrictions | Annual | SSB via Altinn | May 1 | No | Annual reminder |
| Hare (*hare*) | Oct 1 – Mar 31 | No quota | Annual | SSB via Altinn | May 1 | No | Annual reminder |
| Fox (*rev*) | Varies by county | No quota | Annual | SSB via Altinn | May 1 | No | Annual reminder |
| Duck/waterfowl (*and*) | Aug 21 – Jan 23 | No quota | Annual | SSB via Altinn | May 1 | No | Annual reminder |
| Snaring (*villfangst*) | Species-specific | No quota | Pre + post municipal | Municipal wildlife board | 10 days before + after | No | Two-stage compliance task |
| Salmon (*laks*) | Jun – Sep (river-specific) | River-specific quota | Season camp report | Fisheries directorate | End of season | N/A (fish) | Camp-level report prompt |
| Moose observations | During moose season | N/A | Daily "Sett og skutt" | [Hjorteviltregisteret](https://www.hjorteviltregisteret.no) app | Daily during season | N/A | Daily push reminder |
| All hunters (jegeravgift) | Full year | N/A | Annual fangstrapport | SSB via [Altinn](https://www.altinn.no) | May 1 (NOK 260 penalty) | N/A | April reminder + Altinn link |

---

*Report compiled: June 2025. Norwegian legal references: Viltloven (1981-05-29-38), Lakse- og innlandsfiskloven (1992-05-15-47). Statistical sources: SSB Jegerregisteret 2024–2025. Regulatory sources: Brønnøysundregistrene, Hjorteviltregisteret, Veterinærinstituttet, Miljødirektoratet.*
