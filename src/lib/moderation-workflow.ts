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

export function combineAiReview({
  text,
  image,
}: {
  text: AiReviewResult;
  image?: AiReviewResult | null;
}): AiReviewResult {
  if (!image || image.verdict === "approve") return text;
  if (image.verdict === "reject" || text.verdict === "approve") return image;

  return {
    verdict: text.verdict === "reject" ? "reject" : "review",
    violations: [...new Set([...text.violations, ...image.violations])],
    confidence: Math.max(text.confidence, image.confidence),
    reason_es: text.reason_es ?? image.reason_es,
  };
}
