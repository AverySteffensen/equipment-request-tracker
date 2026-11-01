import assert from "node:assert/strict";
import test from "node:test";

import { DATE_RANGE_ERROR, FILTER_STORAGE_KEY, STORAGE_KEY } from "../src/request-store.js";

const defaults = {
  priorities: ["Low", "Medium", "High"], startDate: "", endDate: "", sort: "due-date",
};
const records = ["High", "Low", "Normal", "Low", "High", "Medium"].map((priority, index) => ({
  id: String.fromCharCode(65 + index),
  requester: String.fromCharCode(65 + index),
  department: "Operations",
  equipment: `Laptop ${index + 1}`,
  priority,
  neededBy: `2000-01-0${index + 1}`,
  reason: `Reason ${index + 1}`,
  createdAt: "1999-12-01T12:00:00Z",
  extraField: { preserve: index },
}));

// Minimal DOM/FormData/localStorage harness for the filtering handlers only.
// It runs the real app module, but does not simulate browser layout or keyboard input.
class Element extends EventTarget {
  value = "";
  checked = false;
  hidden = false;
  textContent = "";
  children = [];
  attributes = new Map();
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
}

class MemoryStorage {
  values = new Map([[STORAGE_KEY, JSON.stringify(records)]]);
  failPreferenceWrites = false;
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) {
    if (key === FILTER_STORAGE_KEY && this.failPreferenceWrites) throw new Error("storage blocked");
    this.values.set(key, value);
  }
}

class FilterFormData {
  constructor(form) {
    this.values = form.elements
      .filter((field) => field.name !== "priorities" || field.checked)
      .map((field) => [field.name, field.value]);
  }
  getAll(name) { return this.values.filter(([key]) => key === name).map(([, value]) => value); }
  get(name) { return this.getAll(name)[0] ?? null; }
}

let importNumber = 0;

async function startApp(t) {
  const originalGlobals = Object.fromEntries(["document", "FormData", "localStorage"]
    .map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const [name, descriptor] of Object.entries(originalGlobals)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const storage = new MemoryStorage();

  async function reload() {
    const nodes = Object.fromEntries([
      "request-form", "form-message", "needed-by", "request-count", "empty-state",
      "request-table-wrapper", "request-table-body", "request-filters", "filter-message",
      "reset-filters", "empty-heading", "empty-help",
    ].map((id) => [`#${id}`, new Element()]));
    const priorities = ["Low", "Medium", "High"].map((value) =>
      Object.assign(new Element(), { name: "priorities", value }));
    const fields = Object.fromEntries(["startDate", "endDate", "sort"].map((name) =>
      [name, Object.assign(new Element(), { name })]));
    const form = nodes["#request-filters"];
    form.elements = Object.assign([...priorities, ...Object.values(fields)], fields);
    form.querySelectorAll = (selector) => {
      assert.equal(selector, 'input[name="priorities"]');
      return priorities;
    };
    const globals = {
      document: {
        querySelector(selector) {
          assert.ok(nodes[selector], `Unexpected selector: ${selector}`);
          return nodes[selector];
        },
        createElement() { return new Element(); },
      },
      FormData: FilterFormData,
      localStorage: storage,
    };
    for (const [name, value] of Object.entries(globals)) {
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    }
    // A unique URL reruns app.js and attaches handlers to this test's new controls.
    await import(`../src/app.js?ui-test=${++importNumber}`);

    return {
      nodes, priorities, fields, storage, reload,
      input() { form.dispatchEvent(new Event("input")); },
      reset() { nodes["#reset-filters"].dispatchEvent(new Event("click")); },
      rows() { return nodes["#request-table-body"].children.map((row) =>
        row.children.map((cell) => cell.textContent)); },
      controls() {
        return {
          priorities: priorities.filter((field) => field.checked).map((field) => field.value),
          ...Object.fromEntries(Object.entries(fields).map(([name, field]) => [name, field.value])),
        };
      },
    };
  }
  return reload();
}

const visibleNames = (app) => app.rows().map(([name]) => name);
const savedFilters = (app) => JSON.parse(app.storage.getItem(FILTER_STORAGE_KEY));

test("app: an invalid range retains valid rows/preferences until corrected", async (t) => {
  let app = await startApp(t);
  app.fields.startDate.value = "2000-01-03";
  app.fields.endDate.value = "2000-01-05";
  app.input();
  const validRows = app.rows();
  const saved = app.storage.getItem(FILTER_STORAGE_KEY);
  assert.deepEqual(visibleNames(app), ["C", "D", "E"]);

  app.fields.startDate.value = "2000-01-06";
  app.input();
  assert.equal(app.nodes["#filter-message"].textContent, DATE_RANGE_ERROR);
  assert.equal(app.fields.startDate.getAttribute("aria-invalid"), "true");
  assert.equal(app.fields.endDate.getAttribute("aria-invalid"), "true");
  assert.deepEqual(app.rows(), validRows);
  assert.equal(app.nodes["#empty-state"].hidden, true);
  assert.equal(app.storage.getItem(FILTER_STORAGE_KEY), saved);

  app = await app.reload();
  assert.equal(app.fields.startDate.value, "2000-01-03");
  assert.equal(app.fields.endDate.value, "2000-01-05");
  assert.deepEqual(app.rows(), validRows);
  app.fields.startDate.value = "2000-01-06";
  app.input();
  assert.equal(app.nodes["#filter-message"].textContent, DATE_RANGE_ERROR);
  app.fields.startDate.value = "2000-01-04";
  app.input();
  assert.equal(app.nodes["#filter-message"].textContent, "");
  assert.equal(app.fields.startDate.getAttribute("aria-invalid"), "false");
  assert.equal(app.fields.endDate.getAttribute("aria-invalid"), "false");
  assert.deepEqual(visibleNames(app), ["D", "E"]);
  assert.equal(savedFilters(app).startDate, "2000-01-04");
  app = await app.reload();
  assert.equal(app.fields.startDate.value, "2000-01-04");
  assert.deepEqual(visibleNames(app), ["D", "E"]);
});

test("app: a first invalid range retains the unrestricted view and default preferences", async (t) => {
  let app = await startApp(t);
  const originalRows = app.rows();
  assert.deepEqual(app.controls(), defaults);
  assert.equal(app.storage.getItem(FILTER_STORAGE_KEY), null);
  app.fields.startDate.value = "2000-01-06";
  app.fields.endDate.value = "2000-01-02";
  app.input();
  assert.equal(app.nodes["#filter-message"].textContent, DATE_RANGE_ERROR);
  assert.deepEqual(app.rows(), originalRows);
  assert.equal(app.nodes["#empty-state"].hidden, true);
  assert.equal(app.storage.getItem(FILTER_STORAGE_KEY), null);
  app = await app.reload();
  assert.deepEqual(app.controls(), defaults);
  assert.deepEqual(app.rows(), originalRows);
});

test("app: Reset restores controls, rows and saved defaults without changing request data", async (t) => {
  let app = await startApp(t);
  const originalData = app.storage.getItem(STORAGE_KEY);
  const originalRows = app.rows();
  app.priorities[0].checked = false;
  app.fields.startDate.value = "2000-01-03";
  app.fields.endDate.value = "2000-01-06";
  app.fields.sort.value = "priority";
  app.input();
  assert.deepEqual(visibleNames(app), ["E", "C", "F"]);
  app.fields.startDate.value = "2000-01-07";
  app.input();
  assert.equal(app.nodes["#filter-message"].textContent, DATE_RANGE_ERROR);

  app.reset();
  assert.deepEqual(app.controls(), defaults);
  assert.deepEqual(app.rows(), originalRows);
  assert.equal(app.nodes["#request-count"].textContent, "6 requests");
  assert.equal(app.nodes["#filter-message"].textContent, "");
  assert.equal(app.fields.startDate.getAttribute("aria-invalid"), "false");
  assert.equal(app.fields.endDate.getAttribute("aria-invalid"), "false");
  assert.deepEqual(savedFilters(app), defaults);
  assert.equal(app.storage.getItem(STORAGE_KEY), originalData);
  assert.deepEqual(JSON.parse(originalData), records);
  app = await app.reload();
  assert.deepEqual(app.controls(), defaults);
  assert.deepEqual(app.rows(), originalRows);
  assert.equal(app.storage.getItem(STORAGE_KEY), originalData);
});

test("app: selecting no priorities shows the empty state and Reset restores results", async (t) => {
  const app = await startApp(t);
  for (const field of app.priorities) field.checked = false;
  app.input();
  assert.deepEqual(app.rows(), []);
  assert.equal(app.nodes["#request-count"].textContent, "0 of 6 requests");
  assert.equal(app.nodes["#empty-state"].hidden, false);
  assert.equal(app.nodes["#empty-heading"].textContent, "No matching requests");
  assert.equal(app.nodes["#request-table-wrapper"].hidden, true);
  assert.deepEqual(savedFilters(app).priorities, []);
  app.reset();
  assert.deepEqual(visibleNames(app), ["A", "B", "C", "D", "E", "F"]);
  assert.equal(app.nodes["#empty-state"].hidden, true);
  assert.equal(app.nodes["#request-table-wrapper"].hidden, false);
});

test("app: a preference-save failure warns while still applying the selected filters", async (t) => {
  const app = await startApp(t);
  app.input();
  const saved = app.storage.getItem(FILTER_STORAGE_KEY);
  app.storage.failPreferenceWrites = true;
  for (const field of app.priorities) field.checked = field.value === "High";
  app.input();
  assert.deepEqual(visibleNames(app), ["A", "E"]);
  assert.equal(app.nodes["#filter-message"].textContent,
    "Filters applied, but could not be saved for refresh.");
  assert.equal(app.storage.getItem(FILTER_STORAGE_KEY), saved);
  app.storage.failPreferenceWrites = false;
  app.input();
  assert.equal(app.nodes["#filter-message"].textContent, "");
  assert.deepEqual(savedFilters(app).priorities, ["High"]);
});
