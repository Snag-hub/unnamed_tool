
import { useEffect } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface HotkeyOptions {
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    preventDefault?: boolean;
}

export function useHotkeys(key: string, handler: KeyHandler, options: HotkeyOptions = {}) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() !== key.toLowerCase()) return;

            if (options.ctrlKey && !event.ctrlKey) return;
            if (options.metaKey && !event.metaKey) return;
            if (options.shiftKey && !event.shiftKey) return;
            if (options.altKey && !event.altKey) return;

            // Ignore if inside input/textarea unless allowed (not implemented here, safe default)
            const target = event.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

            if (options.preventDefault) {
                event.preventDefault();
            }

            handler(event);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [key, handler, options]);
}
