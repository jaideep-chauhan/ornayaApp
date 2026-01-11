import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Icon from 'react-native-vector-icons/Feather';
import { RNCamera } from 'react-native-camera';

const QRScanner = ({ navigation }) => {
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState(RNCamera.Constants.FlashMode.off);
  const [cameraPermission, setCameraPermission] = useState(null);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  // Check camera permission
  const checkCameraPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const { PermissionsAndroid } = require('react-native');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        setCameraPermission(
          granted === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // iOS handles permissions automatically
        setCameraPermission(true);
      }
    } catch (error) {
      console.error('Permission error:', error);
      setCameraPermission(false);
    }
  };

  // Handle QR code scan
  const onSuccess = (e) => {
    if (scanned) return;

    setScanned(true);

    try {
      // Parse QR code data
      const data = e.data;

      // Expected format: ORDER:123 or REPAIR:456
      const [type, id] = data.split(':');

      if (!type || !id) {
        Alert.alert(
          'Invalid QR Code',
          'This QR code is not recognized. Please scan a valid order or repair QR code.',
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
        return;
      }

      const typeUpper = type.toUpperCase();

      if (typeUpper === 'ORDER') {
        // Navigate to order details
        navigation.replace('TaskDetail', {
          orderId: parseInt(id),
          isRepair: false,
        });
      } else if (typeUpper === 'REPAIR') {
        // Navigate to repair details
        navigation.replace('TaskDetail', {
          orderId: parseInt(id),
          isRepair: true,
        });
      } else {
        Alert.alert(
          'Unsupported Type',
          `QR code type "${type}" is not supported.`,
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('QR scan error:', error);
      Alert.alert(
        'Scan Error',
        'Failed to process QR code. Please try again.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlashMode((prev) =>
      prev === RNCamera.Constants.FlashMode.off
        ? RNCamera.Constants.FlashMode.torch
        : RNCamera.Constants.FlashMode.off
    );
  };

  // Handle permission denied
  const handlePermissionDenied = () => {
    Alert.alert(
      'Camera Permission Required',
      'Please grant camera permission in Settings to scan QR codes.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() },
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings();
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (cameraPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="camera" size={48} color="#009688" />
          <Text style={styles.loadingText}>Checking camera permission...</Text>
        </View>
      </View>
    );
  }

  if (cameraPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Scanner</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.permissionContainer}>
          <Icon name="camera-off" size={64} color="#999" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please grant camera permission to scan QR codes for orders and
            repairs.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => {
              Linking.openSettings();
              navigation.goBack();
            }}
          >
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitleLight}>Scan QR Code</Text>
        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          <Icon
            name={flashMode === RNCamera.Constants.FlashMode.torch ? 'zap' : 'zap-off'}
            size={24}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      {/* QR Scanner */}
      <QRCodeScanner
        onRead={onSuccess}
        flashMode={flashMode}
        reactivate={false}
        reactivateTimeout={500}
        showMarker
        customMarker={
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTop}>
              <Text style={styles.instructionText}>
                Position the QR code within the frame
              </Text>
            </View>

            <View style={styles.scannerMiddle}>
              <View style={styles.scannerSide} />
              <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <View style={styles.scannerSide} />
            </View>

            <View style={styles.scannerBottom}>
              <View style={styles.infoCard}>
                <Icon name="info" size={20} color="#009688" />
                <Text style={styles.infoText}>
                  Scan order or repair QR codes to view details instantly
                </Text>
              </View>
            </View>
          </View>
        }
        cameraStyle={styles.camera}
        containerStyle={styles.scannerContainer}
      />

      {/* Manual Input Option */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Icon name="edit" size={20} color="#009688" />
          <Text style={styles.manualButtonText}>Enter ID Manually</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerTitleLight: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  flashButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#009688',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    height: '100%',
  },
  scannerOverlay: {
    flex: 1,
  },
  scannerTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  instructionText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  scannerMiddle: {
    flexDirection: 'row',
    height: 300,
  },
  scannerSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  scannerFrame: {
    width: 300,
    height: 300,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#009688',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannerBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 40,
  },
  infoText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 8,
  },
  manualButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#009688',
    marginLeft: 8,
  },
});

export default QRScanner;
