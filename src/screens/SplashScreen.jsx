import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SplashScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.logoText}>Ornaya</Text>
            <Text style={styles.tagline}>Crafted for Jewellery Manufacturers</Text>
            <Text style={styles.subTagline}>Manage. Manufacture. Excel.</Text>
        </View>
    );
};

export default SplashScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1B1B1B', 
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        width: screenWidth,
        height: screenHeight,
    },
    logoText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFD700', 
        fontFamily: 'serif',
        marginBottom: 20,
    },
    tagline: {
        fontSize: 20,
        color: '#F5F5DC', 
        textAlign: 'center',
        marginBottom: 10,
    },
    subTagline: {
        fontSize: 16,
        color: '#DDDDDD',
        textAlign: 'center',
    },
});
