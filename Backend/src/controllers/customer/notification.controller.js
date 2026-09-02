import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import {
  getNotificationsService,
  markNotificationReadService,
} from "../../services/customer/notification.service.js";

/**
 * GET /api/customer/notifications
 * Query param: ?unread=true  → only unread notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unread === "true";
  const notifications = await getNotificationsService(req.user.uid, unreadOnly);
  res
    .status(200)
    .json(new ApiResponse(200, { notifications, count: notifications.length }, "Notifications fetched"));
});

/**
 * PATCH /api/customer/notifications/:id/read
 * Marks a single notification as read.
 */
export const markNotificationRead = asyncHandler(async (req, res) => {
  const updated = await markNotificationReadService(req.user.uid, req.params.id);
  res.status(200).json(new ApiResponse(200, updated, "Notification marked as read"));
});
