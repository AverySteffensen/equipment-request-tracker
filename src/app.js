import {
  RequestValidationError,
  appendRequest,
  createRequest,
  defaultFilters,
  dueDate,
  filterAndSortRequests,
  loadFilterPreferences,
  loadRequests,
  localDateString,
  requestPriority,
  saveFilterPreferences,
  saveRequests,
  validateDateRange,
} from "./request-store.js";

const form = document.querySelector("#request-form");
const message = document.querySelector("#form-message");
const neededByInput = document.querySelector("#needed-by");
const count = document.querySelector("#request-count");
const emptyState = document.querySelector("#empty-state");
const tableWrapper = document.querySelector("#request-table-wrapper");
const tableBody = document.querySelector("#request-table-body");
const filterForm = document.querySelector("#request-filters");
const filterMessage = document.querySelector("#filter-message");
const resetFilters = document.querySelector("#reset-filters");

let requests = loadRequests();
let filters = loadFilterPreferences();

neededByInput.min = localDateString();
showFilterControls();
renderRequests();

filterForm.addEventListener("submit", (event) => event.preventDefault());
filterForm.addEventListener("input", () => {
  const input = new FormData(filterForm);
  const candidate = {
    priorities: input.getAll("priorities"),
    startDate: input.get("startDate"),
    endDate: input.get("endDate"),
    sort: input.get("sort"),
  };
  const error = validateDateRange(candidate);
  showFilterError(error);
  if (error) return;

  filters = candidate;
  rememberFilters();
  renderRequests();
});

resetFilters.addEventListener("click", () => {
  filters = defaultFilters();
  showFilterControls();
  showFilterError("");
  rememberFilters();
  renderRequests();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearFieldErrors();
  setMessage("");

  const input = Object.fromEntries(new FormData(form).entries());

  try {
    const request = createRequest(input);
    requests = appendRequest(requests, request);
    saveRequests(requests);
    form.reset();
    neededByInput.min = localDateString();
    setMessage("Request added.");
    renderRequests();
    document.querySelector("#requester").focus();
  } catch (error) {
    if (error instanceof RequestValidationError) {
      showFieldErrors(error.errors);
      setMessage("Complete all required fields.", true);
      return;
    }

    setMessage("The request could not be saved. Try again.", true);
    console.error(error);
  }
});

function renderRequests() {
  const visibleRequests = filterAndSortRequests(requests, filters);
  const hasMatches = visibleRequests.length > 0;
  count.textContent = visibleRequests.length === requests.length
    ? `${requests.length} ${requests.length === 1 ? "request" : "requests"}`
    : `${visibleRequests.length} of ${requests.length} requests`;
  emptyState.hidden = hasMatches;
  document.querySelector("#empty-heading").textContent = requests.length
    ? "No matching requests"
    : "No requests yet";
  document.querySelector("#empty-help").hidden = requests.length > 0;
  tableWrapper.hidden = !hasMatches;
  tableBody.replaceChildren(...visibleRequests.map(createRequestRow));
}

function showFilterControls() {
  for (const checkbox of filterForm.querySelectorAll('input[name="priorities"]')) {
    checkbox.checked = filters.priorities.includes(checkbox.value);
  }
  filterForm.elements.startDate.value = filters.startDate;
  filterForm.elements.endDate.value = filters.endDate;
  filterForm.elements.sort.value = filters.sort;
}

function showFilterError(error) {
  filterMessage.textContent = error;
  for (const name of ["startDate", "endDate"]) {
    filterForm.elements[name].setAttribute("aria-invalid", String(Boolean(error)));
  }
}

function rememberFilters() {
  try {
    saveFilterPreferences(filters);
  } catch {
    filterMessage.textContent = "Filters applied, but could not be saved for refresh.";
  }
}

function createRequestRow(request) {
  const row = document.createElement("tr");
  const values = [
    request.requester,
    request.department,
    request.equipment,
    requestPriority(request),
    formatDate(dueDate(request)),
    request.reason,
    formatDateTime(request.createdAt),
  ];

  for (const value of values) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.append(cell);
  }

  return row;
}

function formatDate(value) {
  if (!value) return "No due date";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function showFieldErrors(errors) {
  const firstInvalidField = Object.keys(errors)[0];

  for (const fieldName of Object.keys(errors)) {
    form.elements[fieldName]?.setAttribute("aria-invalid", "true");
  }

  form.elements[firstInvalidField]?.focus();
}

function clearFieldErrors() {
  for (const element of form.elements) {
    element.removeAttribute?.("aria-invalid");
  }
}

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}
