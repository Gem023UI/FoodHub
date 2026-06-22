import express, { Request, Response } from "express";
import { authRouter } from "./routes/auth.routes";
import { categoriesRouter } from "./routes/categories.routes";
import { favoritesRouter } from "./routes/favorites.routes";
import { reviewsRouter } from "./routes/reviews.routes";
import { stallsRouter } from "./routes/stalls.routes";
import { usersRouter } from "./routes/users.routes";
import { analyticsRouter } from "./routes/analytics.routes";
import { aiRouter } from "./routes/ai.routes";
import { ordersRouter } from "./routes/order.routes";
import { reportRouter } from "./routes/report.routes";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use("/auth", authRouter);
  app.use("/categories", categoriesRouter);
  app.use("/reviews", reviewsRouter);
  app.use("/favorites", favoritesRouter);
  app.use("/stalls", stallsRouter);
  app.use("/users", usersRouter);
  app.use("/analytics", analyticsRouter);
  app.use("/ai", aiRouter);
  app.use("/orders", ordersRouter);
  app.use("/reports", reportRouter);

  app.get("/health", (_request: Request, response: Response) => {
    response.json({ status: "ok", service: "FoodHub API" });
  });

  return app;
}