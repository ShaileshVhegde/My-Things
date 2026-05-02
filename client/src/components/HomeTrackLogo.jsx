/**
 * HomeTrackLogo — Animated SVG React component
 *
 * Animation sequence (Framer Motion):
 *  1. Container fades + scales in (0 → 1)
 *  2. House outline draws on via stroke-dashoffset (pathLength 0 → 1)
 *  3. Circuit traces draw in sequentially
 *  4. Inner device icons fade in
 *
 * Props:
 *  size     – pixel width/height (default 48)
 *  animated – enable entrance animation (default true)
 *  className– additional Tailwind / CSS classes
 */

import React from 'react';
import { motion } from 'framer-motion';

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0, scale: 0.75 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
  },
};

const drawVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delay = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { delay, duration: 0.9, ease: 'easeInOut' }, opacity: { delay, duration: 0.1 } },
  }),
};

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { delay, duration: 0.4 },
  }),
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeTrackLogo({ size = 48, animated = true, className = '' }) {
  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      variants={containerVariants}
      initial={animated ? 'hidden' : false}
      animate={animated ? 'visible' : false}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        {/* ── Gradient defs ── */}
        <defs>
          <linearGradient id="houseGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="60%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="circuitGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.7" />
          </linearGradient>
          <radialGradient id="bgFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Background fill ── */}
        <circle cx="50" cy="55" r="38" fill="url(#bgFill)" />

        {/* ── House outline (draw-on animation) ── */}
        <motion.path
          d="M50 15 L18 40 L26 40 L26 78 Q26 82 30 82 L70 82 Q74 82 74 78 L74 40 L82 40 Z"
          stroke="url(#houseGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={drawVariants}
          initial={animated ? 'hidden' : false}
          animate={animated ? 'visible' : false}
          custom={0.1}
        />

        {/* ── Rounded bottom trim ── */}
        <motion.path
          d="M30 82 Q26 82 24 86 Q22 90 26 92 L74 92 Q78 92 76 88 Q74 82 70 82"
          stroke="url(#houseGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={drawVariants}
          initial={animated ? 'hidden' : false}
          animate={animated ? 'visible' : false}
          custom={0.6}
        />

        {/* ── Left circuit trace ── */}
        <motion.path
          d="M26 55 L20 55 L20 68 L24 68"
          stroke="url(#circuitGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          variants={drawVariants}
          initial={animated ? 'hidden' : false}
          animate={animated ? 'visible' : false}
          custom={0.7}
        />

        {/* ── Right circuit trace ── */}
        <motion.path
          d="M74 55 L80 55 L80 68 L76 68"
          stroke="url(#circuitGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          variants={drawVariants}
          initial={animated ? 'hidden' : false}
          animate={animated ? 'visible' : false}
          custom={0.8}
        />

        {/* ── Interior circuit horizontal line ── */}
        <motion.path
          d="M33 60 L67 60"
          stroke="url(#circuitGrad)"
          strokeWidth="1.2"
          strokeDasharray="3 2"
          strokeLinecap="round"
          fill="none"
          variants={drawVariants}
          initial={animated ? 'hidden' : false}
          animate={animated ? 'visible' : false}
          custom={0.9}
        />

        {/* ── Circuit nodes ── */}
        {[
          { cx: 33, cy: 60 },
          { cx: 50, cy: 60 },
          { cx: 67, cy: 60 },
          { cx: 24, cy: 68 },
          { cx: 76, cy: 68 },
        ].map(({ cx, cy }, i) => (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r="2"
            fill="#22d3ee"
            variants={fadeVariants}
            initial={animated ? 'hidden' : false}
            animate={animated ? 'visible' : false}
            custom={0.95 + i * 0.05}
          />
        ))}

        {/* ── Smart screen / panel ── */}
        <motion.rect
          x="36" y="66" width="28" height="18" rx="2.5"
          stroke="#22d3ee"
          strokeWidth="1.8"
          fill="#06b6d420"
          variants={fadeVariants}
          initial={animated ? 'hidden' : false}
          animate={animated ? 'visible' : false}
          custom={1.0}
        />

        {/* Screen icon dots */}
        {[
          { cx: 43, cy: 72 },
          { cx: 50, cy: 72 },
          { cx: 57, cy: 72 },
          { cx: 43, cy: 78 },
          { cx: 50, cy: 78 },
          { cx: 57, cy: 78 },
        ].map(({ cx, cy }, i) => (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r="1.5"
            fill="#4ade80"
            variants={fadeVariants}
            initial={animated ? 'hidden' : false}
            animate={animated ? 'visible' : false}
            custom={1.05 + i * 0.04}
          />
        ))}

        {/* ── WiFi / signal arcs ── */}
        <motion.path
          d="M44 35 Q50 30 56 35"
          stroke="#22d3ee"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          variants={drawVariants}
          initial={animated ? 'hidden' : false}
          animate={animated ? 'visible' : false}
          custom={1.1}
        />
        <motion.path
          d="M47 40 Q50 37 53 40"
          stroke="#06b6d4"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          variants={drawVariants}
          initial={animated ? 'hidden' : false}
          animate={animated ? 'visible' : false}
          custom={1.2}
        />
        <motion.circle
          cx="50"
          cy="44"
          r="1.5"
          fill="#22d3ee"
          variants={fadeVariants}
          initial={animated ? 'hidden' : false}
          animate={animated ? 'visible' : false}
          custom={1.3}
        />

        {/* ── Location pin badge ── */}
        <motion.circle
          cx="78" cy="22" r="8"
          stroke="url(#houseGrad)"
          strokeWidth="2"
          fill="#06b6d415"
          variants={fadeVariants}
          initial={animated ? 'hidden' : false}
          animate={animated ? 'visible' : false}
          custom={1.35}
        />
        <motion.path
          d="M78 18 C75.5 18 73.5 20 73.5 22.5 C73.5 25.8 78 30 78 30 C78 30 82.5 25.8 82.5 22.5 C82.5 20 80.5 18 78 18 Z"
          stroke="#22d3ee"
          strokeWidth="1.2"
          fill="#22d3ee30"
          variants={fadeVariants}
          initial={animated ? 'hidden' : false}
          animate={animated ? 'visible' : false}
          custom={1.4}
        />
        <motion.circle
          cx="78" cy="22.5" r="1.8"
          fill="#22d3ee"
          variants={fadeVariants}
          initial={animated ? 'hidden' : false}
          animate={animated ? 'visible' : false}
          custom={1.45}
        />
      </svg>
    </motion.div>
  );
}
