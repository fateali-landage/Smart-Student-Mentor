/**
 * LoadingSkeleton.jsx — SmartMentor Skeleton Loading System
 * ────────────────────────────────────────────────────────────
 * Reusable shimmer skeleton components for all data loading states.
 *
 * Components:
 *  - Skeleton          → bare shimmer block (configure any size)
 *  - SkeletonText      → lines of text
 *  - SkeletonCard      → full card with title + body lines
 *  - SkeletonTable     → table with configurable rows/cols
 *  - SkeletonAvatar    → circular avatar placeholder
 *  - SkeletonStat      → stat card placeholder
 *  - SkeletonList      → list of items with avatar + text
 *  - SkeletonChart     → chart area placeholder
 *
 * Usage:
 *   <SkeletonCard lines={3} />
 *   <Skeleton className="h-8 w-32 rounded-lg" />
 */

import React from 'react';

// ── Base shimmer block ────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return (
    <div
      className={`skeleton-shimmer bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

// ── Text lines ────────────────────────────────────────────────────────────────
export function SkeletonText({ lines = 3, lastLineWidth = '60%' }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 rounded-full"
          style={{ width: i === lines - 1 ? lastLineWidth : '100%' }}
        />
      ))}
    </div>
  );
}

// ── Avatar circle ─────────────────────────────────────────────────────────────
export function SkeletonAvatar({ size = 10 }) {
  return (
    <Skeleton
      className={`rounded-full flex-shrink-0`}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  );
}

// ── Full card ─────────────────────────────────────────────────────────────────
export function SkeletonCard({ lines = 4, showHeader = true }) {
  return (
    <div className="card animate-pulse">
      {showHeader && (
        <div className="mb-5 flex items-center justify-between">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      )}
      <SkeletonText lines={lines} />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function SkeletonStat() {
  return (
    <div className="card animate-pulse flex items-start gap-4">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-24 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-3 w-20 rounded-full" />
      </div>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="card animate-pulse overflow-hidden p-0">
      {/* Header */}
      <div className="flex gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 rounded-full" style={{ flex: i === 0 ? 2 : 1 }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 items-center px-6 py-4 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className="h-4 rounded-full"
              style={{
                flex: colIdx === 0 ? 2 : 1,
                width: `${60 + Math.random() * 30}%`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── List item with avatar ─────────────────────────────────────────────────────
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <SkeletonAvatar size={10} />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3 rounded-full" />
        <Skeleton className="h-3 w-1/2 rounded-full" />
      </div>
      <Skeleton className="h-6 w-14 rounded-full" />
    </div>
  );
}

export function SkeletonList({ items = 5 }) {
  return (
    <div className="card divide-y divide-gray-50 dark:divide-gray-700/50 p-0 px-2">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
}

// ── Chart area ────────────────────────────────────────────────────────────────
export function SkeletonChart({ height = 220 }) {
  return (
    <div className="card animate-pulse">
      <Skeleton className="h-5 w-32 rounded-full mb-6" />
      <div
        className="w-full rounded-xl bg-gray-200 dark:bg-gray-700 skeleton-shimmer"
        style={{ height }}
      />
      <div className="flex justify-around mt-4">
        {['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].map((m) => (
          <Skeleton key={m} className="h-3 w-7 rounded-full" />
        ))}
      </div>
    </div>
  );
}

// ── Dashboard grid (4 stats + chart + list) ───────────────────────────────────
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
      {/* Chart + list row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonChart height={260} />
        </div>
        <SkeletonList items={6} />
      </div>
    </div>
  );
}

// Default export for simple use
export default Skeleton;
