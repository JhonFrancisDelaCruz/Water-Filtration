import React from 'react';
import Svg, { Rect } from 'react-native-svg';
import { colors } from '../constants/theme';

const HEIGHTS = [6, 10, 14, 18];

// level: 0-4 filled bars
export default function SignalBars({ level = 4, size = 22 }) {
  return (
    <Svg width={size + 2} height={size} viewBox="0 0 24 22">
      {HEIGHTS.map((h, i) => (
        <Rect
          key={i}
          x={2 + i * 6}
          y={20 - h}
          width={3.5}
          height={h}
          rx={1}
          fill={i < level ? colors.accent : '#CBD5E1'}
        />
      ))}
    </Svg>
  );
}
