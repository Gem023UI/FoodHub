import { Router, type Request, type Response } from "express";
import {
  getTopRatedStalls,
  getTopRatedItems,
  getMostPopularItems,
  getTrendingThisWeek,
  getMostFavoritedStalls,
  getMostFavoritedItems,
  getCheapestItems,
  getBestValue,
  getMostReviewedStalls,
  getNewArrivals
} from "../services/analytics.service";

const analyticsRouter = Router();

analyticsRouter.get("/top-rated-stalls", async (_request: Request, response: Response) => {
  try {
    const stalls = await getTopRatedStalls(3);
    response.json(stalls);
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch top rated stalls." });
  }
});

analyticsRouter.get("/top-rated-items", async (_request: Request, response: Response) => {
  try {
    const items = await getTopRatedItems(3);
    response.json(items);
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch top rated items." });
  }
});

analyticsRouter.get("/most-popular-items", async (_request: Request, response: Response) => {
  try {
    const items = await getMostPopularItems(3);
    response.json(items);
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch most popular items." });
  }
});

analyticsRouter.get("/trending-week", async (_request: Request, response: Response) => {
  try {
    const items = await getTrendingThisWeek(3);
    response.json(items);
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch trending items." });
  }
});

analyticsRouter.get("/most-favorited-stalls", async (_request: Request, response: Response) => {
  try {
    const stalls = await getMostFavoritedStalls(3);
    response.json(stalls);
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch most favorited stalls." });
  }
});

analyticsRouter.get("/most-favorited-items", async (_request: Request, response: Response) => {
  try {
    const items = await getMostFavoritedItems(3);
    response.json(items);
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch most favorited items." });
  }
});

analyticsRouter.get("/cheapest-items", async (_request: Request, response: Response) => {
  try {
    const items = await getCheapestItems(3);
    response.json(items);
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch cheapest items." });
  }
});

analyticsRouter.get("/best-value", async (_request: Request, response: Response) => {
  try {
    const items = await getBestValue(3);
    response.json(items);
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch best value items." });
  }
});

analyticsRouter.get("/most-reviewed-stalls", async (_request: Request, response: Response) => {
  try {
    const stalls = await getMostReviewedStalls(3);
    response.json(stalls);
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch most reviewed stalls." });
  }
});

analyticsRouter.get("/new-arrivals", async (_request: Request, response: Response) => {
  try {
    const items = await getNewArrivals(3);
    response.json(items);
  } catch (error) {
    response.status(500).json({ message: "Failed to fetch new arrivals." });
  }
});

export { analyticsRouter };
