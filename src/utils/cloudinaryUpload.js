/**
 * Cloudinary Upload Utility
 * Handles photo uploads to Cloudinary service
 */

// TODO: Replace these with your actual Cloudinary credentials
const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME';
const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET';
const CLOUDINARY_API_KEY = 'YOUR_API_KEY';

/**
 * Upload image to Cloudinary
 * @param {string} imageUri - Local file URI
 * @param {Object} options - Upload options
 * @returns {Promise<string>} - Cloudinary URL
 */
export const uploadToCloudinary = async (imageUri, options = {}) => {
  try {
    if (!imageUri) {
      throw new Error('Image URI is required');
    }

    const {
      folder = 'ornaaya',
      resourceType = 'image',
      tags = [],
      context = {},
    } = options;

    // Create form data
    const formData = new FormData();

    // Add file
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `photo_${Date.now()}.jpg`,
    });

    // Add upload preset (required for unsigned uploads)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    // Add optional parameters
    if (folder) {
      formData.append('folder', folder);
    }

    if (tags.length > 0) {
      formData.append('tags', tags.join(','));
    }

    if (Object.keys(context).length > 0) {
      formData.append('context', JSON.stringify(context));
    }

    // Cloudinary upload URL
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    // Upload to Cloudinary
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (response.ok && data.secure_url) {
      console.log('Image uploaded to Cloudinary:', data.secure_url);
      return data.secure_url;
    } else {
      console.error('Cloudinary upload failed:', data);
      throw new Error(data.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<string>} imageUris - Array of local file URIs
 * @param {Object} options - Upload options
 * @returns {Promise<Array<string>>} - Array of Cloudinary URLs
 */
export const uploadMultipleToCloudinary = async (imageUris, options = {}) => {
  try {
    const uploadPromises = imageUris.map((uri) =>
      uploadToCloudinary(uri, options)
    );

    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Upload image with progress tracking
 * @param {string} imageUri - Local file URI
 * @param {Function} onProgress - Progress callback
 * @param {Object} options - Upload options
 * @returns {Promise<string>} - Cloudinary URL
 */
export const uploadWithProgress = async (imageUri, onProgress, options = {}) => {
  try {
    // Note: XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          if (onProgress) {
            onProgress(progress);
          }
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      if (options.folder) {
        formData.append('folder', options.folder);
      }

      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading with progress:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    // Note: Deletion requires authentication
    // This should typically be done from backend for security

    const deleteUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`;

    // Generate signature (requires backend support)
    // For now, this is a placeholder

    console.warn('Delete operation should be handled by backend');
    return false;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

/**
 * Get optimized image URL
 * @param {string} cloudinaryUrl - Original Cloudinary URL
 * @param {Object} transformations - Transformation options
 * @returns {string} - Optimized URL
 */
export const getOptimizedUrl = (cloudinaryUrl, transformations = {}) => {
  try {
    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto',
    } = transformations;

    // Extract public ID from URL
    const urlParts = cloudinaryUrl.split('/upload/');
    if (urlParts.length !== 2) {
      return cloudinaryUrl;
    }

    const [baseUrl, path] = urlParts;

    // Build transformation string
    const transforms = [];

    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (crop) transforms.push(`c_${crop}`);
    if (quality) transforms.push(`q_${quality}`);
    if (format) transforms.push(`f_${format}`);

    const transformString = transforms.join(',');

    // Construct optimized URL
    return `${baseUrl}/upload/${transformString}/${path}`;
  } catch (error) {
    console.error('Error creating optimized URL:', error);
    return cloudinaryUrl;
  }
};

/**
 * Get thumbnail URL
 * @param {string} cloudinaryUrl - Original Cloudinary URL
 * @returns {string} - Thumbnail URL
 */
export const getThumbnailUrl = (cloudinaryUrl) => {
  return getOptimizedUrl(cloudinaryUrl, {
    width: 200,
    height: 200,
    crop: 'fill',
    quality: 'auto',
  });
};

/**
 * Validate Cloudinary configuration
 * @returns {boolean} - Whether config is valid
 */
export const isCloudinaryConfigured = () => {
  return (
    CLOUDINARY_CLOUD_NAME !== 'YOUR_CLOUD_NAME' &&
    CLOUDINARY_UPLOAD_PRESET !== 'YOUR_UPLOAD_PRESET'
  );
};

export default {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  uploadWithProgress,
  deleteFromCloudinary,
  getOptimizedUrl,
  getThumbnailUrl,
  isCloudinaryConfigured,
};
