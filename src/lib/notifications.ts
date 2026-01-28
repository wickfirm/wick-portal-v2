/**
 * Notification Utilities
 * Centralized functions for creating, managing, and sending notifications
 */

import prisma from "@/lib/prisma";
import { NotificationType, NotificationCategory, NotificationPriority } from "@prisma/client";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  actionType?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  emailDigest: "REAL_TIME" | "DAILY" | "WEEKLY" | "NEVER";
  quietHoursStart?: number;
  quietHoursEnd?: number;
  preferences: Record<string, any>;
}

/**
 * Check if user is in quiet hours
 */
export function isInQuietHours(
  quietHoursStart?: number | null,
  quietHoursEnd?: number | null
): boolean {
  if (!quietHoursStart || !quietHoursEnd) return false;

  const now = new Date();
  const currentHour = now.getHours();

  if (quietHoursStart < quietHoursEnd) {
    return currentHour >= quietHoursStart && currentHour < quietHoursEnd;
  } else {
    return currentHour >= quietHoursStart || currentHour < quietHoursEnd;
  }
}

/**
 * Check if notification type is enabled for user
 */
export function isNotificationTypeEnabled(
  preferences: NotificationPreferences,
  type: NotificationType
): boolean {
  const typePrefs = preferences.preferences as Record<string, any>;
  
  // If no specific preference, default to enabled
  if (!(type in typePrefs)) return true;
  
  return typePrefs[type] === true;
}

/**
 * Create a single notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  try {
    // Get user preferences
    const userPrefs = await prisma.notificationPreference.findUnique({
      where: { userId: input.userId },
    });

    // Check if in quiet hours
    if (userPrefs && isInQuietHours(userPrefs.quietHoursStart, userPrefs.quietHoursEnd)) {
      console.log(`Notification skipped for user ${input.userId} - quiet hours`);
      return;
    }

    // Check if notification type is enabled
    if (userPrefs && !isNotificationTypeEnabled(userPrefs as NotificationPreferences, input.type)) {
      console.log(`Notification skipped for user ${input.userId} - type ${input.type} disabled`);
      return;
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        category: input.category,
        priority: input.priority || "NORMAL",
        title: input.title,
        message: input.message,
        link: input.link,
        actionType: input.actionType,
        actionUrl: input.actionUrl,
        metadata: input.metadata || {},
        expiresAt: input.expiresAt,
      },
    });

    console.log(`Notification created for user ${input.userId}: ${input.title}`);
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationInput, "userId">
): Promise<void> {
  const promises = userIds.map((userId) =>
    createNotification({ ...notification, userId })
  );

  await Promise.allSettled(promises);
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId, // Security: ensure user owns this notification
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Delete old/expired notifications (cleanup function)
 * Should be run via cron job
 */
export async function cleanupExpiredNotifications(): Promise<number> {
  const result = await prisma.notification.deleteMany({
    where: {
      OR: [
        {
          expiresAt: {
            lt: new Date(),
          },
        },
        {
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days old
          },
        },
      ],
    },
  });

  return result.count;
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Get user's notification preferences (create if not exists)
 */
export async function getUserPreferences(
  userId: string
): Promise<NotificationPreferences> {
  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  // Create default preferences if not exists
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({
      data: {
        userId,
        emailEnabled: true,
        pushEnabled: true,
        emailDigest: "REAL_TIME",
        preferences: {},
      },
    });
  }

  return prefs as NotificationPreferences;
}

/**
 * Update user's notification preferences
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
): Promise<void> {
  await prisma.notificationPreference.upsert({
    where: { userId },
    update: updates,
    create: {
      userId,
      emailEnabled: updates.emailEnabled ?? true,
      pushEnabled: updates.pushEnabled ?? true,
      emailDigest: updates.emailDigest ?? "REAL_TIME",
      preferences: updates.preferences ?? {},
    },
  });
}

// ============================================================================
// NOTIFICATION TEMPLATES
// Helper functions to create common notification types
// ============================================================================

/**
 * Task assigned notification
 */
export async function notifyTaskAssigned(params: {
  userId: string;
  taskId: string;
  taskTitle: string;
  assignedBy: string;
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    type: "TASK_ASSIGNED",
    category: "TASK",
    priority: "NORMAL",
    title: "New Task Assigned",
    message: `You have been assigned to "${params.taskTitle}"`,
    link: `/tasks/${params.taskId}`,
    metadata: {
      taskId: params.taskId,
      assignedBy: params.assignedBy,
    },
  });
}

/**
 * Task due soon notification
 */
export async function notifyTaskDueSoon(params: {
  userId: string;
  taskId: string;
  taskTitle: string;
  dueDate: Date;
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    type: "TASK_DUE_SOON",
    category: "TASK",
    priority: "HIGH",
    title: "Task Due Soon",
    message: `"${params.taskTitle}" is due soon`,
    link: `/tasks/${params.taskId}`,
    metadata: {
      taskId: params.taskId,
      dueDate: params.dueDate.toISOString(),
    },
  });
}

/**
 * Task overdue notification
 */
export async function notifyTaskOverdue(params: {
  userId: string;
  taskId: string;
  taskTitle: string;
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    type: "TASK_OVERDUE",
    category: "TASK",
    priority: "URGENT",
    title: "Task Overdue",
    message: `"${params.taskTitle}" is overdue`,
    link: `/tasks/${params.taskId}`,
    metadata: {
      taskId: params.taskId,
    },
  });
}

/**
 * New comment notification
 */
export async function notifyNewComment(params: {
  userId: string;
  taskId: string;
  taskTitle: string;
  commentBy: string;
  commentPreview: string;
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    type: "TASK_COMMENT",
    category: "TASK",
    priority: "NORMAL",
    title: "New Comment",
    message: `${params.commentBy} commented on "${params.taskTitle}"`,
    link: `/tasks/${params.taskId}`,
    metadata: {
      taskId: params.taskId,
      commentBy: params.commentBy,
      preview: params.commentPreview.substring(0, 100),
    },
  });
}

/**
 * Mentioned in comment notification
 */
export async function notifyMentioned(params: {
  userId: string;
  taskId: string;
  taskTitle: string;
  mentionedBy: string;
  context: string;
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    type: "TASK_MENTIONED",
    category: "TASK",
    priority: "HIGH",
    title: "You Were Mentioned",
    message: `${params.mentionedBy} mentioned you in "${params.taskTitle}"`,
    link: `/tasks/${params.taskId}`,
    metadata: {
      taskId: params.taskId,
      mentionedBy: params.mentionedBy,
      context: params.context,
    },
  });
}

/**
 * Project deadline approaching notification
 */
export async function notifyProjectDeadline(params: {
  userId: string;
  projectId: string;
  projectName: string;
  deadline: Date;
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    type: "PROJECT_DEADLINE",
    category: "PROJECT",
    priority: "HIGH",
    title: "Project Deadline Approaching",
    message: `"${params.projectName}" deadline is approaching`,
    link: `/projects/${params.projectId}`,
    metadata: {
      projectId: params.projectId,
      deadline: params.deadline.toISOString(),
    },
  });
}
