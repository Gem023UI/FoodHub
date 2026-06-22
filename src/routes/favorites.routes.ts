import { Router, type Request, type Response } from "express";
import { authenticateRequest } from "../middleware/auth";
import { addFavorite, listFavoritesByUser, removeFavorite } from "../services/favorite.service";

const favoritesRouter = Router();

favoritesRouter.get("/me", authenticateRequest, async (request: Request, response: Response) => {
  if (!request.userId) {
    response.status(401).json({ message: "Unauthorized." });
    return;
  }

  const favorites = await listFavoritesByUser(request.userId);
  response.json({ favorites });
});

favoritesRouter.post("/", authenticateRequest, async (request: Request, response: Response) => {
  if (!request.userId) {
    response.status(401).json({ message: "Unauthorized." });
    return;
  }

  const { targetType, targetId } = request.body as {
    targetType?: "stall" | "menuItem";
    targetId?: string;
  };

  if (!targetType || !targetId) {
    response.status(400).json({ message: "targetType and targetId are required." });
    return;
  }

  const favorite = await addFavorite(request.userId, { targetType, targetId });

  if (!favorite) {
    response.status(404).json({ message: "Target not found." });
    return;
  }

  response.status(201).json({ favorite });
});

favoritesRouter.delete("/", authenticateRequest, async (request: Request, response: Response) => {
  if (!request.userId) {
    response.status(401).json({ message: "Unauthorized." });
    return;
  }

  const { targetType, targetId } = request.body as {
    targetType?: "stall" | "menuItem";
    targetId?: string;
  };

  if (!targetType || !targetId) {
    response.status(400).json({ message: "targetType and targetId are required." });
    return;
  }

  const deleted = await removeFavorite(request.userId, targetType, targetId);

  if (!deleted) {
    response.status(404).json({ message: "Favorite not found." });
    return;
  }

  response.status(204).send();
});

export { favoritesRouter };