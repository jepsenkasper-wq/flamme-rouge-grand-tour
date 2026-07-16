import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { Colors } from '@/constants/colors';
import type {
  ProgressionPoint,
  RiderProgression,
} from '@/lib/classifications';
import Svg, { Line } from 'react-native-svg';

type Props = {
  progression: RiderProgression[];
  valueType?: 'points' | 'time';
  invertYAxis?: boolean;
  xAxisPosition?: 'top' | 'bottom';
};



const CHART_HEIGHT = 260;
const STAGE_WIDTH = 54;
const POINT_SIZE = 10;
const VERTICAL_PADDING = 20;
const Y_AXIS_WIDTH = 24;
const RIGHT_AXIS_WIDTH = 24;

function getPlayerColor(colorName: string): string {
  switch (colorName) {
    case 'Blue':
      return '#2f5fb3';
    case 'White':
      return '#ffffff';
    case 'Green':
      return '#2f8a3e';
    case 'Red':
      return '#b7372f';
    case 'Black':
      return '#222222';
    case 'Pink':
      return '#d97aa7';
    default:
      return Colors.border;
  }
}

function formatChartTime(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);

  if (totalMinutes >= 60) {
    const hours = Math.round(totalMinutes / 60);
    return `${hours} h`;
  }

  return `${totalMinutes} min`;
}

function formatDetailedChartTime(totalSeconds: number): string {
  const roundedSeconds = Math.max(
    0,
    Math.round(totalSeconds)
  );

  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor(
    (roundedSeconds % 3600) / 60
  );
  const seconds = roundedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function ProgressionChartPrototype({
  progression,
  valueType = 'points',
  invertYAxis = false,
  xAxisPosition = 'bottom',
}: Props) {
    const [selectedSeriesKey, setSelectedSeriesKey] =
  useState<string | null>(null);

  const selectedSeriesIndex = progression.findIndex(
  (series) => getSeriesKey(series) === selectedSeriesKey
);

const selectedSeries =
  selectedSeriesIndex >= 0
    ? progression[selectedSeriesIndex]
    : null;

    function selectPreviousSeries() {
  if (progression.length === 0) return;

  const previousIndex =
    selectedSeriesIndex <= 0
      ? progression.length - 1
      : selectedSeriesIndex - 1;

  setSelectedSeriesKey(
    getSeriesKey(progression[previousIndex])
  );
}

function selectNextSeries() {
  if (progression.length === 0) return;

  const nextIndex =
    selectedSeriesIndex < 0 ||
    selectedSeriesIndex === progression.length - 1
      ? 0
      : selectedSeriesIndex + 1;

  setSelectedSeriesKey(
    getSeriesKey(progression[nextIndex])
  );
}
  
    const allPoints = progression.flatMap((series) => series.values);

  if (allPoints.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          No progression data available.
        </Text>
      </View>
    );
  }

function getSeriesKey(series: RiderProgression): string {
  return `${series.playerIndex}-${series.riderType ?? 'team'}`;
}

function getPointPosition(point: ProgressionPoint): number {
  return point.sequenceNumber ?? point.stageNumber;
}  

const pointPositions = allPoints.map(getPointPosition);

const values = allPoints.map(
  (point) => point.value
);

const firstPosition = Math.min(...pointPositions);
const lastPosition = Math.max(...pointPositions);

const stageCount =
  lastPosition - firstPosition + 1;

const axisPoints = Array.from(
  new Map(
    allPoints.map((point) => [
      getPointPosition(point),
      point,
    ])
  ).values()
).sort(
  (a, b) =>
    getPointPosition(a) - getPointPosition(b)
);

  const minimumValue = Math.min(0, ...values);
  const maximumValue = Math.max(...values);


  const GRID_LINE_COUNT = 5;

const gridValues = Array.from(
  { length: GRID_LINE_COUNT + 1 },
  (_, index) =>
    minimumValue +
    ((maximumValue - minimumValue) / GRID_LINE_COUNT) * index
);

  const valueRange = Math.max(maximumValue - minimumValue, 1);



const chartWidth = Math.max(
  stageCount * STAGE_WIDTH +
    Y_AXIS_WIDTH +
    RIGHT_AXIS_WIDTH,
  300
);

  const OVERLAP_OFFSET = 4;

  function getSeriesOffset(
  playerIndex: number,
  riderType: 'sprinteur' | 'rouleur'
): number {
  const riderOffset = riderType === 'sprinteur' ? -1 : 1;
  const playerOffset = playerIndex % 2 === 0 ? -1 : 1;

  return riderOffset * OVERLAP_OFFSET + playerOffset;
}


function getX(point: ProgressionPoint): number {
  const position = getPointPosition(point);

  return (
    Y_AXIS_WIDTH +
    (position - firstPosition) * STAGE_WIDTH +
    STAGE_WIDTH / 3
  );
}

function getY(value: number): number {
  const topPadding =
  xAxisPosition === 'top'
    ? VERTICAL_PADDING + 24
    : VERTICAL_PADDING;

const bottomPadding = VERTICAL_PADDING;

const availableHeight =
  CHART_HEIGHT - topPadding - bottomPadding;

  const normalizedValue =
    (value - minimumValue) / valueRange;

  if (invertYAxis) {
    return (
  topPadding +
  normalizedValue * availableHeight
);
  }

  return (
    CHART_HEIGHT -
    VERTICAL_PADDING -
    normalizedValue * availableHeight
  );
}

  function formatValue(value: number): string {
  return valueType === 'time'
    ? formatChartTime(value)
    : `${Math.round(value)}`;
}

return (
  <View style={styles.wrapper}>
    <View style={styles.seriesSelector}>
  <Pressable
    style={styles.seriesSelectorButton}
    onPress={selectPreviousSeries}>
    <Text style={styles.seriesSelectorButtonText}>‹</Text>
  </Pressable>

  <Pressable
  style={[
    styles.selectedSeriesBox,
    selectedSeries && styles.selectedSeriesBoxActive,
  ]}
  onPress={() => setSelectedSeriesKey(null)}>
  <Text style={styles.selectedSeriesText}>
    {selectedSeries
      ? `${selectedSeries.playerName}${
          selectedSeries.riderType
            ? ` - ${
                selectedSeries.riderType === 'sprinteur'
                  ? 'Sprinteur'
                  : 'Rouleur'
              }`
            : ''
        }`
      : 'Select rider'}
  </Text>

  {selectedSeries && (
    <Text style={styles.clearSelectionText}>
      Tap to show all
    </Text>
  )}
</Pressable>

  <Pressable
    style={styles.seriesSelectorButton}
    onPress={selectNextSeries}>
    <Text style={styles.seriesSelectorButtonText}>›</Text>
  </Pressable>
</View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      contentContainerStyle={styles.scrollContent}>
      <View style={[styles.chart, { width: chartWidth }]}>
        {gridValues.map((value) => (
          <View
            key={`grid-${value}`}
            style={[
              styles.gridLine,
              {
                top: getY(value),
              },
            ]}
          />
        ))}

        <Svg
          width={chartWidth}
          height={CHART_HEIGHT}
          style={StyleSheet.absoluteFill}>
          {progression.flatMap((series) =>
            series.values.slice(0, -1).map((point, index) => {
              const nextPoint = series.values[index + 1];
              const seriesKey = getSeriesKey(series);
const isSelected = selectedSeriesKey === seriesKey;
const isDimmed =
  selectedSeriesKey !== null && !isSelected;

            const offset = series.riderType
  ? getSeriesOffset(
      series.playerIndex,
      series.riderType
    )
  : 0;
              return (
                <Line
  key={`line-${series.playerIndex}-${series.riderType}-${getPointPosition(point)}`}
  x1={getX(point)}
  y1={getY(point.value) + offset}
  x2={getX(nextPoint)}
  y2={getY(nextPoint.value) + offset}
  stroke={getPlayerColor(series.playerColor)}
  strokeWidth={isSelected ? 4 : 2}
opacity={isDimmed ? 0.18 : 1}
  strokeDasharray={
    series.riderType === 'rouleur'
      ? '6 4'
      : undefined
  }
/>
              );
            })
          )}
        </Svg>

        {gridValues.map((value) => (
          <Text
            key={`grid-label-${value}`}
            style={[
              styles.gridLabel,
              {
                top: getY(value) - 8,
              },
            ]}>
            {formatValue(value)}
          </Text>
        ))}

        {gridValues.map((value) => (
          <Text
            key={`grid-label-right-${value}`}
            style={[
              styles.gridLabelRight,
              {
                top: getY(value) - 8,
              },
            ]}>
            {formatValue(value)}
          </Text>
        ))}

        {progression.flatMap((series) =>
          series.values.map((point) => (
            <Pressable
  key={`${getSeriesKey(series)}-${getPointPosition(point)}`}
  onPress={() => {
    const seriesKey = getSeriesKey(series);

    setSelectedSeriesKey((currentKey) =>
      currentKey === seriesKey ? null : seriesKey
    );
  }}
  style={[
    styles.point,
    {
      left:
        getX(point) -
        POINT_SIZE / 2,
      top:
        getY(point.value) -
        POINT_SIZE / 2 +
        (
          series.riderType
            ? getSeriesOffset(
                series.playerIndex,
                series.riderType
              )
            : 0
        ),
      backgroundColor: getPlayerColor(
        series.playerColor
      ),
      opacity:
        selectedSeriesKey !== null &&
        selectedSeriesKey !== getSeriesKey(series)
          ? 0.18
          : 1,
      transform:
        selectedSeriesKey === getSeriesKey(series)
          ? [{ scale: 1.5 }]
          : [{ scale: 1 }],
    },
    series.riderType === 'rouleur' &&
      styles.rouleurPoint,
  ]}
/>
          ))
        )}
{progression.flatMap((series) => {
  if (selectedSeriesKey !== getSeriesKey(series)) {
    return [];
  }

  return series.values.map((point) => (
    <Text
      key={`label-${getSeriesKey(series)}-${getPointPosition(point)}`}
      style={[
        styles.pointValue,
        {
          left: getX(point) - 20,
          width: 40,
          top:
            getY(point.value) -
            24 +
            (
              series.riderType
                ? getSeriesOffset(
                    series.playerIndex,
                    series.riderType
                  )
                : 0
            ),
        },
      ]}>
      {valueType === 'time'
  ? formatDetailedChartTime(point.value)
  : Math.round(point.value)}
    </Text>
  ));
})}

    

        {axisPoints.map((point) => (
  <Text
    key={`stage-label-${getPointPosition(point)}`}
   style={[
  styles.stageLabel,
  {
    left:
      getX(point) -
      STAGE_WIDTH / 2,
    width: STAGE_WIDTH,
    top:
      xAxisPosition === 'top'
        ? 4
        : CHART_HEIGHT + 8,
  },
]}>
    {point.label ?? `S${point.stageNumber}`}
  </Text>
))}
      </View>
    </ScrollView>
  </View>
);
    
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },

  scrollContent: {
    paddingHorizontal: 8,
  },

  chart: {
    height: CHART_HEIGHT + 34,
    position: 'relative',
  },

  point: {
    position: 'absolute',
    width: POINT_SIZE,
    height: POINT_SIZE,
    borderRadius: POINT_SIZE / 2,
  },

  rouleurPoint: {
    borderWidth: 2,
    borderColor: Colors.card,
  },

stageLabel: {
  position: 'absolute',
  textAlign: 'center',
  fontSize: 12,
  fontWeight: '700',
  color: Colors.brown,
},

  emptyCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
  },

  emptyText: {
    color: Colors.brown,
    textAlign: 'center',
  },

 gridLine: {
  position: 'absolute',
  left: Y_AXIS_WIDTH,
  right: RIGHT_AXIS_WIDTH,
  height: 1,
  backgroundColor: Colors.border,
  opacity: 0.45,
},
gridLabel: {
  position: 'absolute',
  left: 1,
  width: 20,
  fontSize: 11,
  fontWeight: '700',
  color: Colors.brown,
  opacity: 0.7,
  textAlign: 'right',
},
gridLabelRight: {
  position: 'absolute',
  right: 1,
  width: 20,
  fontSize: 11,
  fontWeight: '700',
  color: Colors.brown,
  opacity: 0.7,
  textAlign: 'left',
},

seriesSelector: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  paddingHorizontal: 8,
  paddingTop: 8,
  marginBottom: 8,
},

seriesSelectorButton: {
  width: 40,
  height: 38,
  borderRadius: 12,
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  alignItems: 'center',
  justifyContent: 'center',
},

seriesSelectorButtonText: {
  fontSize: 24,
  fontWeight: '900',
  color: Colors.brown,
  lineHeight: 26,
},

selectedSeriesBox: {
  flex: 1,
  minHeight: 38,
  borderRadius: 12,
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 10,
},

selectedSeriesText: {
  fontSize: 13,
  fontWeight: '800',
  color: Colors.brown,
  textAlign: 'center',
},
selectedSeriesBoxActive: {
  borderColor: Colors.red,
  borderWidth: 2,
},

clearSelectionText: {
  marginTop: 2,
  fontSize: 10,
  fontWeight: '700',
  color: Colors.red,
},

pointValue: {
  position: 'absolute',
  fontSize: 10,
  fontWeight: '700',
  color: Colors.brown,
  textAlign: 'center',
},
  
});