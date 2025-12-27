import { z } from 'zod';

// Item Validations
export const createItemSchema = z.object({
  url: z.string().url('Invalid URL format'),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const updateItemSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  reminderAt: z.date().nullable().optional(),
  status: z.enum(['inbox', 'reading', 'archived', 'trash']).optional(),
  isFavorite: z.boolean().optional(),
});

// Reminder Validations
export const addReminderSchema = z.object({
  date: z.date(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  itemId: z.string().optional(),
  title: z.string().optional(),
  taskId: z.string().optional(),
}).refine(data => data.itemId || data.title || data.taskId, {
  message: "Must provide either an Item ID, Task ID, or a Title for the reminder.",
  path: ["title"],
});

// Note Validations
export const noteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Note content is required'),
  taskId: z.string().nullable().optional(),
  meetingId: z.string().nullable().optional(),
  itemId: z.string().nullable().optional(),
});

// Task Validations
export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  dueDate: z.date().nullable().optional(),
  type: z.enum(['personal', 'work']).default('personal'),
  status: z.enum(['pending', 'in_progress', 'done', 'archived']).default('pending'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  projectId: z.string().nullable().optional(),
});

// Meeting Validations
export const meetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required'),
  description: z.string().optional(),
  link: z.string().url('Invalid meeting link').or(z.literal('')).optional(),
  startTime: z.date(),
  endTime: z.date(),
  type: z.enum(['general', 'interview']).default('general'),
  stage: z.enum(['screening', 'technical', 'culture', 'offer', 'rejected']).nullable().optional(),
});

// Tag Validations
export const tagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});
