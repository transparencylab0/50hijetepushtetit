export type AlbanianFilesLocationStatus = "exact" | "approximate" | "unresolved" | "rejected-candidate";

export type AlbanianFilesLocationConfidence = "verified" | "needs-review" | "unresolved";

export type AlbanianFilesLocationSource = {
  title: string;
  publisher: string;
  url?: string;
  note: string;
};

export type AlbanianFilesLocationCandidate = {
  name: string;
  source?: string;
  url?: string;
  notes: string;
  decision: "pending" | "accepted" | "rejected";
};

export type AlbanianFilesLocationResearch = {
  projectId: string;
  locationStatus: AlbanianFilesLocationStatus;
  auditStatus?: "exact" | "unresolved-book-clue" | "unresolved-city-area-only" | "unresolved-country-only" | "rejected-candidate";
  verifiedCoordinates?: {
    lat: number;
    lng: number;
    accuracy: "site-confirmed" | "area-confirmed";
  };
  approximateCoordinates?: {
    lat: number;
    lng: number;
    accuracy: "book-clue-orientation";
    note: string;
  };
  coordinateSource: string;
  sourcePageImages: string[];
  externalLocationSources: AlbanianFilesLocationSource[];
  locationEvidenceNotes: string;
  locationConfidence: AlbanianFilesLocationConfidence;
  lastReviewedAt: string;
  bookLocationClues: string[];
  candidateSites: AlbanianFilesLocationCandidate[];
  rejectionReason?: string;
  reviewerNotes: string;
  reviewBatch: string;
};

export const defaultAlbanianFilesLocationResearch = {
  locationStatus: "unresolved" as const,
  auditStatus: "unresolved-country-only" as const,
  coordinateSource: "No verified coordinate assigned. OCR city-level coordinates are intentionally not used as project pins.",
  sourcePageImages: [],
  externalLocationSources: [],
  locationEvidenceNotes: "Location research needed: inspect the scanned PDF page image and confirm the exact site with an independent public source before placing this record on the map.",
  locationConfidence: "unresolved" as const,
  lastReviewedAt: "2026-06-26",
  bookLocationClues: ["Book clue review pending."],
  candidateSites: [],
  reviewerNotes: "Default unresolved state. Run scripts/audit_albanian_files_locations.mjs to generate per-record review rows and promote only evidence-backed exact sites.",
  reviewBatch: "default-unresolved"
};

export const albanianFilesLocationResearch: AlbanianFilesLocationResearch[] = [
  {
    projectId: "51n4e-2008-skanderbeg-square",
    locationStatus: "exact",
    auditStatus: "exact",
    verifiedCoordinates: {
      lat: 41.3284666,
      lng: 19.8176868,
      accuracy: "site-confirmed"
    },
    coordinateSource: "OpenStreetMap/Nominatim result for Skanderbeg Square, Tirana, matched to the PDF project title and city.",
    sourcePageImages: ["PDF pages 17-36"],
    externalLocationSources: [
      {
        title: "Skanderbeg Square",
        publisher: "OpenStreetMap via Nominatim",
        url: "https://nominatim.openstreetmap.org/search?q=Skanderbeg%20Square%2C%20Tirana%2C%20Albania&format=json&limit=3",
        note: "OSM relation 20780801 returns Sheshi Skenderbej in central Tirana at 41.3284666, 19.8176868."
      },
      {
        title: "Skanderbeg Square",
        publisher: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Skanderbeg_Square",
        note: "Public reference confirming Skanderbeg Square as the central square of Tirana."
      }
    ],
    locationEvidenceNotes: "The OCR record names Skanderbeg Square in Tirana. The named public square is independently mapped by OpenStreetMap/Nominatim and described in a public reference; this pilot pin marks the square, not an inferred city centroid.",
    locationConfidence: "verified",
    lastReviewedAt: "2026-06-26",
    bookLocationClues: [
      "PDF pages 17-36 identify the project as Skanderbeg Square in Tirana.",
      "The book/project table is the source for including this project record."
    ],
    candidateSites: [
      {
        name: "Sheshi Skenderbej / Skanderbeg Square, Tirana",
        source: "OpenStreetMap via Nominatim",
        url: "https://nominatim.openstreetmap.org/search?q=Skanderbeg%20Square%2C%20Tirana%2C%20Albania&format=json&limit=3",
        notes: "Accepted because the public mapped place matches the named project and city in the book record.",
        decision: "accepted"
      }
    ],
    reviewerNotes: "Exact pin is for the named public square only; OCR-derived client/status details still require separate verification.",
    reviewBatch: "pilot-exact-2026-06-26"
  },
  {
    projectId: "archea-associati-2016-national-stadium-of-albania",
    locationStatus: "exact",
    auditStatus: "exact",
    verifiedCoordinates: {
      lat: 41.3183889,
      lng: 19.8245757,
      accuracy: "site-confirmed"
    },
    coordinateSource: "OpenStreetMap/Nominatim result for Air Albania Stadium, Tirana, matched to the National Stadium of Albania PDF record.",
    sourcePageImages: ["PDF pages 85-96"],
    externalLocationSources: [
      {
        title: "Air Albania Stadium",
        publisher: "OpenStreetMap via Nominatim",
        url: "https://nominatim.openstreetmap.org/search?q=Air%20Albania%20Stadium%2C%20Tirana%2C%20Albania&format=json&limit=3",
        note: "OSM relation 10311002 returns Air Albania Stadium at Sheshi Italia, Tirana, at 41.3183889, 19.8245757."
      },
      {
        title: "Arena Kombetare",
        publisher: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Arena_Komb%C3%ABtare",
        note: "Public reference connecting Arena Kombetare/Air Albania Stadium with the national stadium site in Tirana."
      }
    ],
    locationEvidenceNotes: "The OCR record names National Stadium of Albania in Tirana. Independent map and public references identify the site as Air Albania Stadium/Arena Kombetare at Sheshi Italia. Treat the architect/client details as OCR-derived until separately verified.",
    locationConfidence: "verified",
    lastReviewedAt: "2026-06-26",
    bookLocationClues: [
      "PDF pages 85-96 identify the project as National Stadium of Albania in Tirana.",
      "The book/project table is the source for including this project record."
    ],
    candidateSites: [
      {
        name: "Air Albania Stadium / Arena Kombetare, Sheshi Italia, Tirana",
        source: "OpenStreetMap via Nominatim",
        url: "https://nominatim.openstreetmap.org/search?q=Air%20Albania%20Stadium%2C%20Tirana%2C%20Albania&format=json&limit=3",
        notes: "Accepted because the public mapped stadium corresponds to the named national stadium site in Tirana.",
        decision: "accepted"
      }
    ],
    reviewerNotes: "Exact pin is for the stadium site; OCR-derived client/status details still require separate verification.",
    reviewBatch: "pilot-exact-2026-06-26"
  },
  {
    projectId: "miralles-tagliabue-embt-architects-2016-pyramid-of-tirana",
    locationStatus: "exact",
    auditStatus: "exact",
    verifiedCoordinates: {
      lat: 41.323019,
      lng: 19.8215893,
      accuracy: "site-confirmed"
    },
    coordinateSource: "OpenStreetMap/Nominatim result for Pyramid of Tirana, matched to the PDF project title and city.",
    sourcePageImages: ["PDF pages 505-516"],
    externalLocationSources: [
      {
        title: "Pyramid of Tirana",
        publisher: "OpenStreetMap via Nominatim",
        url: "https://nominatim.openstreetmap.org/search?q=Pyramid%20of%20Tirana%2C%20Albania&format=json&limit=3",
        note: "OSM way 174510408 returns Piramida e Tiranes at Bulevardi Bajram Curri, Tirana, at 41.3230190, 19.8215893."
      },
      {
        title: "Pyramid of Tirana",
        publisher: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Pyramid_of_Tirana",
        note: "Public reference confirming the named Tirana landmark and its location."
      }
    ],
    locationEvidenceNotes: "The OCR record names Pyramid of Tirana in Tirana. Independent map and public references identify the landmark location. This verifies the site of the named project, while OCR-derived project actors and status still need source review.",
    locationConfidence: "verified",
    lastReviewedAt: "2026-06-26",
    bookLocationClues: [
      "PDF pages 505-516 identify the project as Pyramid of Tirana in Tirana.",
      "The book/project table is the source for including this project record."
    ],
    candidateSites: [
      {
        name: "Piramida e Tiranes / Pyramid of Tirana",
        source: "OpenStreetMap via Nominatim",
        url: "https://nominatim.openstreetmap.org/search?q=Pyramid%20of%20Tirana%2C%20Albania&format=json&limit=3",
        notes: "Accepted because the public mapped landmark matches the named project and city in the book record.",
        decision: "accepted"
      }
    ],
    reviewerNotes: "Exact pin is for the named landmark; OCR-derived project actors/status still require separate verification.",
    reviewBatch: "pilot-exact-2026-06-26"
  }
];

export const albanianFilesLocationResearchById = Object.fromEntries(
  albanianFilesLocationResearch.map((entry) => [entry.projectId, entry])
) as Record<string, AlbanianFilesLocationResearch>;
