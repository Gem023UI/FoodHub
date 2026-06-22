import { Router, type Request, type Response } from "express";
import { authenticateRequest, authorizeRoles } from "../middleware/auth";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory
} from "../services/category.service";

const categoriesRouter = Router();

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

categoriesRouter.get("/", async (_request: Request, response: Response) => {
  const categories = await listCategories();
  response.json({ categories });
});

categoriesRouter.post(
  "/",
  authenticateRequest,
  authorizeRoles("admin"),
  async (request: Request, response: Response) => {
    const { name, description } = request.body as { name?: string; description?: string };

    if (!name) {
      response.status(400).json({ message: "Category name is required." });
      return;
    }

    const category = await createCategory({ name, ...(description !== undefined ? { description } : {}) });
    response.status(201).json({ category });
  }
);

categoriesRouter.patch(
  "/:categoryId",
  authenticateRequest,
  authorizeRoles("admin"),
  async (request: Request, response: Response) => {
    const categoryId = firstParam(request.params.categoryId);

    if (!categoryId) {
      response.status(400).json({ message: "Invalid category id." });
      return;
    }

    const updates = request.body as { name?: string; description?: string };
    const category = await updateCategory(categoryId, updates);

    if (!category) {
      response.status(404).json({ message: "Category not found." });
      return;
    }

    response.json({ category });
  }
);

categoriesRouter.delete(
  "/:categoryId",
  authenticateRequest,
  authorizeRoles("admin"),
  async (request: Request, response: Response) => {
    const categoryId = firstParam(request.params.categoryId);

    if (!categoryId) {
      response.status(400).json({ message: "Invalid category id." });
      return;
    }

    const deleted = await deleteCategory(categoryId);

    if (!deleted) {
      response.status(404).json({ message: "Category not found." });
      return;
    }

    response.status(204).send();
  }
);

export { categoriesRouter }; 
