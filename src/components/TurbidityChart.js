import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '../constants/theme';

const Y_TICKS = [5.1, 4.25, 3.4, 2.55, 1.7];
const HEIGHT = 190;
const PAD = { left: 40, right: 16, top: 12, bottom: 22 };

// data: [{ label: '8 AM', value: 5.1 }, ...]
export default function TurbidityChart({ data }) {
  const [width, setWidth] = useState(0);

  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const yMax = Y_TICKS[0];
  const yMin = Y_TICKS[Y_TICKS.length - 1];

  const x = (i) => PAD.left + (plotW * i) / (data.length - 1) ;
  const y = (v) => PAD.top + ((yMax - v) / (yMax - yMin)) * plotH;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {Y_TICKS.map((t) => (
            <React.Fragment key={t}>
              <Line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={colors.grid} strokeWidth={0.8} />
              <SvgText x={PAD.left - 6} y={y(t) + 3} fontSize={8} fill={colors.text} textAnchor="end">
                {`${t} NTU`}
              </SvgText>
            </React.Fragment>
          ))}
          <Polyline
            points={data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ')}
            fill="none"
            stroke="#000"
            strokeWidth={1.2}
          />
          {data.map((d, i) => (
            <React.Fragment key={d.label}>
              <Circle cx={x(i)} cy={y(d.value)} r={2.5} fill="#000" />
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
