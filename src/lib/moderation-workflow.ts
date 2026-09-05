export type AiReviewVerdict = "approve" | "reject" | "review";

export interface AiReviewResult {
  verdict: AiReviewVerdict;
  violations: string[];
  confidence: number;
  reason_es: string | null;
}

export function canRequestAiReview({
  isAdmin,
  status,
}: {
  isAdmin: boolean;
  status: string;
}) {
  return isAdmin && status === "pending_review";
}

export function isReusableAiReview({
  listingUpdatedAt,
  reviewCreatedAt,
}: {
  listingUpdatedAt: string;
  reviewCreatedAt: string;
}) {
  return new Date(reviewCreatedAt).getTime() >= new Date(listingUpdatedAt).getTime();
}

export function isCurrentAiReviewVersion({
  reviewedListingUpdatedAt,
  currentListingUpdatedAt,
}: {
  reviewedListingUpdatedAt: string;
  currentListingUpdatedAt: string;
}) {
  return new Date(reviewedListingUpdatedAt).getTime() === new Date(currentListingUpdatedAt).getTime();
}

export function combineAiReview({
  text,
  image,
}: {
  text: AiReviewResult;
  image?: AiReviewResult | null;
}): AiReviewResult {
  if (!image || image.verdict === "approve") return text;
  if (text.verdict === "approve") return image;

  const reasons = [text.reason_es, image.reason_es].filter(
    (reason, index, all): reason is string => Boolean(reason) && all.indexOf(reason) === index,
  );

  return {
    verdict: text.verdict === "reject" || image.verdict === "reject" ? "reject" : "review",
    violations: [...new Set([...text.violations, ...image.violations])],
    confidence: Math.max(text.confidence, image.confidence),
    reason_es: reasons.length > 0 ? reasons.join(" ") : null,
  };
}

type AiReviewClaimDependencies<T> = {
  claim: () => Promise<boolean>;
  run: () => Promise<T>;
  release: () => Promise<void>;
};

export async function runWithAiReviewClaim<T>({
  claim,
  run,
  release,
}: AiReviewClaimDependencies<T>): Promise<{ claimed: false } | { claimed: true; value: T }> {
  if (!(await claim())) return { claimed: false };

  try {
    return { claimed: true, value: await run() };
  } finally {
    await release();
  }
}
