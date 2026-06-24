const root = document.querySelector("[data-case-filters]");
const grid = document.querySelector("[data-case-grid]");
const emptyState = document.querySelector("[data-empty-state]");
const resultLine = document.querySelector("[data-result-line]");

if (root && grid) {
  const cards = [...grid.querySelectorAll("[data-case-card]")];
  const controls = [...root.querySelectorAll("input, select")];
  const params = new URLSearchParams(window.location.search);
  const resultLabel = root.dataset.resultLabel || "dosje";

  controls.forEach((control) => {
    const value = params.get(control.name);
    if (value) control.value = value;
  });

  const applyFilters = () => {
    const form = new FormData();
    controls.forEach((control) => form.set(control.name, control.value.trim().toLowerCase()));

    let visible = 0;
    cards.forEach((card) => {
      const q = form.get("q");
      const priority = form.get("priority");
      const category = form.get("category");
      const era = form.get("era");
      const year = form.get("year");
      const status = form.get("status");
      const tag = form.get("tag");
      const matches =
        (!q || card.dataset.search.includes(q)) &&
        (!priority || card.dataset.priority.toLowerCase() === priority) &&
        (!category || card.dataset.category.toLowerCase() === category) &&
        (!era || card.dataset.era.toLowerCase() === era) &&
        (!year || card.dataset.year === year) &&
        (!status || card.dataset.status.toLowerCase() === status) &&
        (!tag || card.dataset.tags.toLowerCase().split(" ").includes(tag));

      card.hidden = !matches;
      if (matches) visible += 1;
    });

    if (emptyState) emptyState.hidden = visible !== 0;
    if (resultLine) resultLine.textContent = `> ${visible} / ${cards.length} ${resultLabel}`;
  };

  controls.forEach((control) => control.addEventListener("input", applyFilters));
  applyFilters();
}
