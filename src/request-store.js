export const STORAGE_KEY = "mis4173-equipment-requests";
export const FILTER_STORAGE_KEY = "mis4173-equipment-request-filters";
export const FILTER_PRIORITIES = ["Low", "Medium", "High"];
export const DATE_RANGE_ERROR = "Start date must be on or before end date.";
// Exercise 5 stored the middle priority as Normal. Keep it readable and unchanged.
const PRIORITIES = ["Low", "Normal", "Medium", "High"];
const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

export class RequestValidationError extends Error {
  constructor(errors) {
    super("The equipment request is incomplete.");
    this.name = "RequestValidationError";
    this.errors = errors;
  }
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateRequest(input = {}) {
  const errors = {};

  if (!clean(input.requester)) errors.requester = "Enter the requester name.";
  if (!clean(input.department)) errors.department = "Select a department.";
  if (!clean(input.equipment)) errors.equipment = "Enter the equipment needed.";
  if (!clean(input.neededBy)) errors.neededBy = "Select the date needed.";
  if (!clean(input.reason)) errors.reason = "Enter a business reason.";
  if (input.priority !== undefined && !PRIORITIES.includes(clean(input.priority))) {
    errors.priority = "Select Low, Medium, or High priority.";
  }

  return errors;
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `request-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createRequest(input, options = {}) {
  const errors = validateRequest(input);
  if (Object.keys(errors).length > 0) {
    throw new RequestValidationError(errors);
  }

  const now = options.now ?? new Date();

  return {
    id: options.id ?? createId(),
    requester: clean(input.requester),
    department: clean(input.department),
    equipment: clean(input.equipment),
    priority: input.priority === undefined ? "Normal" : clean(input.priority),
    neededBy: clean(input.neededBy),
    reason: clean(input.reason),
    createdAt: now.toISOString(),
  };
}

export function appendRequest(requests, request) {
  return [request, ...requests];
}

export function loadRequests(storage = globalThis.localStorage) {
  if (!storage) return [];

  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(isRequestRecord).map((request) => ({
          ...request,
          // Older saved requests have no priority; keep them readable.
          priority: PRIORITIES.includes(request.priority) ? request.priority : "Normal",
        }))
      : [];
  } catch {
    return [];
  }
}

export function saveRequests(requests, storage = globalThis.localStorage) {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

export function defaultFilters() {
  return {
    priorities: [...FILTER_PRIORITIES],
    startDate: "",
    endDate: "",
    sort: "due-date",
  };
}

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function requestPriority(request) {
  return request.priority === "Normal" ? "Medium" : request.priority;
}

export function dueDate(request) {
  // Needed-by dates are calendar dates, even if a legacy value includes a time.
  return typeof request.neededBy === "string" ? request.neededBy.slice(0, 10) : "";
}

export function validateDateRange(filters) {
  return filters.startDate && filters.endDate && filters.startDate > filters.endDate
    ? DATE_RANGE_ERROR
    : "";
}

export function filterAndSortRequests(requests, filters, today = localDateString()) {
  const matches = requests.filter((request) => {
    const date = dueDate(request);
    return (
      filters.priorities.includes(requestPriority(request)) &&
      (!filters.startDate || (date && date >= filters.startDate)) &&
      (!filters.endDate || (date && date <= filters.endDate))
    );
  });

  return matches.sort((first, second) => {
    const firstDate = dueDate(first);
    const secondDate = dueDate(second);

    if (filters.sort === "priority") {
      const firstOverdue = Boolean(firstDate && firstDate < today);
      const secondOverdue = Boolean(secondDate && secondDate < today);
      if (firstOverdue !== secondOverdue) return firstOverdue ? -1 : 1;

      const priorityDifference =
        PRIORITY_RANK[requestPriority(first)] - PRIORITY_RANK[requestPriority(second)];
      if (priorityDifference) return priorityDifference;
    }

    // In priority mode this comparison happens within the same priority group.
    if (!firstDate && secondDate) return 1;
    if (firstDate && !secondDate) return -1;
    return firstDate.localeCompare(secondDate);
  });
}

export function loadFilterPreferences(storage = globalThis.localStorage) {
  const defaults = defaultFilters();
  if (!storage) return defaults;

  try {
    const parsed = JSON.parse(storage.getItem(FILTER_STORAGE_KEY));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaults;

    const isDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
    const filters = {
      priorities: Array.isArray(parsed.priorities)
        ? FILTER_PRIORITIES.filter((priority) => parsed.priorities.includes(priority))
        : defaults.priorities,
      startDate: isDate(parsed.startDate) ? parsed.startDate : "",
      endDate: isDate(parsed.endDate) ? parsed.endDate : "",
      sort: parsed.sort === "priority" ? "priority" : "due-date",
    };

    return validateDateRange(filters) ? defaults : filters;
  } catch {
    return defaults;
  }
}

export function saveFilterPreferences(filters, storage = globalThis.localStorage) {
  if (!storage || validateDateRange(filters)) return false;
  storage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  return true;
}

function isRequestRecord(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.requester === "string" &&
    typeof value.department === "string" &&
    typeof value.equipment === "string" &&
    typeof value.neededBy === "string" &&
    typeof value.reason === "string" &&
    typeof value.createdAt === "string"
  );
}
