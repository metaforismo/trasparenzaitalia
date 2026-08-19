import assert from "node:assert/strict";
import test from "node:test";
import {
  parseDelimitedRecords,
  parsePublicNumber,
} from "../src/lib/data/delimited.ts";
import {
  SOURCE_IDS,
  SOURCE_POLICIES,
} from "../src/lib/data/source-policy.ts";

test("semicolon parser preserves quoted delimiters and escaped quotes", () => {
  const csv = [
    '"Nome";"Descrizione";"Totale";',
    '"Ente A";"Voce; con separatore";1234.50;',
    '"Ente B";"Testo con ""virgolette""";10,25;',
  ].join("\r\n");

  const records = parseDelimitedRecords(csv);

  assert.equal(records.length, 2);
  assert.deepEqual(records[0], {
    Nome: "Ente A",
    Descrizione: "Voce; con separatore",
    Totale: "1234.50",
  });
  assert.equal(records[1].Descrizione, 'Testo con "virgolette"');
  assert.equal(parsePublicNumber(records[1].Totale), 10.25);
});

test("public number parser handles whitespace, decimal comma and empty values", () => {
  assert.equal(parsePublicNumber(" 1234,56 "), 1234.56);
  assert.equal(parsePublicNumber("0.00"), 0);
  assert.equal(parsePublicNumber(undefined), 0);
  assert.equal(parsePublicNumber("not-a-number"), 0);
});

test("every registered source has a complete operational policy", () => {
  assert.equal(new Set(SOURCE_IDS).size, SOURCE_IDS.length);
  assert.ok(SOURCE_IDS.length >= 10);

  for (const sourceId of SOURCE_IDS) {
    const policy = SOURCE_POLICIES[sourceId];
    assert.equal(policy.id, sourceId);
    assert.match(policy.sourceUrl, /^https:\/\//);
    assert.ok(policy.discoveryRevalidateSeconds > 0);
    assert.ok(policy.dataRevalidateSeconds > 0);
    assert.ok(policy.timeoutMs >= 1_000);
    assert.ok(policy.maxRetries >= 0 && policy.maxRetries <= 2);
    assert.ok(policy.tags.includes(`source:${sourceId}`));
  }
});
