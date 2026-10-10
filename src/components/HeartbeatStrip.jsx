import React from 'react';

export default function HeartbeatStrip({ heartbeats = [], size = 'large' }) {
  const totalSlots = size === 'large' ? 36 : 24;
  const ticks = [...heartbeats].slice(-totalSlots);

  while (ticks.length < totalSlots) {
    ticks.unshift({ status: 'empty' });
  }

  const barHeight = size === 'large' ? 'h-7' : 'h-3.5';
  const barWidth = size === 'large' ? 'w-[7px]' : 'w-[3px]';
  const barGap = size === 'large' ? 'gap-[3px]' : 'gap-[1.5px]';

  return (
    <div className={`flex items-center ${barGap}`}>
      {ticks.map((tick, idx) => {
        let bg = 'bg-muted/40';
        if (tick.status === 'up') bg = 'bg-emerald-500 shadow-2xs shadow-emerald-500/20';
        if (tick.status === 'down') bg = 'bg-red-500 shadow-2xs shadow-red-500/30';
        if (tick.status === 'paused') bg = 'bg-amber-500/80';

        return (
          <div
            key={idx}
            title={tick.time ? `${new Date(tick.time).toLocaleTimeString()} - ${tick.msg || tick.status}` : 'No data'}
            className={`${barWidth} ${barHeight} ${bg} rounded-xs transition-all hover:scale-110 hover:opacity-100`}
          />
        );
      })}
    </div>
  );
}
