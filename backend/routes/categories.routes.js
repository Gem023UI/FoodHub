"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const category_service_1 = require("../services/category.service");
const categoriesRouter = (0, express_1.Router)();
exports.categoriesRouter = categoriesRouter;
function firstParam(value) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
categoriesRouter.get("/", async (_request, response) => {
    const categories = await (0, category_service_1.listCategories)();
    response.json({ categories });
});
categoriesRouter.post("/", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const { name, description } = request.body;
    if (!name) {
        response.status(400).json({ message: "Category name is required." });
        return;
    }
    const category = await (0, category_service_1.createCategory)({ name, ...(description !== undefined ? { description } : {}) });
    response.status(201).json({ category });
});
categoriesRouter.patch("/:categoryId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const categoryId = firstParam(request.params.categoryId);
    if (!categoryId) {
        response.status(400).json({ message: "Invalid category id." });
        return;
    }
    const updates = request.body;
    const category = await (0, category_service_1.updateCategory)(categoryId, updates);
    if (!category) {
        response.status(404).json({ message: "Category not found." });
        return;
    }
    response.json({ category });
});
categoriesRouter.delete("/:categoryId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("admin"), async (request, response) => {
    const categoryId = firstParam(request.params.categoryId);
    if (!categoryId) {
        response.status(400).json({ message: "Invalid category id." });
        return;
    }
    const deleted = await (0, category_service_1.deleteCategory)(categoryId);
    if (!deleted) {
        response.status(404).json({ message: "Category not found." });
        return;
    }
    response.status(204).send();
});
