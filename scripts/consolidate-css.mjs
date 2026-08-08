import fs from "node:fs";

const file = new URL("../app.css", import.meta.url);
const source = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").trim();

function splitRules(css) {
  const rules = [];
  let cursor = 0;
  while (cursor < css.length) {
    while (/\s/.test(css[cursor] || "")) cursor += 1;
    if (cursor >= css.length) break;
    const brace = css.indexOf("{", cursor);
    if (brace < 0) break;
    const selector = css.slice(cursor, brace).trim();
    let depth = 1;
    let quote = "";
    let end = brace + 1;
    for (; end < css.length && depth; end += 1) {
      const char = css[end];
      const previous = css[end - 1];
      if (quote) {
        if (char === quote && previous !== "\\") quote = "";
      } else if (char === '"' || char === "'") quote = char;
      else if (char === "{") depth += 1;
      else if (char === "}") depth -= 1;
    }
    rules.push({ selector, body: css.slice(brace + 1, end - 1).trim(), atRule: selector.startsWith("@") });
    cursor = end;
  }
  return rules;
}

function declarations(body) {
  const values = new Map();
  const order = [];
  for (const part of body.split(";")) {
    const colon = part.indexOf(":");
    if (colon < 1) continue;
    const property = part.slice(0, colon).trim();
    const value = part.slice(colon + 1).trim();
    if (!values.has(property)) order.push(property);
    values.set(property, value);
  }
  return { values, order };
}

const parsed = splitRules(source);
const lastIndex = new Map();
parsed.forEach((rule, index) => { if (!rule.atRule) lastIndex.set(rule.selector, index); });
const merged = new Map();

parsed.forEach(rule => {
  if (rule.atRule) return;
  const target = merged.get(rule.selector) || { values: new Map(), order: [] };
  const current = declarations(rule.body);
  current.order.forEach(property => {
    if (!target.values.has(property)) target.order.push(property);
    target.values.set(property, current.values.get(property));
  });
  merged.set(rule.selector, target);
});

const output = parsed.flatMap((rule, index) => {
  if (rule.atRule) return [`${rule.selector}{${rule.body}}`];
  if (lastIndex.get(rule.selector) !== index) return [];
  const data = merged.get(rule.selector);
  return [`${rule.selector}{${data.order.map(property => `${property}:${data.values.get(property)}`).join(";")}}`];
}).join("\n");

fs.writeFileSync(file, `${output}\n`);
