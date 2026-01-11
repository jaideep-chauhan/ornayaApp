import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const { width } = Dimensions.get('window');

const PhotoCapture = ({
  photos = [],
  onPhotosChange,
  maxPhotos = 10,
  title = 'Photos',
  showTitle = true,
  photoType = 'step', // 'step', 'wastage', 'final'
  required = false,
  minPhotos = 0,
  allowGallery = true,
  compressQuality = 0.8,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Camera options configuration
  const getCameraOptions = () => ({
    mediaType: 'photo',
    quality: compressQuality,
    maxWidth: 1920,
    maxHeight: 1080,
    includeBase64: false,
    saveToPhotos: false,
  });

  // Handle camera launch
  const handleCameraLaunch = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert(
        'Maximum Photos Reached',
        `You can only add up to ${maxPhotos} photos.`
      );
      return;
    }

    try {
      const result = await launchCamera(getCameraOptions());

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Camera Error', result.errorMessage || 'Failed to open camera');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        handlePhotoSelected(photo);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  // Handle gallery launch
  const handleGalleryLaunch = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert(
        'Maximum Photos Reached',
        `You can only add up to ${maxPhotos} photos.`
      );
      return;
    }

    try {
      const result = await launchImageLibrary({
        ...getCameraOptions(),
        selectionLimit: Math.min(maxPhotos - photos.length, 5),
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Gallery Error', result.errorMessage || 'Failed to open gallery');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        result.assets.forEach((photo) => handlePhotoSelected(photo));
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  // Handle photo selected from camera or gallery
  const handlePhotoSelected = async (photo) => {
    setUploading(true);

    try {
      // In production, upload to Cloudinary here
      // For now, we'll store the local URI
      const newPhoto = {
        id: Date.now().toString(),
        uri: photo.uri,
        fileName: photo.fileName || `photo_${Date.now()}.jpg`,
        fileSize: photo.fileSize,
        width: photo.width,
        height: photo.height,
        type: photoType,
        timestamp: Date.now(),
        uploaded: false, // Will be true after Cloudinary upload
      };

      // TODO: Upload to Cloudinary
      // const cloudinaryUrl = await uploadToCloudinary(photo.uri);
      // newPhoto.cloudinaryUrl = cloudinaryUrl;
      // newPhoto.uploaded = true;

      onPhotosChange([...photos, newPhoto]);
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Show photo selection options
  const showPhotoOptions = () => {
    const options = [
      {
        text: 'Take Photo',
        onPress: handleCameraLaunch,
        icon: 'camera',
      },
    ];

    if (allowGallery) {
      options.push({
        text: 'Choose from Gallery',
        onPress: handleGalleryLaunch,
        icon: 'image',
      });
    }

    options.push({
      text: 'Cancel',
      style: 'cancel',
    });

    Alert.alert(
      'Add Photo',
      'Choose a method to add photo',
      options.map((opt) => ({
        text: opt.text,
        onPress: opt.onPress,
        style: opt.style,
      }))
    );
  };

  // Remove photo
  const removePhoto = (photoId) => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updatedPhotos = photos.filter((p) => p.id !== photoId);
          onPhotosChange(updatedPhotos);
        },
      },
    ]);
  };

  // View photo in full screen
  const viewPhoto = (photo) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  // Get photo type icon
  const getPhotoTypeIcon = () => {
    switch (photoType) {
      case 'wastage':
        return 'alert-triangle';
      case 'final':
        return 'check-circle';
      default:
        return 'camera';
    }
  };

  // Get photo type color
  const getPhotoTypeColor = () => {
    switch (photoType) {
      case 'wastage':
        return '#FF9800';
      case 'final':
        return '#4CAF50';
      default:
        return '#009688';
    }
  };

  // Render photo thumbnail
  const renderPhotoThumbnail = (photo, index) => (
    <TouchableOpacity
      key={photo.id}
      style={styles.photoThumbnail}
      onPress={() => viewPhoto(photo)}
    >
      <Image source={{ uri: photo.uri }} style={styles.thumbnailImage} />

      {/* Photo number badge */}
      <View style={styles.photoBadge}>
        <Text style={styles.photoBadgeText}>{index + 1}</Text>
      </View>

      {/* Upload status */}
      {!photo.uploaded && (
        <View style={styles.uploadingBadge}>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      )}

      {/* Remove button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removePhoto(photo.id)}
      >
        <Icon name="x" size={16} color="#FFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render add photo button
  const renderAddButton = () => {
    if (photos.length >= maxPhotos) return null;

    return (
      <TouchableOpacity
        style={[
          styles.addPhotoButton,
          { borderColor: getPhotoTypeColor() },
        ]}
        onPress={showPhotoOptions}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={getPhotoTypeColor()} />
        ) : (
          <>
            <Icon name="camera" size={32} color={getPhotoTypeColor()} />
            <Text style={[styles.addPhotoText, { color: getPhotoTypeColor() }]}>
              Add Photo
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Render photo viewer modal
  const renderPhotoModal = () => {
    if (!selectedPhoto) return null;

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setModalVisible(false)}
          >
            <Icon name="x" size={30} color="#FFF" />
          </TouchableOpacity>

          <Image
            source={{ uri: selectedPhoto.uri }}
            style={styles.fullPhoto}
            resizeMode="contain"
          />

          <View style={styles.photoInfo}>
            <Text style={styles.photoInfoText}>
              {selectedPhoto.fileName}
            </Text>
            <Text style={styles.photoInfoText}>
              {new Date(selectedPhoto.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon name={getPhotoTypeIcon()} size={20} color={getPhotoTypeColor()} />
            <Text style={styles.title}>{title}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {photos.length}/{maxPhotos}
              </Text>
            </View>
          </View>
          {required && photos.length < minPhotos && (
            <Text style={styles.requiredText}>
              Required: {minPhotos} photo{minPhotos > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {photos.map((photo, index) => renderPhotoThumbnail(photo, index))}
        {renderAddButton()}
      </ScrollView>

      {photos.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="image" size={40} color="#CCC" />
          <Text style={styles.emptyText}>
            {required
              ? `Capture at least ${minPhotos} photo${minPhotos > 1 ? 's' : ''}`
              : 'No photos captured yet'}
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={showPhotoOptions}
          >
            <Text style={styles.emptyButtonText}>Add First Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderPhotoModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  countBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  requiredText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  scrollContent: {
    paddingRight: 16,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
    position: 'relative',
    backgroundColor: '#F0F0F0',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  uploadingBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F44336',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#009688',
    borderRadius: 6,
  },
  emptyButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullPhoto: {
    width: width - 40,
    height: '70%',
  },
  photoInfo: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 8,
  },
  photoInfoText: {
    color: '#FFF',
    fontSize: 13,
    marginBottom: 4,
  },
});

export default PhotoCapture;
