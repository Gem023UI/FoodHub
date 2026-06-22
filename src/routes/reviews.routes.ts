import { Router, type Request, type Response } from "express";
import { authorizeRoles, authenticateRequest } from "../middleware/auth";
import { canManageReview, createReview, deleteReview, getReviewById, getReviewSummary, listReviewsByStall, updateReview } from "../services/review.service";

const reviewsRouter = Router();

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

reviewsRouter.get("/stall/:stallId", async (request: Request, response: Response) => {
  const stallId = firstParam(request.params.stallId);

  if (!stallId) {
    response.status(400).json({ message: "Invalid stall id." });
    return;
  }

  const reviews = await listReviewsByStall(stallId);
  const summary = await getReviewSummary(stallId);

  response.json({ reviews, summary });
});

reviewsRouter.post(
  "/",
  authenticateRequest,
  authorizeRoles("user", "vendor", "admin"),
  async (request: Request, response: Response) => {
    if (!request.userId) {
      response.status(401).json({ message: "Unauthorized." });
      return;
    }

    const { stallId, rating, comment } = request.body as {
      stallId?: string;
      rating?: number;
      comment?: string;
    };

    if (!stallId || typeof rating !== "number") {
      response.status(400).json({ message: "stallId and rating are required." });
      return;
    }

    if (rating < 1 || rating > 5) {
      response.status(400).json({ message: "rating must be between 1 and 5." });
      return;
    }

    try {
      const review = await createReview({ userId: request.userId, stallId, rating, comment });

      if (!review) {
        response.status(404).json({ message: "Stall not found." });
        return;
      }

      response.status(201).json({ review });
    } catch {
      response.status(409).json({ message: "You have already reviewed this stall." });
    }
  }
);

reviewsRouter.get("/:reviewId", async (request: Request, response: Response) => {
  const reviewId = firstParam(request.params.reviewId);

  if (!reviewId) {
    response.status(400).json({ message: "Invalid review id." });
    return;
  }

  const review = await getReviewById(reviewId);

  if (!review || !review.isVisible) {
    response.status(404).json({ message: "Review not found." });
    return;
  }

  response.json({ review });
});

reviewsRouter.patch(
  "/:reviewId",
  authenticateRequest,
  authorizeRoles("user", "vendor", "admin"),
  async (request: Request, response: Response) => {
    const reviewId = firstParam(request.params.reviewId);

    if (!reviewId) {
      response.status(400).json({ message: "Invalid review id." });
      return;
    }

    if (!request.userId || !request.role) {
      response.status(401).json({ message: "Unauthorized." });
      return;
    }

    const allowed = await canManageReview(reviewId, request.userId, request.role);

    if (!allowed) {
      response.status(403).json({ message: "You cannot edit this review." });
      return;
    }

    const { rating, comment, isVisible } = request.body as {
      rating?: number;
      comment?: string;
      isVisible?: boolean;
    };

    if (typeof rating === "number" && (rating < 1 || rating > 5)) {
      response.status(400).json({ message: "rating must be between 1 and 5." });
      return;
    }

    const review = await updateReview(reviewId, { rating, comment, isVisible });

    if (!review) {
      response.status(404).json({ message: "Review not found." });
      return;
    }

    response.json({ review });
  }
);

reviewsRouter.delete(
  "/:reviewId",
  authenticateRequest,
  authorizeRoles("user", "vendor", "admin"),
  async (request: Request, response: Response) => {
    const reviewId = firstParam(request.params.reviewId);

    if (!reviewId) {
      response.status(400).json({ message: "Invalid review id." });
      return;
    }

    if (!request.userId || !request.role) {
      response.status(401).json({ message: "Unauthorized." });
      return;
    }

    const allowed = await canManageReview(reviewId, request.userId, request.role);

    if (!allowed) {
      response.status(403).json({ message: "You cannot delete this review." });
      return;
    }

    const deleted = await deleteReview(reviewId);

    if (!deleted) {
      response.status(404).json({ message: "Review not found." });
      return;
    }

    response.status(204).send();
  }
);

export { reviewsRouter };