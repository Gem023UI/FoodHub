import { Router, type Request, type Response } from "express";
import { authenticateRequest, authorizeRoles } from "../middleware/auth";
import { generateNutritionAndDescription } from "../services/ai.service";

const aiRouter = Router();

aiRouter.post(
  "/generate-nutrition",
  authenticateRequest,
  authorizeRoles("vendor", "admin"),
  async (request: Request, response: Response) => {
    try {
      const { name, category, description } = request.body as { name?: string; category?: string; description?: string };

      if (!name) {
        response.status(400).json({ message: "Product name is required for generation." });
        return;
      }

      const result = await generateNutritionAndDescription(name, category, description);
      response.json(result);
    } catch (error) {
      response.status(500).json({ message: "Failed to generate food details." });
    }
  }
);

export { aiRouter };
