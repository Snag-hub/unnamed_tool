import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import nodeFetch from 'node-fetch';

export interface ExtractedContent {
    content: string;
    textContent: string;
    excerpt: string;
}

export async function extractContent(url: string): Promise<ExtractedContent | null> {
    try {
        const response = await nodeFetch(url, {
            headers: {
                'User-Agent': 'DayOS-Bot/1.0 (+https://dayos.app)',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch content: ${response.statusText}`);
        }

        const html = await response.text();
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            return null;
        }

        return {
            content: article.content || '', // Sanitized HTML
            textContent: article.textContent || '',
            excerpt: article.excerpt || '',
        };
    } catch (error) {
        console.error('Content extraction failed:', error);
        return null;
    }
}
