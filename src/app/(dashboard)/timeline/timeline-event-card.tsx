'use client';

import { useState } from 'react';
import { TimelineEvent, formatTime, formatDuration } from '@/lib/timeline-utils';
import { Clock, Calendar, CheckSquare, BookOpen, Bell, ExternalLink, Check, X } from 'lucide-react';
import { updateStatus } from '@/app/actions';
import { updateTaskStatus } from '@/app/task-actions';

type TimelineEventCardProps = {
    event: TimelineEvent;
};

export function TimelineEventCard({ event }: TimelineEventCardProps) {
    const [isPending, setIsPending] = useState(false);

    // Get icon based on event type
    const getIcon = () => {
        switch (event.type) {
            case 'meeting':
                return <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />;
            case 'task':
                return <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />;
            case 'item':
                return <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />;
            case 'reminder':
                return <Bell className="w-3 h-3 sm:w-4 sm:h-4" />;
            case 'free-time':
                return <Clock className="w-3 h-3 sm:w-4 sm:h-4" />;
            default:
                return <Clock className="w-3 h-3 sm:w-4 sm:h-4" />;
        }
    };

    // Get color classes based on event type
    const getColorClasses = () => {
        switch (event.type) {
            case 'meeting':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-200 dark:border-blue-800',
                    text: 'text-blue-700 dark:text-blue-300',
                    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
                };
            case 'task':
                return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    border: 'border-green-200 dark:border-green-800',
                    text: 'text-green-700 dark:text-green-300',
                    iconBg: 'bg-green-100 dark:bg-green-900/40',
                };
            case 'item':
                return {
                    bg: 'bg-purple-50 dark:bg-purple-900/20',
                    border: 'border-purple-200 dark:border-purple-800',
                    text: 'text-purple-700 dark:text-purple-300',
                    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
                };
            case 'reminder':
                return {
                    bg: 'bg-orange-50 dark:bg-orange-900/20',
                    border: 'border-orange-200 dark:border-orange-800',
                    text: 'text-orange-700 dark:text-orange-300',
                    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
                };
            case 'free-time':
                return {
                    bg: 'bg-zinc-50 dark:bg-zinc-900/20',
                    border: 'border-zinc-200 dark:border-zinc-800 border-dashed',
                    text: 'text-zinc-500 dark:text-zinc-400',
                    iconBg: 'bg-zinc-100 dark:bg-zinc-800',
                };
            default:
                return {
                    bg: 'bg-zinc-50 dark:bg-zinc-900/20',
                    border: 'border-zinc-200 dark:border-zinc-800',
                    text: 'text-zinc-700 dark:text-zinc-300',
                    iconBg: 'bg-zinc-100 dark:bg-zinc-800',
                };
        }
    };

    const colors = getColorClasses();
    const icon = getIcon();

    // Format time range
    const timeRange = event.endTime
        ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
        : formatTime(event.startTime);

    // Handle click for items (open URL)
    const handleClick = () => {
        if (event.type === 'item' && event.url) {
            window.open(event.url, '_blank');
        }
    };

    // Quick action: Mark task as done
    const handleMarkDone = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (event.type === 'task') {
            setIsPending(true);
            await updateTaskStatus(event.id, 'done');
            setIsPending(false);
        }
    };

    // Quick action: Archive item
    const handleArchive = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (event.type === 'item') {
            setIsPending(true);
            await updateStatus(event.id, 'archived');
            setIsPending(false);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`
                relative p-2 sm:p-3 rounded-lg border transition-all group
                ${colors.bg} ${colors.border}
                ${event.type === 'item' && event.url ? 'cursor-pointer hover:shadow-md' : ''}
                ${event.type === 'free-time' ? 'opacity-60' : ''}
                ${isPending ? 'opacity-50 pointer-events-none' : ''}
                w-[90%]
            `}
        >
            <div className="flex items-start gap-2 sm:gap-3">
                {/* Icon */}
                <div className={`p-1 sm:p-1.5 rounded ${colors.iconBg} ${colors.text} flex-shrink-0`}>
                    {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            {/* Title - Allow wrapping */}
                            <h4 className={`font-medium text-xs sm:text-sm ${colors.text} break-words`}>
                                {event.title}
                            </h4>

                            {/* Time and duration */}
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                                <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                    {timeRange}
                                </span>
                                {event.duration && (
                                    <>
                                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                        <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                            {formatDuration(event.duration)}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Metadata */}
                            {event.metadata?.siteName && (
                                <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                                    {event.favicon && (
                                        <img src={event.favicon} alt="" className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded flex-shrink-0" />
                                    )}
                                    <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 break-words">
                                        {event.metadata.siteName}
                                    </span>
                                </div>
                            )}

                            {event.metadata?.meetingLink && (
                                <a
                                    href={event.metadata.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span>Join meeting</span>
                                    <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                </a>
                            )}
                        </div>

                        {/* Quick Actions - Show on hover/touch */}
                        {event.type !== 'free-time' && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                {event.type === 'task' && event.status !== 'done' && (
                                    <button
                                        onClick={handleMarkDone}
                                        className="p-1 sm:p-1.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                                        title="Mark as done"
                                    >
                                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                )}
                                {event.type === 'item' && (
                                    <button
                                        onClick={handleArchive}
                                        className="p-1 sm:p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        title="Archive"
                                    >
                                        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
