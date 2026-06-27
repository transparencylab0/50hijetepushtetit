const workspace = document.querySelector("[data-albanian-files-workspace]");
const dataNode = document.getElementById("albanian-files-projects");
const desktopFilters = document.querySelector("[data-map-filters]");
const mobileFilters = document.querySelector("[data-mobile-map-filters]");
const mobileSearch = document.querySelector("[data-mobile-search]");
const resultLine = document.querySelector("[data-map-result-line]");
const mobileResultLine = document.querySelector("[data-mobile-result-line]");
const locationCountLine = document.querySelector("[data-location-count-line]");
const locationLeads = document.querySelector("[data-location-leads]");
const dossierPanel = document.querySelector("[data-dossier-panel]");
const fallback = document.querySelector("[data-map-fallback]");
const fileModal = document.querySelector("[data-file-modal]");
const fileTitle = document.querySelector("[data-file-title]");
const fileChips = document.querySelector("[data-file-chips]");
const fileBody = document.querySelector("[data-file-body]");
const mindmapPanel = document.querySelector("[data-mindmap-panel]");
const mindmapTitle = document.querySelector("[data-mindmap-title]");
const networkPanel = document.querySelector("[data-network-panel]");
const networkKicker = document.querySelector("[data-network-kicker]");
const mobileFiltersPanel = document.querySelector("[data-mobile-filters]");

const statusLabels = {
  built: "Built",
  proposed: "Planned",
  competition: "Competition",
  cancelled: "Cancelled",
  unknown: "Unknown"
};

const statusColors = {
  built: "#2B5E3A",
  proposed: "#1E3A5F",
  competition: "#9A6B20",
  cancelled: "#8C2020",
  unknown: "#5C5555"
};

const locationStatusLabels = {
  exact: "Exact site verified",
  approximate: "Approximate area only",
  unresolved: "No verified site yet",
  "rejected-candidate": "Candidate rejected"
};

const auditStatusLabels = {
  exact: "Exact site verified from book clue + public source",
  "unresolved-book-clue": "Book has location clue; public confirmation missing",
  "unresolved-city-area-only": "Book gives city/area only",
  "unresolved-country-only": "Book gives only country or unclear OCR",
  "rejected-candidate": "Candidate rejected after review"
};

const nodeColors = {
  project: "#1C1C1C",
  architect: "#24486F",
  client: "#7A5C1E",
  location: "#5F665F",
  partner: "#2B4A2B",
  source: "#3A3A5C",
  status: "#3A3530",
  issue: "#5C5555"
};

const state = {
  projects: [],
  filtered: [],
  selected: null,
  filters: { q: "", status: "", municipality: "", architect: "", locationStatus: "" },
  map: null,
  cluster: null,
  markers: new Map(),
  relatedKey: "",
  boundaryLayer: null
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const clean = (value) => String(value || "").trim();

const isKnown = (value) => {
  const text = clean(value).toLowerCase();
  return Boolean(text && !["needs verification", "unknown", "open lead", "albania"].includes(text));
};

const slug = (value) =>
  clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const entityKey = (kind, value) => (isKnown(value) ? `${kind}:${slug(value)}` : "");

const firstKnown = (items, fallbackText = "Unknown") => {
  const value = (items || []).find(isKnown);
  return value || fallbackText;
};

const normalizeConfidence = (value) => {
  const raw = clean(value).toLowerCase();
  if (raw.includes("high")) return "OCR-High";
  if (raw.includes("medium")) return "OCR-Medium";
  return "OCR-Low";
};

const normalizeProject = (project) => {
  const architect = clean(project.architectureCompany || project.architect || "Unknown");
  const client = clean(project.clientDeveloper || "Needs verification");
  const municipality = clean(project.municipality || project.location || "Unknown");
  const location = clean(project.location || municipality || "Unknown");
  const partner = firstKnown(project.localPartners, "Unknown");
  const pages = clean(project.bookSource?.page || "PDF pages pending");
  const confidence = normalizeConfidence(project.sourceConfidence);
  const status = project.status || "unknown";
  const accuracy = clean(project.coordinates?.accuracy || "");
  const research = project.locationResearch || {};
  const locationStatus = clean(research.locationStatus || "unresolved");
  const auditStatus = clean(research.auditStatus || (locationStatus === "exact" ? "exact" : "unresolved-country-only"));
  const verifiedLat = Number(research.verifiedCoordinates?.lat);
  const verifiedLng = Number(research.verifiedCoordinates?.lng);
  const approximateLat = Number(research.approximateCoordinates?.lat);
  const approximateLng = Number(research.approximateCoordinates?.lng);
  const hasExactPin = locationStatus === "exact" && Number.isFinite(verifiedLat) && Number.isFinite(verifiedLng);
  const hasApproximateArea = locationStatus === "approximate" && Number.isFinite(approximateLat) && Number.isFinite(approximateLng);
  const keys = [
    entityKey("architect", architect),
    entityKey("client", client),
    entityKey("location", municipality),
    entityKey("partner", partner),
    entityKey("status", status)
  ].filter(Boolean);

  return {
    raw: project,
    id: project.id,
    name: project.name,
    lat: hasExactPin ? verifiedLat : hasApproximateArea ? approximateLat : NaN,
    lng: hasExactPin ? verifiedLng : hasApproximateArea ? approximateLng : NaN,
    markerKind: hasExactPin ? "exact" : hasApproximateArea ? "approximate" : "none",
    locationStatus,
    locationStatusLabel: locationStatusLabels[locationStatus] || locationStatusLabels.unresolved,
    auditStatus,
    auditStatusLabel: auditStatusLabels[auditStatus] || auditStatusLabels["unresolved-country-only"],
    hasExactPin,
    hasApproximateArea,
    coordinateSource: clean(research.coordinateSource || "No verified coordinate assigned."),
    approximateCoordinateNote: clean(research.approximateCoordinates?.note || ""),
    sourcePageImages: research.sourcePageImages || [],
    evidencePages: project.evidencePages || [],
    externalLocationSources: research.externalLocationSources || [],
    bookLocationClues: research.bookLocationClues || [],
    candidateSites: research.candidateSites || [],
    reviewerNotes: clean(research.reviewerNotes || ""),
    reviewBatch: clean(research.reviewBatch || ""),
    rejectionReason: clean(research.rejectionReason || ""),
    locationEvidenceNotes: clean(research.locationEvidenceNotes || "Location research needed."),
    locationConfidence: clean(research.locationConfidence || "unresolved"),
    lastReviewedAt: clean(research.lastReviewedAt || "Needs review"),
    status,
    statusLabel: statusLabels[status] || status,
    confidence,
    architect,
    client,
    municipality,
    location,
    partner,
    pages,
    year: project.timeline?.[0]?.date || "Needs verification",
    summary: project.displayBrief || project.summary || "OCR-derived summary pending review.",
    notes: project.bookSource?.note || "OCR-derived from the scanned book; verify against original PDF page image.",
    leads: [...(project.openQuestions || []), ...(project.leads || [])].filter(Boolean).slice(0, 7),
    actors: [
      { role: "Architect", name: architect, country: "Needs verification" },
      { role: "Client / developer", name: client, country: "Needs verification" },
      { role: "Municipality", name: municipality, country: "Albania" },
      ...(isKnown(partner) ? [{ role: "Local partner", name: partner, country: "Needs verification" }] : [])
    ],
    cityLevel: accuracy.includes("city"),
    searchText: (project.searchText || [
      project.name,
      architect,
      client,
      municipality,
      location,
      partner,
      status,
      pages,
      locationStatus,
      auditStatus,
      research.locationEvidenceNotes
    ].join(" ")).toLowerCase(),
    keys
  };
};

const chip = (text, className = "") => `<span class="${className}">${escapeHtml(text)}</span>`;

const sourceLink = (source) => {
  const title = escapeHtml(source.title || source.publisher || "External source");
  const publisher = escapeHtml(source.publisher || "Source");
  const note = escapeHtml(source.note || "");
  const href = source.url ? ` href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer"` : "";
  return `<li><a${href}>${title}</a><span>${publisher}</span>${note ? `<small>${note}</small>` : ""}</li>`;
};

const candidateSite = (candidate) => {
  const title = escapeHtml(candidate.name || "Candidate site");
  const source = escapeHtml(candidate.source || "Candidate");
  const note = escapeHtml(candidate.notes || "");
  const decision = escapeHtml(candidate.decision || "pending");
  const href = candidate.url ? ` href="${escapeHtml(candidate.url)}" target="_blank" rel="noreferrer"` : "";
  return `<li><a${href}>${title}</a><span>${source} · ${decision}</span>${note ? `<small>${note}</small>` : ""}</li>`;
};

const evidenceStrip = (project, limit = 2) => {
  if (!project.evidencePages.length) return "<p>Book source page pending.</p>";
  return `
    <div class="af-evidence-strip" aria-label="Book evidence excerpts">
      ${project.evidencePages.slice(0, limit).map((item) => `
        <figure>
          ${item.thumb ? `<img src="${escapeHtml(item.thumb)}" alt="${escapeHtml(item.label)}" loading="lazy" decoding="async" />` : `<div class="af-evidence-placeholder">${escapeHtml(item.label)}</div>`}
          <figcaption>${escapeHtml(item.label)}</figcaption>
        </figure>
      `).join("")}
    </div>
    <p class="af-book-rights-note">Book page references are provided for citation and verification. Scanned page images are not published in this public version.</p>
  `;
};

const renderCount = () => {
  const exact = state.filtered.filter((project) => project.hasExactPin).length;
  const approximate = state.filtered.filter((project) => project.hasApproximateArea).length;
  const unresolved = state.filtered.filter((project) => !project.hasExactPin && !project.hasApproximateArea).length;
  const text = `${state.filtered.length}/439`;
  if (resultLine) resultLine.textContent = text;
  if (mobileResultLine) mobileResultLine.textContent = String(state.filtered.length);
  if (locationCountLine) {
    locationCountLine.textContent = `${exact} exact pins / ${approximate} approximate / ${unresolved} unresolved leads`;
  }
  if (networkKicker) networkKicker.textContent = `Project Network · ${state.filtered.length} projects`;
};

const renderLocationLeads = () => {
  if (!locationLeads) return;
  const leads = state.filtered.filter((project) => !project.hasExactPin && !project.hasApproximateArea);
  if (!leads.length) {
    locationLeads.innerHTML = "";
    locationLeads.hidden = true;
    return;
  }
  locationLeads.hidden = false;
  locationLeads.innerHTML = `
    <div>
      <p>Needs Location Verification</p>
      <strong>${leads.length} records not pinned</strong>
      <span>Showing first ${Math.min(leads.length, 12)} leads</span>
    </div>
    <button type="button" data-collapse-location-leads aria-label="Hide location leads">×</button>
    <ol>
      ${leads.slice(0, 12).map((project) => `
        <li>
          <button type="button" data-open-lead="${escapeHtml(project.id)}">
            <strong>${escapeHtml(project.name)}</strong>
            <span>${escapeHtml(project.architect)} · ${escapeHtml(project.location)} · ${escapeHtml(project.auditStatusLabel)}</span>
          </button>
        </li>
      `).join("")}
    </ol>
  `;
};

const currentFiltersFrom = (form) => {
  const values = {};
  if (!form) return values;
  [...form.querySelectorAll("input, select")].forEach((control) => {
    values[control.name] = control.value.trim();
  });
  return values;
};

const syncFilterControls = () => {
  [desktopFilters, mobileFilters].forEach((form) => {
    if (!form) return;
    const q = form.querySelector('[name="q"]');
    const status = form.querySelector('[name="status"]');
    const municipality = form.querySelector('[name="municipality"]');
    const architect = form.querySelector('[name="architect"]');
    const locationStatus = form.querySelector('[name="locationStatus"]');
    if (q) q.value = state.filters.q;
    if (status) status.value = state.filters.status;
    if (municipality) municipality.value = state.filters.municipality;
    if (architect) architect.value = state.filters.architect;
    if (locationStatus) locationStatus.value = state.filters.locationStatus;
  });
  if (mobileSearch) mobileSearch.value = state.filters.q;
};

const projectMatches = (project) => {
  const q = state.filters.q.toLowerCase();
  return (
    (!q || project.searchText.includes(q)) &&
    (!state.filters.status || project.status === state.filters.status) &&
    (!state.filters.municipality || project.municipality === state.filters.municipality) &&
    (!state.filters.architect || project.architect === state.filters.architect) &&
    (!state.filters.locationStatus || project.locationStatus === state.filters.locationStatus)
  );
};

const markerIcon = (project, selected = false, related = false) => {
  const approximate = project.markerKind === "approximate";
  const size = selected ? 28 : related ? 25 : approximate ? 21 : 22;
  const statusColor = statusColors[project.status] || statusColors.unknown;
  const color = approximate ? "rgba(255,254,249,0.98)" : related ? "#F5F0E8" : statusColor;
  const border = approximate ? statusColor : selected ? "#1C1C1C" : related ? "#1E3A5F" : "rgba(255,255,255,0.92)";
  const innerDot = approximate ? `<i style="background:${statusColor};"></i>` : "";
  return L.divIcon({
    className: `af-pin-icon af-pin-${project.markerKind} af-pin-status-${project.status}`,
    html: `<span style="width:${size}px;height:${size}px;background:${color};border-color:${border};">${innerDot}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const clusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 100 ? 44 : 52;
  return L.divIcon({
    className: "af-marker-cluster af-cluster-project",
    html: `<span style="width:${size}px;height:${size}px;">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const refreshMarkerIcons = () => {
  state.markers.forEach((marker, id) => {
    const project = state.projects.find((item) => item.id === id);
    if (!project) return;
    const selected = state.selected?.id === id;
    const related = Boolean(state.relatedKey && project.keys.includes(state.relatedKey));
    marker.setIcon(markerIcon(project, selected, related));
  });
};

const renderMarkers = () => {
  if (!state.cluster) return;
  state.cluster.clearLayers();
  state.markers.clear();
  state.filtered.filter((project) => project.hasExactPin || project.hasApproximateArea).forEach((project) => {
    if (!Number.isFinite(project.lat) || !Number.isFinite(project.lng)) return;
    const marker = L.marker([project.lat, project.lng], { icon: markerIcon(project) });
    marker.bindTooltip(`<strong>${escapeHtml(project.name)}</strong><br>${escapeHtml(project.statusLabel)} · ${escapeHtml(project.location)} · ${escapeHtml(project.hasApproximateArea ? "Approximate orientation" : project.locationStatusLabel)}`, {
      direction: "top",
      offset: [0, -7],
      className: "af-tip",
      opacity: 1
    });
    marker._afProject = project;
    marker.on("click", (event) => {
      L.DomEvent.stopPropagation(event);
      selectProject(project, true);
    });
    state.markers.set(project.id, marker);
    state.cluster.addLayer(marker);
  });
};

const fitFiltered = () => {
  if (!state.map || !state.filtered.length) return;
  const points = state.filtered
    .filter((project) => Number.isFinite(project.lat) && Number.isFinite(project.lng))
    .map((project) => [project.lat, project.lng]);
  if (!points.length) return;
  state.map.fitBounds(L.latLngBounds(points).pad(0.18), { maxZoom: 9, padding: [40, 40] });
};

const renderDossier = (project) => {
  if (!project) {
    dossierPanel.hidden = true;
    return;
  }
  dossierPanel.hidden = false;
  const externalSources = project.externalLocationSources.length
    ? `<ul class="af-location-source-list">${project.externalLocationSources.map(sourceLink).join("")}</ul>`
    : "<p>No independent location source has been attached yet.</p>";
  const bookClues = project.bookLocationClues.length
    ? `<ul>${project.bookLocationClues.map((clue) => `<li>${escapeHtml(clue)}</li>`).join("")}</ul>`
    : "<p>Book clue review pending.</p>";
  const candidates = project.candidateSites.length
    ? `<ul class="af-location-source-list">${project.candidateSites.slice(0, 4).map(candidateSite).join("")}</ul>`
    : "<p>No candidate public-source searches attached.</p>";
  dossierPanel.innerHTML = `
    <div class="af-dossier-head">
      <button class="af-dark-close" type="button" data-close-dossier aria-label="Close dossier">×</button>
      <p>Project File · 50 Hijet e Pushtetit</p>
      <h2>${escapeHtml(project.name)}</h2>
      <div>
        ${chip(project.statusLabel, `af-status-chip af-status-${project.status}`)}
        ${chip(project.confidence, "af-confidence-chip")}
        ${chip(project.pages.replace(/^PDF pages\\s*/i, "pp. "), "af-source-chip")}
        ${chip(project.locationStatusLabel, `af-location-status-chip af-location-${project.locationStatus}`)}
      </div>
    </div>
    <div class="af-evidence-alert">
      <span aria-hidden="true">⚠</span>
      ${project.hasExactPin ? "Exact site verified from book clue plus public source. OCR project details still need verification." : project.hasApproximateArea ? "Approximate orientation marker only. Public confirmation still missing." : project.auditStatusLabel}
    </div>
    <div class="af-dossier-body">
      <section>
        <h3>Summary</h3>
        <p>${escapeHtml(project.summary)}</p>
      </section>
      <section class="af-book-evidence">
        <h3>Book Evidence</h3>
        ${evidenceStrip(project, 2)}
      </section>
      <dl class="af-dossier-grid">
        <div><dt>Architect</dt><dd>${escapeHtml(project.architect)}</dd></div>
        <div><dt>Client</dt><dd>${escapeHtml(project.client)}</dd></div>
        <div><dt>Location</dt><dd>${escapeHtml(project.location)}<small>${escapeHtml(project.locationStatusLabel)}</small></dd></div>
        <div><dt>Municipality</dt><dd>${escapeHtml(project.municipality)}</dd></div>
        <div><dt>Year</dt><dd>${escapeHtml(project.year)}</dd></div>
        <div><dt>Local partner</dt><dd>${escapeHtml(project.partner)}</dd></div>
      </dl>
      <section class="af-location-evidence">
        <h3>Location Evidence</h3>
        <p>${escapeHtml(project.locationEvidenceNotes)}</p>
        <h3>Book Clues</h3>
        ${bookClues}
        <p><strong>Coordinate source:</strong> ${escapeHtml(project.hasApproximateArea ? project.approximateCoordinateNote : project.coordinateSource)}</p>
        ${project.sourcePageImages.length ? `<p><strong>PDF evidence:</strong> ${project.sourcePageImages.map(escapeHtml).join(", ")}</p>` : "<p><strong>PDF evidence:</strong> Page image review pending.</p>"}
        <h3>Candidate Public Sources</h3>
        ${project.hasExactPin ? externalSources : candidates}
        ${project.reviewerNotes ? `<p><strong>Reviewer note:</strong> ${escapeHtml(project.reviewerNotes)}</p>` : ""}
        ${project.reviewBatch ? `<p><strong>Review batch:</strong> ${escapeHtml(project.reviewBatch)}</p>` : ""}
      </section>
      <section>
        <h3>Open leads</h3>
        <ul>${project.leads.slice(0, 4).map((lead) => `<li>${escapeHtml(lead)}</li>`).join("")}</ul>
      </section>
      <section class="af-source-note">
        <h3>Source notes</h3>
        <p>${escapeHtml(project.notes)}</p>
      </section>
    </div>
    <div class="af-dossier-actions">
      <button type="button" data-open-file>Open Full File</button>
    </div>
  `;
};

const selectProject = (project, moveMap = false) => {
  state.selected = project;
  renderDossier(project);
  refreshMarkerIcons();
  if (moveMap && state.map && project.hasExactPin) {
    const zoom = Math.max(state.map.getZoom(), 11);
    state.map.setView([project.lat, project.lng], zoom, { animate: true });
  }
};

const closeDossier = () => {
  state.selected = null;
  renderDossier(null);
  refreshMarkerIcons();
};

const renderFile = (project) => {
  if (!project) return;
  fileTitle.textContent = project.name;
  fileChips.innerHTML = [
    chip(project.statusLabel, `af-status-chip af-status-${project.status}`),
    chip(project.confidence, "af-confidence-chip"),
    chip(project.locationStatusLabel, `af-location-status-chip af-location-${project.locationStatus}`),
    chip(`Source: ${project.pages}`, "af-source-chip"),
    chip(project.year, "af-source-chip")
  ].join("");
  fileBody.innerHTML = `
    <section>
      <h3>Readable Summary</h3>
      <p class="af-file-summary">${escapeHtml(project.summary)}</p>
    </section>
    <section class="af-book-evidence">
      <h3>Book Evidence Excerpts</h3>
      ${evidenceStrip(project, 2)}
      <p class="af-book-rights-note">${project.evidencePages.map((item) => escapeHtml(item.citation)).join("<br>")}</p>
    </section>
    <section>
      <h3>Actors</h3>
      <div class="af-actors-table">
        ${project.actors.map((actor) => `
          <div>
            <span>${escapeHtml(actor.role)}</span>
            <strong>${escapeHtml(actor.name)}</strong>
            <em>${escapeHtml(actor.country)}</em>
          </div>
        `).join("")}
      </div>
    </section>
    <section>
      <h3>Evidence Status</h3>
      <div class="af-evidence-grid">
        <article><span>OCR Confidence</span><strong>${escapeHtml(project.confidence)}</strong></article>
        <article><span>Location Status</span><strong>${escapeHtml(project.locationStatusLabel)}</strong></article>
        <article><span>Status</span><strong>${escapeHtml(project.statusLabel)}</strong></article>
        <article><span>Book Pages</span><strong>${escapeHtml(project.pages)}</strong></article>
        <article><span>Location Confidence</span><strong>${escapeHtml(project.locationConfidence)}</strong></article>
        <article><span>Last Reviewed</span><strong>${escapeHtml(project.lastReviewedAt)}</strong></article>
      </div>
    </section>
    <section>
      <h3>Location Evidence</h3>
      <p>${escapeHtml(project.locationEvidenceNotes)}</p>
      <h3>Book Clues</h3>
      ${project.bookLocationClues.length ? `<ul>${project.bookLocationClues.map((clue) => `<li>${escapeHtml(clue)}</li>`).join("")}</ul>` : "<p>Book clue review pending.</p>"}
      <p><strong>Coordinate source:</strong> ${escapeHtml(project.coordinateSource)}</p>
      ${project.externalLocationSources.length ? `<ul class="af-location-source-list">${project.externalLocationSources.map(sourceLink).join("")}</ul>` : project.candidateSites.length ? `<ul class="af-location-source-list">${project.candidateSites.slice(0, 6).map(candidateSite).join("")}</ul>` : "<p>No independent location source has been attached yet.</p>"}
    </section>
    <section>
      <h3>Open Leads</h3>
      <ul>${project.leads.map((lead) => `<li>${escapeHtml(lead)}</li>`).join("")}</ul>
    </section>
    <section class="af-source-note">
      <h3>Source Notes</h3>
      <p>${escapeHtml(project.notes)}</p>
    </section>
  `;
  fileModal.hidden = false;
};

const graphDrag = (simulation) =>
  d3.drag()
    .on("start", (event, node) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      node.fx = node.x;
      node.fy = node.y;
    })
    .on("drag", (event, node) => {
      node.fx = event.x;
      node.fy = event.y;
    })
    .on("end", (event, node) => {
      if (!event.active) simulation.alphaTarget(0);
      if (!node.fixed) {
        node.fx = null;
        node.fy = null;
      }
    });

const graphNode = (kind, label, value, radius, fixed = false, meta = {}) => ({
  id: `${kind}:${slug(label)}:${Math.random().toString(16).slice(2)}`,
  kind,
  label: label || "Unknown",
  value: value || label,
  key: entityKey(kind, value || label),
  r: radius,
  color: meta.color || nodeColors[kind] || "#3A3530",
  flagLevel: meta.flagLevel || "none",
  issueCategory: meta.issueCategory || "",
  legalStatus: meta.legalStatus || "",
  sourceTitle: meta.sourceTitle || "",
  sourceUrl: meta.sourceUrl || "",
  confidence: meta.confidence || "",
  fixed
});

const drawForceGraph = (selector, nodes, links, options = {}) => {
  if (!window.d3) return;
  const svgElement = document.querySelector(selector);
  if (!svgElement) return;
  const width = svgElement.clientWidth || window.innerWidth;
  const height = svgElement.clientHeight || window.innerHeight;
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((node) => node.id).distance(options.distance || 170).strength(0.62))
    .force("charge", d3.forceManyBody().strength(options.charge || -420))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide((node) => node.r + 16));

  const link = svg.append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke", "rgba(196,186,168,0.2)")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "5 4")
    .attr("opacity", 1);

  const linkLabel = svg.append("g")
    .selectAll("text")
    .data(links)
    .join("text")
    .attr("text-anchor", "middle")
    .attr("fill", "rgba(196,186,168,0.42)")
    .attr("font-size", "8")
    .attr("font-weight", "500")
    .text((item) => (item.label || "").toUpperCase());

  const node = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "af-force-node")
    .attr("data-node-key", (item) => item.key || "")
    .call(graphDrag(simulation));

  node.append("circle")
    .attr("r", (item) => item.r)
    .attr("fill", (item) => item.color)
    .attr("stroke", "rgba(245,240,232,0.14)")
    .attr("stroke-width", 1);

  node.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("fill", "#F5F0E8")
    .attr("font-size", (item) => item.kind === "project" ? 11 : Math.max(8, Math.min(11, item.r / 3.7)))
    .text((item) => item.label.length > 18 ? `${item.label.slice(0, 17)}…` : item.label);

  node.append("title").text((item) => [
    item.label,
    item.issueCategory ? `Issue: ${item.issueCategory}` : "",
    item.legalStatus ? `Status: ${item.legalStatus}` : "",
    item.sourceTitle ? `Source: ${item.sourceTitle}` : "",
    item.confidence ? `Confidence: ${item.confidence}` : ""
  ].filter(Boolean).join("\n"));

  node.on("click", (_, item) => {
    if (!item.key) return;
    state.relatedKey = item.key;
    refreshMarkerIcons();
  });

  simulation.on("tick", () => {
    nodes.forEach((item) => {
      item.x = Math.max(item.r + 8, Math.min(width - item.r - 8, item.x || width / 2));
      item.y = Math.max(item.r + 66, Math.min(height - item.r - 32, item.y || height / 2));
    });
    link
      .attr("x1", (item) => item.source.x)
      .attr("y1", (item) => item.source.y)
      .attr("x2", (item) => item.target.x)
      .attr("y2", (item) => item.target.y);
    linkLabel
      .attr("x", (item) => (item.source.x + item.target.x) / 2)
      .attr("y", (item) => (item.source.y + item.target.y) / 2 - 4);
    node.attr("transform", (item) => `translate(${item.x},${item.y})`);
  });
};

const openMindmap = (project) => {
  if (!project) return;
  mindmapTitle.textContent = project.name;
  workspace.classList.add("af-overlay-open");
  mindmapPanel.hidden = false;
  const center = graphNode("project", project.name, project.name, 54, true);
  const actorSpecs = [
    ["architect", project.architect, project.architect, 42],
    ["client", project.client, project.client, 38],
    ["location", project.municipality, project.municipality, 34],
    ["partner", project.partner, project.partner, 30],
    ["source", project.pages, project.pages, 26],
    ["status", project.statusLabel, project.status, 26]
  ];
  const actorNodes = actorSpecs.map(([kind, label, value, radius]) => graphNode(kind, label, value, radius));
  const nodes = [center, ...actorNodes];
  const links = actorNodes.map((node) => ({ source: center.id, target: node.id, label: node.kind }));
  center.fx = window.innerWidth / 2;
  center.fy = window.innerHeight / 2;
  window.setTimeout(() => drawForceGraph("#mindmap-svg", nodes, links, { distance: 210, charge: -720 }), 40);
};

const addEntityNode = (map, kind, label, projectId) => {
  if (!isKnown(label)) return "";
  const key = entityKey(kind, label);
  if (!map.has(key)) {
    map.set(key, {
      ...graphNode(kind, label, label, 20),
      id: key,
      key,
      count: 0,
      projectIds: new Set()
    });
  }
  const node = map.get(key);
  node.count += 1;
  node.projectIds.add(projectId);
  return key;
};

const openNetwork = () => {
  workspace.classList.add("af-overlay-open");
  networkPanel.hidden = false;
  const nodesByKey = new Map();
  const links = [];
  const linkKeys = new Set();
  state.filtered.forEach((project) => {
    const projectNode = {
      ...graphNode("project", project.name, project.name, 5, false, { color: "rgba(245,240,232,0.18)" }),
      id: `project:${project.id}`,
      key: ""
    };
    nodesByKey.set(projectNode.id, projectNode);
    [addEntityNode(nodesByKey, "architect", project.architect, project.id),
      addEntityNode(nodesByKey, "client", project.client, project.id),
      addEntityNode(nodesByKey, "location", project.municipality, project.id),
      addEntityNode(nodesByKey, "partner", project.partner, project.id)
    ].filter(Boolean).forEach((entityId) => {
      const linkKey = `${entityId}->${projectNode.id}`;
      if (!linkKeys.has(linkKey)) {
        linkKeys.add(linkKey);
        links.push({
          source: entityId,
          target: projectNode.id,
          label: ""
        });
      }
    });
  });

  const nodes = [...nodesByKey.values()];
  const maxCount = Math.max(...nodes.filter((node) => node.kind !== "project").map((node) => node.count || 1), 1);
  nodes.forEach((node) => {
    if (node.kind !== "project") node.r = Math.max(18, Math.min(54, 16 + ((node.count || 1) / maxCount) * 38));
  });
  window.setTimeout(() => drawForceGraph("#network-svg", nodes, links, { distance: 82, charge: -210 }), 40);
};

const applyFilters = (options = {}) => {
  state.filtered = state.projects.filter(projectMatches);
  state.relatedKey = "";
  if (!options.keepSelection) closeDossier();
  renderCount();
  renderMarkers();
  renderLocationLeads();
  if (options.fit !== false) fitFiltered();
};

const setFiltersFromDesktop = () => {
  const values = currentFiltersFrom(desktopFilters);
  state.filters = {
    q: values.q || "",
    status: values.status || "",
    municipality: values.municipality || "",
    architect: values.architect || "",
    locationStatus: values.locationStatus || ""
  };
  syncFilterControls();
  applyFilters();
};

const setFiltersFromMobile = () => {
  const values = currentFiltersFrom(mobileFilters);
  state.filters = {
    ...state.filters,
    status: values.status || "",
    municipality: values.municipality || "",
    architect: values.architect || "",
    locationStatus: values.locationStatus || ""
  };
  syncFilterControls();
  applyFilters();
};

const resetFilters = () => {
  state.filters = { q: "", status: "", municipality: "", architect: "", locationStatus: "" };
  syncFilterControls();
  applyFilters();
};

const initMap = () => {
  state.map = L.map("albanian-files-map", {
    center: [41.15, 20.05],
    zoom: 7,
    zoomControl: false,
    minZoom: 6,
    maxZoom: 18,
    scrollWheelZoom: true
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20
  }).addTo(state.map);

  L.control.zoom({ position: "bottomright" }).addTo(state.map);

  state.cluster = L.markerClusterGroup({
    iconCreateFunction: clusterIcon,
    maxClusterRadius: 65,
    spiderfyOnMaxZoom: true,
    spiderfyDistanceMultiplier: 2.05,
    zoomToBoundsOnClick: false,
    showCoverageOnHover: false,
    animateAddingMarkers: false
  });
  state.map.addLayer(state.cluster);
  state.cluster.on("clusterclick", (event) => {
    const count = event.layer.getChildCount();
    if (count <= 40 || state.map.getZoom() >= 10) {
      event.layer.spiderfy();
      return;
    }
    state.map.fitBounds(event.layer.getBounds(), { padding: [42, 42], maxZoom: 11 });
  });
  state.map.on("click", closeDossier);

  fetch("/data/albania-boundary.geojson")
    .then((response) => response.json())
    .then((boundary) => {
      state.boundaryLayer = L.geoJSON(boundary, {
        interactive: false,
        style: { color: "#1E3A5F", weight: 1.8, opacity: 0.72, fillColor: "#F5F0E8", fillOpacity: 0.08 }
      }).addTo(state.map);
      state.map.fitBounds(state.boundaryLayer.getBounds(), { padding: [24, 24] });
    })
    .catch(() => {
      if (fallback) fallback.hidden = false;
    });
};

if (workspace && dataNode && desktopFilters) {
  state.projects = JSON.parse(dataNode.textContent || "[]").map(normalizeProject);
  state.filtered = [...state.projects];

  if (!window.L || !window.L.markerClusterGroup) {
    if (fallback) fallback.hidden = false;
  } else {
    initMap();
    renderCount();
    renderMarkers();
    renderLocationLeads();
  }

  desktopFilters.addEventListener("input", setFiltersFromDesktop);
  mobileFilters?.addEventListener("input", setFiltersFromMobile);
  mobileSearch?.addEventListener("input", () => {
    state.filters.q = mobileSearch.value.trim();
    syncFilterControls();
    applyFilters();
  });

  document.querySelectorAll("[data-clear-filters]").forEach((button) => button.addEventListener("click", resetFilters));
  document.querySelectorAll("[data-toggle-mobile-filters]").forEach((button) => {
    button.addEventListener("click", () => {
      mobileFiltersPanel.hidden = !mobileFiltersPanel.hidden;
    });
  });

  dossierPanel.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-dossier]")) closeDossier();
    if (event.target.closest("[data-open-file]")) renderFile(state.selected);
    if (event.target.closest("[data-open-mindmap]")) openMindmap(state.selected);
  });

  locationLeads?.addEventListener("click", (event) => {
    const collapse = event.target.closest("[data-collapse-location-leads]");
    if (collapse) {
      locationLeads.hidden = true;
      return;
    }
    const lead = event.target.closest("[data-open-lead]");
    if (!lead) return;
    const project = state.projects.find((item) => item.id === lead.dataset.openLead);
    if (project) selectProject(project, false);
  });

  document.querySelector("[data-network-mode]")?.addEventListener("click", openNetwork);
  document.querySelector("[data-close-network]")?.addEventListener("click", () => {
    networkPanel.hidden = true;
    workspace.classList.remove("af-overlay-open");
  });
  document.querySelector("[data-close-mindmap]")?.addEventListener("click", () => {
    mindmapPanel.hidden = true;
    workspace.classList.remove("af-overlay-open");
  });
  document.querySelectorAll("[data-close-file]").forEach((button) => button.addEventListener("click", () => {
    fileModal.hidden = true;
  }));
}
