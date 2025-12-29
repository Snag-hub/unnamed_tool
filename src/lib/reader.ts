import { Readability } from '@mozilla/readability';
import { Window } from 'happy-dom';
import createDOMPurify from 'dompurify';

export interface ExtractedContent {
    content: string;
    textContent: string;
    excerpt: string;
}

export async function extractContent(url: string): Promise<ExtractedContent | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'DayOS-Bot/1.0 (+https://dayos.app)',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch content: ${response.statusText}`);
        }

        const html = await response.text();
        const window = new Window({ url });
        const document = window.document;
        document.write(html);

        // Initialize DOMPurify with the happy-dom window
        const DOMPurify = createDOMPurify(window as unknown as Window);

        const reader = new Readability(document as unknown as Document);
        const article = reader.parse();

        if (!article) {
            return null;
        }

        return {
            content: DOMPurify.sanitize(article.content || ''),
            textContent: article.textContent || '',
            excerpt: article.excerpt || '',
        };
    } catch (error) {
        console.error('Content extraction failed:', error);
        return null;
    }
}
