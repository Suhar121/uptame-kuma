import React from 'react';

export default function HeartbeatStrip({ heartbeats = [], size = 'large' }) {
  // Ensure we have a consistent number of bars (e.g. 36 ticks)
  const totalSlots = size === 'large' ? 36 : 24;
  const ticks = [...heartbeats].slice(-totalSlots);

  // Pad left if fewer than totalSlots
  while (ticks.length < totalSlots) {
    ticks.unshift({ status: 'empty' });
  }

  const barHeight = size === 'large' ? 'h-7' : 'h-3.5';
  const barWidth = size === 'large' ? 'w-[7px]' : 'w-[3px]';
  const barGap = size === 'large' ? 'gap-[3px]' : 'gap-[1.5px]';

  return (
    <div className={`flex items-center ${barGap}`}>
      {ticks.map((tick, idx) => {
        let bg = 'bg-[#1e293b]';
        if (tick.status === 'up') bg = 'bg-[#22c55e]';
        if (tick.status === 'down') bg = 'bg-[#ef4444]';
        if (tick.status === 'paused') bg = 'bg-[#eab308]';

        return (
          <div
            key={idx}
            title={tick.time ? `${new Date(tick.time).toLocaleTimeString()} - ${tick.msg || tick.status}` : 'No data'}
            className={`${barWidth} ${barHeight} ${bg} rounded-sm transition-all hover:opacity-80`}
          />
        );
      })}
    </div>
  );
}
