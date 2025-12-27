import { describe, it, expect } from 'vitest';
import { createItemSchema, taskSchema, tagSchema } from '../validations';

describe('Zod Validations', () => {
    describe('createItemSchema', () => {
        it('should validate 1a valid URL', () => {
            const result = createItemSchema.safeParse({ url: 'https://example.com' });
            expect(result.success).toBe(true);
        });

        it('should fail on an invalid URL', () => {
            const result = createItemSchema.safeParse({ url: 'not-a-url' });
            expect(result.success).toBe(false);
        });
    });

    describe('taskSchema', () => {
        it('should fail if title is missing', () => {
            const result = taskSchema.safeParse({ description: 'No title' });
            expect(result.success).toBe(false);
        });

        it('should pass with only a title', () => {
            const result = taskSchema.safeParse({ title: 'Task Title' });
            expect(result.success).toBe(true);
        });

        it('should validate priority enums', () => {
            const result = taskSchema.safeParse({ title: 'Task', priority: 'ultra-high' });
            expect(result.success).toBe(false);
        });
    });

    describe('tagSchema', () => {
        it('should validate hex colors', () => {
            const result = tagSchema.safeParse({ name: 'Tag', color: '#FF0000' });
            expect(result.success).toBe(true);
        });

        it('should fail on invalid hex colors', () => {
            const result = tagSchema.safeParse({ name: 'Tag', color: 'red' });
            expect(result.success).toBe(false);
        });
    });
});
