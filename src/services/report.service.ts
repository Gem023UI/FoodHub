import { ReportModel, UserModel } from "../models";
import { isValidObjectId } from "../utils/ids";

export interface CreateReportInput {
  reporterId: string;
  reportedUserId: string;
  orderId?: string | null;
  reason: "No-show / Unclaimed order" | "Fake / Duplicate GCash payment" | "Abusive behavior / Language" | "Other";
  description: string;
}

export async function createReport(input: CreateReportInput) {
  if (!isValidObjectId(input.reporterId) || !isValidObjectId(input.reportedUserId)) {
    throw new Error("Invalid reporter or reported user ID.");
  }
  if (input.orderId && !isValidObjectId(input.orderId)) {
    throw new Error("Invalid order ID.");
  }

  const reportedUser = await UserModel.findById(input.reportedUserId);
  if (!reportedUser) {
    throw new Error("Reported user not found.");
  }

  const report = await ReportModel.create({
    reporterId: input.reporterId,
    reportedUserId: input.reportedUserId,
    orderId: input.orderId || null,
    reason: input.reason,
    description: input.description
  });

  return report;
}

export async function listReports(filters: { status?: string } = {}) {
  const query: Record<string, unknown> = {};
  if (filters.status) {
    query.status = filters.status;
  }

  return ReportModel.find(query)
    .populate("reporterId", "name email")
    .populate("reportedUserId", "name email studentId courseSection schoolEmail contactNumber status isActive")
    .populate("orderId", "totalAmount status paymentMethod gcashNumber")
    .sort({ createdAt: -1 })
    .lean();
}

export async function updateReportStatus(
  reportId: string,
  status: "Pending" | "Resolved" | "Dismissed",
  adminNotes?: string,
  suspendUser?: boolean
) {
  if (!isValidObjectId(reportId)) {
    throw new Error("Invalid report ID.");
  }

  const report = await ReportModel.findById(reportId);
  if (!report) {
    throw new Error("Report not found.");
  }

  report.status = status;
  if (adminNotes !== undefined) {
    report.adminNotes = adminNotes;
  }

  if (status === "Resolved" && suspendUser) {
    await UserModel.findByIdAndUpdate(report.reportedUserId, {
      $set: { status: "Suspended", isActive: false }
    });
  }

  await report.save();
  return report;
}
