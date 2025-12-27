import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock auth from Clerk
vi.mock('@clerk/nextjs/server', () => ({
    auth: vi.fn(() => Promise.resolve({ userId: 'test-user-id' })),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
}));
