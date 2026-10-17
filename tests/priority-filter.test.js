import assert from "node:assert/strict";
import test from "node:test";

import {
  DATE_RANGE_ERROR,
  FILTER_STORAGE_KEY,
  STORAGE_KEY,
  defaultFilters,
  filterAndSortRequests,
  loadFilterPreferences,
  loadRequests,
  localDateString,
  saveFilterPreferences,
  validateDateRange,
} from "../src/request-store.js";

const today = "2026-10-17";
const requests = [
  { id: "A", priority: "High", neededBy: "2026-10-14" },
  { id: "B", priority: "Low", neededBy: "2026-10-16" },
  { id: "C", priority: "Medium", neededBy: "2026-10-17" },
  { id: "D", priority: "Low", neededBy: "2026-10-19" },
  { id: "E", priority: "High", neededBy: "2026-10-22" },
  { id: "F", priority: "Medium", neededBy: "2026-10-25" },
  { id: "G", priority: "High", neededBy: "" },
  { id: "H", priority: "Low", neededBy: "" },
];

function ids(options = {}, input = requests) {
  return filterAndSortRequests(input, { ...defaultFilters(), ...options }, today)
    .map((request) => request.id);
}

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
}

test("AC-01/02: defaults include every request with overdue first and undated last", () => {
  assert.deepEqual(defaultFilters(), {
    priorities: ["Low", "Medium", "High"], startDate: "", endDate: "", sort: "due-date",
  });
  assert.deepEqual(ids(), ["A", "B", "C", "D", "E", "F", "G", "H"]);
});

test("AC-03/04: priorities match any selected level and an empty selection matches none", () => {
  assert.deepEqual(ids({ priorities: ["High"] }), ["A", "E", "G"]);
  assert.deepEqual(ids({ priorities: ["High", "Medium"] }), ["A", "C", "E", "F", "G"]);
  assert.deepEqual(ids({ priorities: [] }), []);
});

test("AC-05/06: both range endpoints are inclusive, including a single-day range", () => {
  assert.deepEqual(ids({ startDate: today, endDate: "2026-10-22" }), ["C", "D", "E"]);
  assert.deepEqual(ids({ startDate: "2026-10-19", endDate: "2026-10-19" }), ["D"]);
});

test("AC-07: either range endpoint may be omitted and clearing the range restores all", () => {
  assert.deepEqual(ids({ startDate: "2026-10-19" }), ["D", "E", "F"]);
  assert.deepEqual(ids({ endDate: today }), ["A", "B", "C"]);
  assert.deepEqual(ids({ startDate: "", endDate: "" }), ["A", "B", "C", "D", "E", "F", "G", "H"]);
});

test("AC-08/09/10: priority and range restrictions combine and exclude undated requests", () => {
  assert.deepEqual(ids({ priorities: ["High", "Medium"], startDate: today, endDate: "2026-10-22" }), ["C", "E"]);
  assert.deepEqual(ids({ startDate: "2020-01-01" }), ["A", "B", "C", "D", "E", "F"]);
  assert.deepEqual(ids({ endDate: "2030-01-01" }), ["A", "B", "C", "D", "E", "F"]);
  assert.deepEqual(ids({ startDate: "2026-11-06", endDate: "2026-11-07" }), []);
});

test("AC-11: priority sorting keeps overdue first and undated requests within their priority", () => {
  assert.deepEqual(ids({ sort: "priority" }), ["A", "B", "E", "G", "C", "F", "D", "H"]);
  assert.deepEqual(ids(), ["A", "B", "C", "D", "E", "F", "G", "H"]);
});

test("AC-12: exact ties and undated ties preserve existing relative order", () => {
  const tied = [
    { id: "first", priority: "High", neededBy: today },
    { id: "second", priority: "High", neededBy: today },
    { id: "third", priority: "High", neededBy: "" },
    { id: "fourth", priority: "High", neededBy: "" },
  ];
  for (const sort of ["due-date", "priority"]) {
    assert.deepEqual(ids({ sort }, tied), ["first", "second", "third", "fourth"]);
  }
  assert.deepEqual(ids({}, [
    { id: "low-first", priority: "Low", neededBy: today },
    { id: "high-second", priority: "High", neededBy: today },
  ]), ["low-first", "high-second"]);
});

test("AC-13/14: valid filters and sort persist and saving Reset restores defaults", () => {
  const storage = new MemoryStorage();
  const filters = {
    priorities: ["Medium", "High"], startDate: today, endDate: "2026-10-25", sort: "priority",
  };
  assert.equal(saveFilterPreferences(filters, storage), true);
  assert.deepEqual(loadFilterPreferences(storage), filters);
  assert.deepEqual(ids(loadFilterPreferences(storage)), ["E", "C", "F"]);
  saveFilterPreferences(defaultFilters(), storage);
  assert.deepEqual(loadFilterPreferences(storage), defaultFilters());
});

test("an empty priority selection survives preference persistence", () => {
  const storage = new MemoryStorage();
  saveFilterPreferences({ ...defaultFilters(), priorities: [] }, storage);
  assert.deepEqual(loadFilterPreferences(storage).priorities, []);
});

test("AC-15: invalid ranges are rejected without overwriting saved valid preferences", () => {
  const storage = new MemoryStorage();
  const valid = { ...defaultFilters(), startDate: today, endDate: "2026-10-22" };
  saveFilterPreferences(valid, storage);
  const invalid = { ...valid, startDate: "2026-10-23" };
  assert.equal(validateDateRange(invalid), DATE_RANGE_ERROR);
  assert.equal(saveFilterPreferences(invalid, storage), false);
  assert.deepEqual(loadFilterPreferences(storage), valid);
  assert.equal(validateDateRange({ ...valid, endDate: today }), "");
});

test("damaged or unavailable preference storage safely falls back to defaults", () => {
  const storage = new MemoryStorage();
  for (const value of ["not-json", "null", "[]", JSON.stringify({ startDate: "2026-10-25", endDate: today })]) {
    storage.setItem(FILTER_STORAGE_KEY, value);
    assert.deepEqual(loadFilterPreferences(storage), defaultFilters());
  }
  assert.deepEqual(loadFilterPreferences(null), defaultFilters());
  assert.deepEqual(loadFilterPreferences({ getItem() { throw new Error("blocked"); } }), defaultFilters());
});

test("AC-16: filtering and preference writes preserve all request fields and canonical ordering", () => {
  const storage = new MemoryStorage();
  const records = requests.map((request) => ({
    ...request, requester: request.id, department: "Operations", equipment: "Laptop",
    reason: "Testing", createdAt: "2026-10-01T12:00:00Z", extraField: "keep me",
  }));
  storage.setItem(STORAGE_KEY, JSON.stringify(records));
  const before = storage.getItem(STORAGE_KEY);
  const loaded = loadRequests(storage);
  const snapshot = structuredClone(loaded);
  for (const sort of ["priority", "due-date"]) {
    const filters = { ...defaultFilters(), sort };
    filterAndSortRequests(loaded, filters, today);
    saveFilterPreferences(filters, storage);
  }
  saveFilterPreferences(defaultFilters(), storage);
  assert.deepEqual(loaded, snapshot);
  assert.equal(storage.getItem(STORAGE_KEY), before);
  assert.deepEqual(loadRequests(storage), records);
});

test("existing Normal priorities match Medium without modifying stored values", () => {
  const legacy = [{ id: "normal", priority: "Normal", neededBy: today }];
  assert.deepEqual(ids({ priorities: ["Medium"] }, legacy), ["normal"]);
  assert.equal(legacy[0].priority, "Normal");
});

test("local calendar dates and due-date comparisons ignore time-of-day differences", () => {
  assert.equal(localDateString(new Date(2026, 9, 17, 23, 59)), today);
  assert.equal(localDateString(new Date(2026, 9, 17, 0, 1)), today);
  assert.deepEqual(ids({ startDate: today, endDate: today }, [
    { id: "late", priority: "High", neededBy: today + "T23:59:00" },
    { id: "early", priority: "High", neededBy: today + "T00:01:00" },
  ]), ["late", "early"]);
});

test("AC-20: undated High follows three dated High requests before lower priorities", () => {
  const sample = [
    { id: "medium", priority: "Medium", neededBy: "2026-10-18" },
    { id: "undated-high", priority: "High", neededBy: "" },
    { id: "third-high", priority: "High", neededBy: "2026-10-20" },
    { id: "first-high", priority: "High", neededBy: "2026-10-18" },
    { id: "low", priority: "Low", neededBy: "2026-10-18" },
    { id: "second-high", priority: "High", neededBy: "2026-10-19" },
    { id: "overdue-low", priority: "Low", neededBy: "2026-10-16" },
  ];
  assert.deepEqual(ids({ sort: "priority" }, sample), [
    "overdue-low", "first-high", "second-high", "third-high", "undated-high", "medium", "low",
  ]);
});
