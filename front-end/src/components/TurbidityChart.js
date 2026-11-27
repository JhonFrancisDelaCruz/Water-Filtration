import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { getColors, useTheme } from '../constants/theme';

const HEIGHT = 190;
const PAD = { left: 40, right: 16, top: 12, bottom: 22 };

// data: [{ label: '8 AM', value: 5.1 }, ...]
export default function TurbidityChart({ data }) {
  const { dark } = useTheme();
  const colors = getColors(dark);
  const [width, setWidth] = useState(0);

  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const values = data.map((d) => Number(d.value)).filter(Number.isFinite);
  const low = values.length ? Math.min(...values) : 0;
  const high = values.length ? Math.max(...values) : 1;
  const padValue = Math.max((high - low) * 0.12, 1);
  const yMin = low - padValue;
  const yMax = high + padValue;

  const x = (i) => PAD.left + (plotW * i) / Math.max(data.length - 1, 1);
  const y = (v) => PAD.top + ((yMax - v) / (yMax - yMin)) * plotH;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {[0, 1, 2, 3, 4].map((i) => {
            const t = yMax - ((yMax - yMin) * i) / 4;
            return (
            <React.Fragment key={t}>
              <Line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={colors.grid} strokeWidth={0.8} />
              <SvgText x={PAD.left - 6} y={y(t) + 3} fontSize={8} fill={colors.text} textAnchor="end">
                {Math.round(t)} ADC
              </SvgText>
            </React.Fragment>
          ); })}
          <Polyline
            points={data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ')}
            fill="none"
            stroke={colors.accent}
            strokeWidth={1.2}
          />
          {data.map((d, i) => (
            <React.Fragment key={d.label}>
              <Circle cx={x(i)} cy={y(d.value)} r={2.5} fill={colors.accent} />
              <SvgText x={x(i)} y={HEIGHT - 6} fontSize={8} fill={colors.text} textAnchor="middle">
                {d.label}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      )}
    </View>
  );
}
