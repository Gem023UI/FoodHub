import { Router, type Request, type Response } from "express";
import { authenticateRequest, authorizeRoles } from "../middleware/auth";
import { createReport, listReports, updateReportStatus } from "../services/report.service";

const reportRouter = Router();

function firstParam(value: any): string | undefined {
  if (Array.isArray(value)) {
    return value[0] as string;
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

// 1. Submit report (Vendors and Admins only)
reportRouter.post(
  "/",
  authenticateRequest,
  authorizeRoles("vendor", "admin"),
  async (request: Request, response: Response) => {
    const { reportedUserId, orderId, reason, description } = request.body as {
      reportedUserId?: string;
      orderId?: string | null;
      reason?: string;
      description?: string;
    };

    if (!reportedUserId || !reason || !description) {
      response.status(400).json({ message: "reportedUserId, reason, and description are required." });
      return;
    }

    if (!request.userId) {
      response.status(401).json({ message: "Unauthorized." });
      return;
    }

    try {
      const report = await createReport({
        reporterId: request.userId,
        reportedUserId,
        orderId: orderId ?? null,
        reason: reason as any,
        description
      });
      response.status(201).json({ report });
    } catch (error) {
      response.status(400).json({ message: error instanceof Error ? error.message : "Failed to create report." });
    }
  }
);

// 2. Get all reports (Admin only)
reportRouter.get(
  "/",
  authenticateRequest,
  authorizeRoles("admin"),
  async (request: Request, response: Response) => {
    const status = firstParam(request.query.status);
    try {
      const reports = await listReports(status ? { status } : {});
      response.json({ reports });
    } catch (error) {
      response.status(500).json({ message: "Failed to fetch reports." });
    }
  }
);

// 3. Update report status and resolve/dismiss (Admin only)
reportRouter.patch(
  "/:reportId",
  authenticateRequest,
  authorizeRoles("admin"),
  async (request: Request, response: Response) => {
    const reportId = firstParam(request.params.reportId);
    const { status, adminNotes, suspendUser } = request.body as {
      status?: "Pending" | "Resolved" | "Dismissed";
      adminNotes?: string;
      suspendUser?: boolean;
    };

    if (!reportId) {
      response.status(400).json({ message: "Invalid report ID." });
      return;
    }

    if (!status || !["Pending", "Resolved", "Dismissed"].includes(status)) {
      response.status(400).json({ message: "Valid status (Pending, Resolved, Dismissed) is required." });
      return;
    }

    try {
      const report = await updateReportStatus(reportId, status, adminNotes, suspendUser);
      response.json({ report });
    } catch (error) {
      response.status(400).json({ message: error instanceof Error ? error.message : "Failed to update report." });
    }
  }
);

export { reportRouter };
