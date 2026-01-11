/**
 * Step Validation Utility
 * Validates process steps before completion
 */

/**
 * Validate checklist completion
 * @param {Array} checklist - Array of checklist items
 * @returns {Object} - Validation result
 */
export const validateChecklist = (checklist = []) => {
  if (checklist.length === 0) {
    return {
      valid: true,
      message: 'No checklist items',
      completedCount: 0,
      totalCount: 0,
      percentage: 100,
    };
  }

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    valid: completedCount === totalCount,
    message:
      completedCount === totalCount
        ? 'All checklist items completed'
        : `${totalCount - completedCount} items remaining`,
    completedCount,
    totalCount,
    percentage,
  };
};

/**
 * Validate material usage
 * @param {Array} assignedMaterials - Assigned materials
 * @param {Object} materialUsage - Material usage data
 * @returns {Object} - Validation result
 */
export const validateMaterialUsage = (
  assignedMaterials = [],
  materialUsage = {}
) => {
  const errors = [];
  const warnings = [];
  let totalExceeded = 0;
  let highWastageCount = 0;

  assignedMaterials.forEach((material) => {
    const usage = materialUsage[material.material_id] || {
      used: 0,
      wastage: 0,
    };

    const allocated = parseFloat(material.quantity || 0);
    const allowance = parseFloat(material.wastage_allowance || 5);
    const maxAllowed = allocated + (allocated * allowance) / 100;

    const used = parseFloat(usage.used || 0);
    const wastage = parseFloat(usage.wastage || 0);
    const total = used + wastage;

    // Check if total usage exceeds allocated + allowance
    if (total > maxAllowed) {
      totalExceeded++;
      errors.push({
        material: material.material_name,
        message: `Total usage (${total.toFixed(2)} ${material.unit}) exceeds maximum allowed (${maxAllowed.toFixed(2)} ${material.unit})`,
        severity: 'error',
      });
    }

    // Check wastage percentage
    if (allocated > 0) {
      const wastagePercent = (wastage / allocated) * 100;

      if (wastagePercent > allowance) {
        errors.push({
          material: material.material_name,
          message: `Wastage ${wastagePercent.toFixed(2)}% exceeds allowance ${allowance}%`,
          severity: 'error',
        });
      } else if (wastagePercent > 3) {
        highWastageCount++;
        warnings.push({
          material: material.material_name,
          message: `High wastage: ${wastagePercent.toFixed(2)}%. Please provide reason in notes.`,
          severity: 'warning',
        });
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    totalExceeded,
    highWastageCount,
    message:
      errors.length === 0
        ? warnings.length > 0
          ? `${warnings.length} warning(s)`
          : 'Material usage valid'
        : `${errors.length} error(s) found`,
  };
};

/**
 * Validate photos
 * @param {Array} photos - Photos array
 * @param {Number} minPhotos - Minimum required photos
 * @param {Boolean} required - Whether photos are required
 * @returns {Object} - Validation result
 */
export const validatePhotos = (photos = [], minPhotos = 0, required = false) => {
  const count = photos.length;

  if (required && count < minPhotos) {
    return {
      valid: false,
      message: `Minimum ${minPhotos} photo(s) required`,
      count,
      required: minPhotos,
    };
  }

  if (!required && count === 0) {
    return {
      valid: true,
      message: 'Photos are optional',
      count,
      warning: 'Consider adding photos for documentation',
    };
  }

  return {
    valid: true,
    message: `${count} photo(s) captured`,
    count,
  };
};

/**
 * Validate notes
 * @param {String} notes - Notes text
 * @param {Boolean} required - Whether notes are required
 * @param {Number} minLength - Minimum length if required
 * @returns {Object} - Validation result
 */
export const validateNotes = (notes = '', required = false, minLength = 10) => {
  const trimmed = notes.trim();
  const length = trimmed.length;

  if (required && length === 0) {
    return {
      valid: false,
      message: 'Notes are required',
      length: 0,
    };
  }

  if (required && length < minLength) {
    return {
      valid: false,
      message: `Notes must be at least ${minLength} characters`,
      length,
    };
  }

  return {
    valid: true,
    message: length > 0 ? 'Notes provided' : 'No notes',
    length,
  };
};

/**
 * Validate entire step before completion
 * @param {Object} stepData - Step data object
 * @param {Object} config - Validation configuration
 * @returns {Object} - Complete validation result
 */
export const validateStep = (stepData, config = {}) => {
  const {
    checklistRequired = true,
    materialUsageRequired = false,
    photosRequired = false,
    minPhotos = 0,
    notesRequired = false,
    minNotesLength = 10,
  } = config;

  const results = {
    checklist: validateChecklist(stepData.checklist || []),
    materialUsage: validateMaterialUsage(
      stepData.assignedMaterials || [],
      stepData.materialUsage || {}
    ),
    photos: validatePhotos(
      stepData.photos || [],
      minPhotos,
      photosRequired
    ),
    notes: validateNotes(
      stepData.notes || '',
      notesRequired,
      minNotesLength
    ),
  };

  const errors = [];
  const warnings = [];

  // Collect errors
  if (checklistRequired && !results.checklist.valid) {
    errors.push({
      field: 'checklist',
      message: results.checklist.message,
    });
  }

  if (materialUsageRequired && !results.materialUsage.valid) {
    errors.push({
      field: 'materialUsage',
      message: results.materialUsage.message,
    });
  }

  if (!results.photos.valid) {
    errors.push({
      field: 'photos',
      message: results.photos.message,
    });
  }

  if (!results.notes.valid) {
    errors.push({
      field: 'notes',
      message: results.notes.message,
    });
  }

  // Collect warnings
  if (results.materialUsage.warnings.length > 0) {
    warnings.push(...results.materialUsage.warnings);
  }

  if (results.photos.warning) {
    warnings.push({
      field: 'photos',
      message: results.photos.warning,
      severity: 'warning',
    });
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    results,
    canProceed: valid,
    summary: valid
      ? `Step validation passed${warnings.length > 0 ? ` (${warnings.length} warning(s))` : ''}`
      : `${errors.length} validation error(s)`,
  };
};

/**
 * Calculate step completion score
 * @param {Object} stepData - Step data
 * @returns {Number} - Completion score 0-100
 */
export const calculateCompletionScore = (stepData) => {
  const weights = {
    checklist: 40,
    materialUsage: 30,
    photos: 20,
    notes: 10,
  };

  let score = 0;

  // Checklist score
  if (stepData.checklist && stepData.checklist.length > 0) {
    const completed = stepData.checklist.filter((item) => item.completed).length;
    score += (completed / stepData.checklist.length) * weights.checklist;
  } else {
    score += weights.checklist; // No checklist means auto-complete
  }

  // Material usage score
  if (stepData.assignedMaterials && stepData.assignedMaterials.length > 0) {
    const materialsWithUsage = Object.keys(stepData.materialUsage || {}).length;
    score +=
      (materialsWithUsage / stepData.assignedMaterials.length) *
      weights.materialUsage;
  } else {
    score += weights.materialUsage; // No materials means auto-complete
  }

  // Photos score
  const photoCount = (stepData.photos || []).length;
  const minRecommended = 2;
  score +=
    Math.min(photoCount / minRecommended, 1) * weights.photos;

  // Notes score
  const notesLength = (stepData.notes || '').trim().length;
  score += Math.min(notesLength / 20, 1) * weights.notes;

  return Math.round(score);
};

/**
 * Get validation recommendations
 * @param {Object} validationResult - Result from validateStep
 * @returns {Array} - Array of recommendations
 */
export const getRecommendations = (validationResult) => {
  const recommendations = [];

  if (validationResult.results.checklist.percentage < 100) {
    recommendations.push({
      priority: 'high',
      message: 'Complete all checklist items before proceeding',
      action: 'checklist',
    });
  }

  if (validationResult.results.materialUsage.warnings.length > 0) {
    recommendations.push({
      priority: 'medium',
      message: 'High wastage detected. Please document reason in notes',
      action: 'notes',
    });
  }

  if (validationResult.results.photos.count === 0) {
    recommendations.push({
      priority: 'low',
      message: 'Consider capturing 2-3 photos for quality documentation',
      action: 'photos',
    });
  }

  if (validationResult.results.photos.count < 2) {
    recommendations.push({
      priority: 'low',
      message: 'Add more photos for better documentation',
      action: 'photos',
    });
  }

  if (validationResult.results.notes.length === 0) {
    recommendations.push({
      priority: 'low',
      message: 'Add notes about the process for future reference',
      action: 'notes',
    });
  }

  return recommendations;
};

/**
 * Format validation errors for display
 * @param {Array} errors - Validation errors
 * @returns {String} - Formatted error message
 */
export const formatValidationErrors = (errors) => {
  if (errors.length === 0) return '';

  if (errors.length === 1) {
    return errors[0].message;
  }

  return errors.map((err, index) => `${index + 1}. ${err.message}`).join('\n');
};

/**
 * Check if step can be completed
 * @param {Object} stepData - Step data
 * @param {Object} config - Validation config
 * @returns {Boolean} - Whether step can be completed
 */
export const canCompleteStep = (stepData, config = {}) => {
  const validation = validateStep(stepData, config);
  return validation.canProceed;
};

export default {
  validateChecklist,
  validateMaterialUsage,
  validatePhotos,
  validateNotes,
  validateStep,
  calculateCompletionScore,
  getRecommendations,
  formatValidationErrors,
  canCompleteStep,
};
