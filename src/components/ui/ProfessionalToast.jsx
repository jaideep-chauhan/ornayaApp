import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width: screenWidth } = Dimensions.get('window');

const ProfessionalToast = ({ visible, message, type = 'success', onClose }) => {
    const opacity = new Animated.Value(visible ? 1 : 0);

    React.useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(3000),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                if (onClose) onClose();
            });
        }
    }, [visible]);

    if (!visible) return null;

    const getToastConfig = () => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: '#10B981',
                    iconName: 'check-circle',
                    iconColor: '#ffffff',
                };
            case 'error':
                return {
                    backgroundColor: '#EF4444',
                    iconName: 'x-circle',
                    iconColor: '#ffffff',
                };
            case 'warning':
                return {
                    backgroundColor: '#F59E0B',
                    iconName: 'alert-triangle',
                    iconColor: '#ffffff',
                };
            default:
                return {
                    backgroundColor: '#3B82F6',
                    iconName: 'info',
                    iconColor: '#ffffff',
                };
        }
    };

    const config = getToastConfig();

    return (
        <Animated.View style={[styles.container, { opacity, backgroundColor: config.backgroundColor }]}>
            <View style={styles.content}>
                <Icon name={config.iconName} size={24} color={config.iconColor} />
                <Text style={styles.message}>{message}</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    message: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginLeft: 12,
        flex: 1,
    },
});

export default ProfessionalToast;
