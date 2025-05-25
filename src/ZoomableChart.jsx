import React, { useRef } from 'react';
import { useGesture } from '@use-gesture/react';
import { useSpring, animated, to } from '@react-spring/web';
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function ZoomableChart({ data, lines }) {
  const chartRef = useRef();

  const minScale = 1;
  const maxScale = 4;
  const baseWidth = 800;

  // width — для расчетов ограничений pan, не передаётся в style напрямую!
  const [{ scale, x }, api] = useSpring(() => ({
    scale: 1,
    x: 0,
    config: { tension: 300, friction: 30 },
  }));

  // clamp для pan, чтобы график не уехал слишком далеко
  const clampX = (xValue, scaleValue) => {
    const scaledWidth = baseWidth * scaleValue;
    const minX = Math.min(0, baseWidth - scaledWidth);
    return Math.max(Math.min(xValue, 0), minX);
  };

  useGesture(
    {
      onWheel: ({ delta: [, dy] }) => {
        api.start((current) => {
          let newScale = Math.min(Math.max(current.scale.get() - dy * 0.05, minScale), maxScale);
          // Корректируем x при зуме, чтобы центр оставался на месте (можно усложнить, если надо)
          let prevScaledWidth = baseWidth * current.scale.get();
          let newScaledWidth = baseWidth * newScale;
          let percent = current.x.get() / prevScaledWidth;
          let newX = percent * newScaledWidth;
          return { scale: newScale, x: clampX(newX, newScale) };
        });
      },
      onDrag: ({ delta: [dx] }) => {
        api.start((current) => {
          let nextX = current.x.get() + dx;
          return { x: clampX(nextX, current.scale.get()) };
        });
      },
      onPinch: ({ offset: [d] }) => {
        let newScale = Math.min(Math.max(d / 100, minScale), maxScale);
        api.start((current) => ({
          scale: newScale,
          x: clampX(current.x.get(), newScale),
        }));
      },
    },
    {
      target: chartRef,
      eventOptions: { passive: false },
    }
  );

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: 500,
        overflow: 'hidden',
        touchAction: 'none',
        background: '#fff',
        position: 'relative'
      }}
    >
      <animated.div
        style={{
          width: baseWidth,
          height: 500,
          willChange: 'transform',
          display: 'inline-block',
          transform: to([x, scale], (x, scale) => `translateX(${x}px) scale(${scale},1)`)
        }}
      >
        <AreaChart width={baseWidth} height={500} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          {lines.map((line, idx) => (
            <Area
              key={idx}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              fill={line.color}
              name={line.label}
            />
          ))}
        </AreaChart>
      </animated.div>
    </div>
  );
}
