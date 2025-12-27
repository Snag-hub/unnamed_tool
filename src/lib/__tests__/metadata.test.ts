import { describe, it, expect, vi } from 'vitest';
import { getMetadata } from '../metadata';
import ogs from 'open-graph-scraper';

// Mock open-graph-scraper
vi.mock('open-graph-scraper', () => ({
    default: vi.fn(),
}));

describe('getMetadata', () => {
    it('should return safe fallback for invalid URL', async () => {
        const result = await getMetadata('not-a-url');
        expect(result.title).toBe('Invalid URL');
        expect(result.type).toBe('other');
    });

    it('should return metadata when ogs succeeds', async () => {
        (ogs as any).mockResolvedValue({
            result: {
                ogTitle: 'Test Page',
                ogDescription: 'Test Description',
                ogImage: [{ url: 'https://example.com/image.jpg' }],
                ogSiteName: 'Test Site',
                ogType: 'article',
            },
        });

        const result = await getMetadata('https://example.com');

        expect(result.title).toBe('Test Page');
        expect(result.description).toBe('Test Description');
        expect(result.image).toBe('https://example.com/image.jpg');
        expect(result.siteName).toBe('Test Site');
        expect(result.type).toBe('article');
    });

    it('should handle video types from URL', async () => {
        (ogs as any).mockResolvedValue({
            result: {
                ogTitle: 'YouTube Video',
            },
        });

        const result = await getMetadata('https://www.youtube.com/watch?v=123');
        expect(result.type).toBe('video');
    });

    it('should handle failures and return a fallback', async () => {
        (ogs as any).mockRejectedValue(new Error('Fetch failed'));

        const result = await getMetadata('https://broken-link.com');
        expect(result.title).toBe('Untitled Link');
        expect(result.description).toBe('Could not fetch metadata for this link');
    });
});
