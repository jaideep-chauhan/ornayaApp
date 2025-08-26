import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const BAR_HEIGHT = 6;
const PIN_SIZE = 48; // Circle diameter
const DOT_SIZE = 8;

const TaskProgressBar = ({ donePercent = 0 }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const barWidth = screenWidth - 40; // 20px padding on both sides

  const clampedPercent = Math.max(0, Math.min(100, donePercent));

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: clampedPercent,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [clampedPercent]);

  const pinLeft = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, barWidth],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Pin with percent */}
      <Animated.View
        style={[
          styles.pinContainer,
          {
            left: pinLeft,
            transform: [{ translateX: -PIN_SIZE / 2 }],
          },
        ]}
      >
        <View style={styles.pinCircle}>
          <Text style={styles.pinText}>{Math.round(clampedPercent)}</Text>
        </View>
        <View style={styles.pinTail} />
      </Animated.View>

      {/* Dot on the progress line */}
      <Animated.View
        style={[
          styles.dot,
          {
            left: pinLeft,
            transform: [{ translateX: -DOT_SIZE / 2 }],
          },
        ]}
      />

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Labels below */}
      <View style={styles.labels}>
        <Text style={styles.labelLeft}>Task Progress</Text>
        <Text style={styles.labelRight}>Duration: --:--:--</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    marginTop: 24,
    position: 'relative',
  },
  pinContainer: {
    position: 'absolute',
    top: -64,
    alignItems: 'center',
    zIndex: 10,
  },
  pinCircle: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pinText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2563EB',
    marginTop: -1,
  },
  dot: {
    position: 'absolute',
    top: -DOT_SIZE / 2 + BAR_HEIGHT / 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#2563EB',
    zIndex: 5,
  },
  barTrack: {
    width: '100%',
    height: BAR_HEIGHT,
    backgroundColor: '#E5E7EB',
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: BAR_HEIGHT / 2,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  labelLeft: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  labelRight: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default TaskProgressBar;
