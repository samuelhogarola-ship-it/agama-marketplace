import assert from "node:assert/strict";
import test from "node:test";

import {
  canRequestAiReview,
  combineAiReview,
  isReusableAiReview,
} from "../../src/lib/moderation-workflow.ts";

test("only an administrator can request AI review for a pending listing", () => {
  assert.equal(canRequestAiReview({ isAdmin: false, status: "pending_review" }), false);
  assert.equal(canRequestAiReview({ isAdmin: true, status: "draft" }), false);
  assert.equal(canRequestAiReview({ isAdmin: true, status: "published" }), false);
  assert.equal(canRequestAiReview({ isAdmin: true, status: "pending_review" }), true);
});

test("a saved AI review is reused until the listing changes", () => {
  assert.equal(
    isReusableAiReview({ listingUpdatedAt: "2026-09-03T10:00:00Z", reviewCreatedAt: "2026-09-03T10:01:00Z" }),
    true,
  );
  assert.equal(
    isReusableAiReview({ listingUpdatedAt: "2026-09-03T10:02:00Z", reviewCreatedAt: "2026-09-03T10:01:00Z" }),
    false,
  );
});

test("AI review returns a recommendation without deciding publication status", () => {
  assert.deepEqual(
    combineAiReview({
      text: { verdict: "approve", violations: [], confidence: 0.91, reason_es: null },
      image: { verdict: "review", violations: ["datos_contacto"], confidence: 0.82, reason_es: "Revisar una imagen." },
    }),
    {
      verdict: "review",
      violations: ["datos_contacto"],
      confidence: 0.82,
      reason_es: "Revisar una imagen.",
    },
  );
});

test("a rejection recommendation takes precedence over approval", () => {
  assert.deepEqual(
    combineAiReview({
      text: { verdict: "reject", violations: ["fuera_de_tema"], confidence: 0.96, reason_es: "No corresponde al sector." },
      image: { verdict: "approve", violations: [], confidence: 0.88, reason_es: null },
    }),
    {
      verdict: "reject",
      violations: ["fuera_de_tema"],
      confidence: 0.96,
      reason_es: "No corresponde al sector.",
    },
  );
});
