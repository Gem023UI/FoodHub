import { ReviewModel, StallModel } from "../models";
import { isValidObjectId } from "../utils/ids";

export interface CreateReviewInput {
  userId: string;
  stallId: string;
  rating: number;
  comment?: string | undefined;
}

export interface UpdateReviewInput {
  rating?: number | undefined;
  comment?: string | undefined;
  isVisible?: boolean | undefined;
}

export async function listReviewsByStall(stallId: string) {
  if (!isValidObjectId(stallId)) {
    return [];
  }

  return ReviewModel.find({ stallId, isVisible: true }).sort({ createdAt: -1 }).lean();
}

export async function getReviewSummary(stallId: string) {
  if (!isValidObjectId(stallId)) {
    return { averageRating: 0, reviewCount: 0 };
  }

  const summary = await ReviewModel.aggregate<{
    averageRating: number | null;
    reviewCount: number;
  }>([
    { $match: { stallId: StallModel.db.base.Types.ObjectId.createFromHexString(stallId), isVisible: true } },
    {
      $group: {
        _id: "$stallId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  const firstSummary = summary[0];

  if (!firstSummary) {
    return { averageRating: 0, reviewCount: 0 };
  }

  return {
    averageRating: Number(firstSummary.averageRating?.toFixed(1) ?? 0),
    reviewCount: firstSummary.reviewCount
  };
}

export async function createReview(input: CreateReviewInput) {
  const stall = await StallModel.findById(input.stallId).select("_id").lean();

  if (!stall) {
    return null;
  }

  const review = await ReviewModel.create({
    userId: input.userId,
    stallId: input.stallId,
    rating: input.rating,
    comment: input.comment ?? ""
  });

  return review.toObject();
}

export async function getReviewById(reviewId: string) {
  if (!isValidObjectId(reviewId)) {
    return null;
  }

  return ReviewModel.findById(reviewId).lean();
}

export async function updateReview(reviewId: string, updates: UpdateReviewInput) {
  if (!isValidObjectId(reviewId)) {
    return null;
  }

  return ReviewModel.findByIdAndUpdate(reviewId, { $set: updates }, { new: true }).lean();
}

export async function deleteReview(reviewId: string): Promise<boolean> {
  if (!isValidObjectId(reviewId)) {
    return false;
  }

  const result = await ReviewModel.findByIdAndDelete(reviewId);
  return Boolean(result);
}

export async function canManageReview(reviewId: string, actorId: string, actorRole: "user" | "vendor" | "admin") {
  if (actorRole === "admin") {
    return true;
  }

  const review = await ReviewModel.findById(reviewId).select("userId").lean();

  if (!review) {
    return false;
  }

  return review.userId.toString() === actorId;
}