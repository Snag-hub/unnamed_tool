'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useHaptic } from '@/hooks/use-haptic';

interface PullToRefreshProps {
    children: React.ReactNode;
    onRefresh: () => Promise<void>;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { trigger: haptic } = useHaptic();
    const y = useMotionValue(0);
    const rotate = useTransform(y, [0, 80], [0, 360]);
    const opacity = useTransform(y, [0, 40], [0, 1]);

    const handleDragEnd = async () => {
        if (y.get() > 80) {
            haptic('medium');
            setIsRefreshing(true);
            animate(y, 50); // Snap to loading position
            await onRefresh();
            setIsRefreshing(false);
            animate(y, 0); // Reset
            haptic('success');
        } else {
            animate(y, 0);
        }
    };

    return (
        <motion.div
            className="relative h-full overflow-hidden"
            style={{ touchAction: 'pan-y' }} // Ensure vertical scroll still works (might need refinement for top boundary)
        >
            {/* Loading Indicator */}
            <motion.div
                className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-10 pointer-events-none"
                style={{ y, opacity }}
            >
                <motion.div style={{ rotate }} className="bg-white dark:bg-zinc-800 p-2 rounded-full shadow-md border border-zinc-100 dark:border-zinc-700">
                    <Loader2 className={`w-5 h-5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.2, bottom: 0 }} // Only elastic pull down
                onDragEnd={handleDragEnd}
                style={{ y }}
                className="h-full"
            >
                {children}
            </motion.div>
        </motion.div>
    );
}
