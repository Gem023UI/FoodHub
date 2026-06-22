"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stallsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const review_service_1 = require("../services/review.service");
const stall_service_1 = require("../services/stall.service");
const menu_item_service_1 = require("../services/menu-item.service");
const stallsRouter = (0, express_1.Router)();
exports.stallsRouter = stallsRouter;
function firstParam(value) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
stallsRouter.get("/", async (request, response) => {
    const query = {};
    if (typeof request.query.q === "string") {
        query.q = request.query.q;
    }
    if (typeof request.query.category === "string") {
        query.category = request.query.category;
    }
    if (typeof request.query.location === "string") {
        query.location = request.query.location;
    }
    if (typeof request.query.isActive === "string") {
        query.isActive = request.query.isActive === "true";
    }
    const stalls = await (0, stall_service_1.listStalls)(query);
    response.json({ stalls });
});
// Get stalls for the current vendor
stallsRouter.get("/vendor/my", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    if (!request.userId) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    try {
        const stalls = await (0, stall_service_1.listStalls)({});
        // Filter to only show stalls owned by the current vendor
        const vendorStalls = stalls.filter((stall) => {
            const vendorIdStr = stall.vendorId && typeof stall.vendorId === "object" && "_id" in stall.vendorId
                ? stall.vendorId._id.toString()
                : stall.vendorId?.toString();
            return vendorIdStr === request.userId;
        });
        response.json({ stalls: vendorStalls });
    }
    catch (err) {
        response.status(500).json({ message: "Failed to fetch vendor stalls." });
    }
});
stallsRouter.post("/", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const userId = request.userId;
    const { name, description, location, section, category, photoUrl, openingHours } = request.body;
    if (!userId) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    if (!name || !location) {
        response.status(400).json({ message: "name and location are required." });
        return;
    }
    // A vendor can only own one stall
    if (request.role === "vendor") {
        const existingStalls = await (0, stall_service_1.listStalls)({});
        const vendorStall = existingStalls.find((s) => {
            const vendorIdStr = s.vendorId && typeof s.vendorId === "object" && "_id" in s.vendorId
                ? s.vendorId._id.toString()
                : s.vendorId?.toString();
            return vendorIdStr === userId;
        });
        if (vendorStall) {
            response.status(400).json({ message: "A vendor can only register one stall." });
            return;
        }
    }
    const stall = await (0, stall_service_1.createStall)({
        vendorId: userId,
        name,
        description,
        location,
        section,
        category,
        photoUrl: photoUrl ?? null,
        openingHours,
        status: request.role === "admin" ? "approved" : "pending"
    });
    response.status(201).json({ stall });
});
stallsRouter.get("/:stallId", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    if (!stallId) {
        response.status(400).json({ message: "Invalid stall id." });
        return;
    }
    const stall = await (0, stall_service_1.getStallById)(stallId);
    if (!stall) {
        response.status(404).json({ message: "Stall not found." });
        return;
    }
    const menuItems = await (0, menu_item_service_1.listMenuItems)({ stallId });
    const reviewSummary = await (0, review_service_1.getReviewSummary)(stallId);
    response.json({ stall, menuItems, reviewSummary });
});
stallsRouter.patch("/:stallId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    if (!stallId) {
        response.status(400).json({ message: "Invalid stall id." });
        return;
    }
    if (!request.userId || !request.role) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const allowed = await (0, stall_service_1.canManageStall)(stallId, request.userId, request.role);
    if (!allowed) {
        response.status(403).json({ message: "You cannot edit this stall." });
        return;
    }
    const stall = await (0, stall_service_1.updateStall)(stallId, request.body);
    if (!stall) {
        response.status(404).json({ message: "Stall not found." });
        return;
    }
    response.json({ stall });
});
stallsRouter.get("/:stallId/menu-items", async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    if (!stallId) {
        response.status(400).json({ message: "Invalid stall id." });
        return;
    }
    const menuItems = await (0, menu_item_service_1.listMenuItems)({ stallId });
    response.json({ menuItems });
});
stallsRouter.post("/:stallId/menu-items", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    if (!stallId) {
        response.status(400).json({ message: "Invalid stall id." });
        return;
    }
    if (!request.userId || !request.role) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const allowed = await (0, stall_service_1.canManageStall)(stallId, request.userId, request.role);
    if (!allowed) {
        response.status(403).json({ message: "You cannot add menu items to this stall." });
        return;
    }
    const { name, price, description, ingredients, allergens, nutrition, photoUrl, category, isAvailable, isFeatured } = request.body;
    if (!name || typeof price !== "number") {
        response.status(400).json({ message: "name and price are required." });
        return;
    }
    const menuItem = await (0, menu_item_service_1.createMenuItem)({
        stallId,
        name,
        price,
        description,
        ingredients,
        allergens,
        nutrition,
        photoUrl: photoUrl ?? null,
        category,
        isAvailable,
        isFeatured
    });
    if (!menuItem) {
        response.status(404).json({ message: "Stall not found." });
        return;
    }
    response.status(201).json({ menuItem });
});
stallsRouter.get("/menu-items/all", auth_1.authenticateRequest, async (request, response) => {
    try {
        let menuItems = await (0, menu_item_service_1.listMenuItems)({}, true);
        if (request.role === "vendor") {
            const stalls = await (0, stall_service_1.listStalls)({});
            const vendorStallIds = stalls
                .filter((s) => {
                const vendorIdStr = s.vendorId && typeof s.vendorId === "object" && "_id" in s.vendorId
                    ? s.vendorId._id.toString()
                    : s.vendorId?.toString();
                return vendorIdStr === request.userId;
            })
                .map((s) => s._id.toString());
            menuItems = menuItems.filter((item) => {
                const stallIdStr = item.stallId && typeof item.stallId === "object" && "_id" in item.stallId
                    ? item.stallId._id.toString()
                    : item.stallId?.toString();
                return vendorStallIds.includes(stallIdStr);
            });
        }
        response.json({ menuItems });
    }
    catch (err) {
        response.status(500).json({ message: "Failed to fetch all menu items." });
    }
});
stallsRouter.get("/menu-items/:menuItemId", async (request, response) => {
    const menuItemId = firstParam(request.params.menuItemId);
    if (!menuItemId) {
        response.status(400).json({ message: "Invalid menu item id." });
        return;
    }
    const menuItem = await (0, menu_item_service_1.getMenuItemById)(menuItemId);
    if (!menuItem) {
        response.status(404).json({ message: "Menu item not found." });
        return;
    }
    response.json({ menuItem });
});
stallsRouter.patch("/menu-items/:menuItemId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    if (!request.userId || !request.role) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const menuItemId = firstParam(request.params.menuItemId);
    if (!menuItemId) {
        response.status(400).json({ message: "Invalid menu item id." });
        return;
    }
    const menuItem = await (0, menu_item_service_1.getMenuItemById)(menuItemId);
    if (!menuItem) {
        response.status(404).json({ message: "Menu item not found." });
        return;
    }
    const allowed = request.role === "admin" || (await (0, stall_service_1.canManageStall)(menuItem.stallId.toString(), request.userId, request.role));
    if (!allowed) {
        response.status(403).json({ message: "You cannot edit this menu item." });
        return;
    }
    const updatedMenuItem = await (0, menu_item_service_1.updateMenuItem)(menuItemId, request.body);
    if (!updatedMenuItem) {
        response.status(404).json({ message: "Menu item not found." });
        return;
    }
    response.json({ menuItem: updatedMenuItem });
});
stallsRouter.delete("/:stallId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    const stallId = firstParam(request.params.stallId);
    if (!stallId) {
        response.status(400).json({ message: "Invalid stall id." });
        return;
    }
    if (!request.userId || !request.role) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const allowed = await (0, stall_service_1.canManageStall)(stallId, request.userId, request.role);
    if (!allowed) {
        response.status(403).json({ message: "You cannot delete this stall." });
        return;
    }
    const deleted = await (0, stall_service_1.deleteStall)(stallId);
    if (!deleted) {
        response.status(404).json({ message: "Stall not found." });
        return;
    }
    response.status(204).send();
});
stallsRouter.delete("/menu-items/:menuItemId", auth_1.authenticateRequest, (0, auth_1.authorizeRoles)("vendor", "admin"), async (request, response) => {
    if (!request.userId || !request.role) {
        response.status(401).json({ message: "Unauthorized." });
        return;
    }
    const menuItemId = firstParam(request.params.menuItemId);
    if (!menuItemId) {
        response.status(400).json({ message: "Invalid menu item id." });
        return;
    }
    const menuItem = await (0, menu_item_service_1.getMenuItemById)(menuItemId);
    if (!menuItem) {
        response.status(404).json({ message: "Menu item not found." });
        return;
    }
    const allowed = request.role === "admin" || (await (0, stall_service_1.canManageStall)(menuItem.stallId.toString(), request.userId, request.role));
    if (!allowed) {
        response.status(403).json({ message: "You cannot delete this menu item." });
        return;
    }
    const deleted = await (0, menu_item_service_1.deleteMenuItem)(menuItemId);
    if (!deleted) {
        response.status(404).json({ message: "Menu item not found." });
        return;
    }
    response.status(204).send();
});
