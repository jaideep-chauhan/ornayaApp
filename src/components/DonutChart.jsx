import React from 'react';
import { View, Text } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';

const DonutChart = ({ size = 160, strokeWidth = 16, used = 0, total = 100 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (used / total) * 100;
    const strokeDashoffset = circumference - (circumference * progress) / 100;

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size}>
                <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#E5E5E5"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#FFD233"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="none"
                    />
                </G>
            </Svg>
            <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#555' }}>Total</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{total}g</Text>
            </View>
        </View>
    );
};

export default DonutChart;
