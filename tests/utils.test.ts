import { describe, expect, test } from "bun:test";

import { QUOTES } from "../quotes";
import {
  deduplicateQuotes,
  getQuotesForSource,
  parseQuoteInput,
  wordWrap,
} from "../utils";

describe("parseQuoteInput", () => {
  test("parses a quoted quote followed by an author", () => {
    expect(parseQuoteInput('"Stay hungry" - Steve Jobs')).toEqual({
      quote: "Stay hungry",
      author: "Steve Jobs",
    });
  });

  test("tolerates surrounding whitespace around the separator", () => {
    expect(parseQuoteInput('  "A b"   -   A B  ')).toEqual({
      quote: "A b",
      author: "A B",
    });
  });

  test("returns null when the format is incomplete", () => {
    expect(parseQuoteInput("no separator")).toBeNull();
    expect(parseQuoteInput('"only a quote"')).toBeNull();
    expect(parseQuoteInput('"" - Author')).toBeNull();
    expect(parseQuoteInput('"Quote" - ')).toBeNull();
  });
});

describe("deduplicateQuotes", () => {
  test("keeps the first of duplicate quote/author pairs", () => {
    const a = { quote: "Q", author: "A" };
    const b = { quote: "Q", author: "A" };
    const c = { quote: "Q", author: "B" };
    expect(deduplicateQuotes([a, b, c])).toEqual([a, c]);
  });
});

describe("getQuotesForSource", () => {
  const custom = [{ quote: "Custom", author: "Me" }];

  test("builtin returns the corpus unchanged", () => {
    expect(getQuotesForSource("builtin", custom)).toBe(QUOTES);
  });

  test("custom returns only the custom quotes", () => {
    expect(getQuotesForSource("custom", custom)).toBe(custom);
  });

  test("both merges the corpus with unique custom quotes", () => {
    const result = getQuotesForSource("both", custom);
    expect(result).toContain(QUOTES[0]!);
    expect(result).toContain(custom[0]!);
    expect(result.length).toBe(QUOTES.length + 1);
  });
});

describe("wordWrap", () => {
  test("keeps a single short word on one line", () => {
    expect(wordWrap("Hello", 40)).toEqual(["Hello"]);
  });

  test("never exceeds the requested width", () => {
    const text =
      "The quick brown fox jumps over the lazy dog and keeps on running far away";
    const lines = wordWrap(text, 30);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(30);
    }
  });

  test("preserves every word", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const lines = wordWrap(text, 20);
    expect(lines.join("").split(" ").filter(Boolean)).toEqual(text.split(" "));
  });
});
