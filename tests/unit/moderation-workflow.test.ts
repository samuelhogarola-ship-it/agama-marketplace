import assert from "node:assert/strict";
import test from "node:test";

import {
  canRequestAiReview,
  combineAiReview,
  isCurrentAiReviewVersion,
  isReusableAiReview,
  runWithAiReviewClaim,
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
  assert.equal(
    isReusableAiReview({
      listingUpdatedAt: "2026-09-03T10:02:00.000001Z",
      reviewCreatedAt: "2026-09-03T10:03:00Z",
      reviewedListingUpdatedAt: "2026-09-03T10:02:00.000000Z",
    }),
    false,
  );
});

test("an AI result is only stored for the listing version it reviewed", () => {
  assert.equal(
    isCurrentAiReviewVersion({
      reviewedListingUpdatedAt: "2026-09-05T10:00:00.000Z",
      currentListingUpdatedAt: "2026-09-05T10:00:00.000Z",
    }),
    true,
  );
  assert.equal(
    isCurrentAiReviewVersion({
      reviewedListingUpdatedAt: "2026-09-05T10:00:00.000Z",
      currentListingUpdatedAt: "2026-09-05T10:00:00.000001Z",
    }),
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

test("an image rejection preserves review signals found in the text", () => {
  assert.deepEqual(
    combineAiReview({
      text: {
        verdict: "review",
        violations: ["texto_ambiguo"],
        confidence: 0.91,
        reason_es: "El texto necesita revisión.",
      },
      image: {
        verdict: "reject",
        violations: ["datos_contacto"],
        confidence: 0.84,
        reason_es: "La imagen contiene un teléfono.",
      },
    }),
    {
      verdict: "reject",
      violations: ["texto_ambiguo", "datos_contacto"],
      confidence: 0.91,
      reason_es: "El texto necesita revisión. La imagen contiene un teléfono.",
    },
  );
});

test("an AI review claim is always released after successful work", async () => {
  const events: string[] = [];

  const result = await runWithAiReviewClaim({
    claim: async () => {
      events.push("claim");
      return true;
    },
    run: async () => {
      events.push("run");
      return "recommendation";
    },
    release: async () => {
      events.push("release");
    },
  });

  assert.deepEqual(result, { claimed: true, value: "recommendation" });
  assert.deepEqual(events, ["claim", "run", "release"]);
});

test("an AI review claim prevents duplicate work and releases after failures", async () => {
  let ran = false;
  let released = false;

  const busyResult = await runWithAiReviewClaim({
    claim: async () => false,
    run: async () => {
      ran = true;
      return "unused";
    },
    release: async () => {
      released = true;
    },
  });

  assert.deepEqual(busyResult, { claimed: false });
  assert.equal(ran, false);
  assert.equal(released, false);

  await assert.rejects(
    runWithAiReviewClaim({
      claim: async () => true,
      run: async () => {
        throw new Error("OpenAI failed");
      },
      release: async () => {
        released = true;
      },
    }),
    /OpenAI failed/,
  );
  assert.equal(released, true);
});
