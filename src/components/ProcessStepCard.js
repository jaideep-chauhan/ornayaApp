import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ProcessStepCard = ({
  stepNumber,
  stepName,
  stepDescription,
  isActive,
  isCompleted,
  checklist = [],
  onChecklistChange,
  assignedMaterials = [],
  onMaterialUsageChange,
  materialUsage = {},
  onPhotosChange,
  photos = [],
  onCompleteStep,
  onEditNotes,
  notes = '',
}) => {
  const [localNotes, setLocalNotes] = useState(notes);
  const [expanded, setExpanded] = useState(isActive);

  // Toggle checklist item completion
  const toggleChecklistItem = (index) => {
    const updatedChecklist = [...checklist];
    updatedChecklist[index].completed = !updatedChecklist[index].completed;
    onChecklistChange(updatedChecklist);
  };

  // Calculate completion percentage
  const completionPercentage = () => {
    if (checklist.length === 0) return 0;
    const completed = checklist.filter((item) => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  // Check if step can be completed
  const canCompleteStep = () => {
    // All checklist items must be completed
    const allChecklistDone = checklist.every((item) => item.completed);

    // At least one photo should be captured (optional but recommended)
    const hasPhotos = photos.length > 0;

    // Material usage should be recorded
    const hasMaterialUsage = Object.keys(materialUsage).length > 0;

    return allChecklistDone;
  };

  // Get step status color
  const getStatusColor = () => {
    if (isCompleted) return '#4CAF50'; // Green
    if (isActive) return '#FF6B35'; // Orange
    return '#9E9E9E'; // Grey
  };

  // Render step header
  const renderHeader = () => (
    <TouchableOpacity
      style={[
        styles.header,
        { borderLeftColor: getStatusColor() },
        isActive && styles.activeHeader,
      ]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.headerLeft}>
        <View style={[styles.stepIcon, { backgroundColor: getStatusColor() }]}>
          {isCompleted ? (
            <Icon name="check" size={20} color="#FFF" />
          ) : (
            <Text style={styles.stepNumber}>{stepNumber}</Text>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.stepName}>{stepName}</Text>
          {!expanded && (
            <Text style={styles.stepStatus}>
              {isCompleted
                ? 'Completed'
                : isActive
                ? `${completionPercentage()}% complete`
                : 'Pending'}
            </Text>
          )}
        </View>
      </View>
      <Icon
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={24}
        color="#666"
      />
    </TouchableOpacity>
  );

  // Render checklist section
  const renderChecklist = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Checklist</Text>
      {checklist.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.checklistItem}
          onPress={() => !isCompleted && toggleChecklistItem(index)}
          disabled={isCompleted}
        >
          <View
            style={[
              styles.checkbox,
              item.completed && styles.checkboxChecked,
            ]}
          >
            {item.completed && <Icon name="check" size={16} color="#FFF" />}
          </View>
          <Text
            style={[
              styles.checklistText,
              item.completed && styles.checklistTextCompleted,
            ]}
          >
            {item.item}
          </Text>
        </TouchableOpacity>
      ))}
      {checklist.length === 0 && (
        <Text style={styles.emptyText}>No checklist items</Text>
      )}
    </View>
  );

  // Render material usage section
  const renderMaterialUsage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Material Usage</Text>
      {assignedMaterials.map((material, index) => {
        const usage = materialUsage[material.material_id] || {
          used: 0,
          wastage: 0,
        };
        const remaining =
          parseFloat(material.quantity || 0) -
          parseFloat(usage.used || 0) -
          parseFloat(usage.wastage || 0);

        return (
          <View key={index} style={styles.materialItem}>
            <Text style={styles.materialName}>
              {material.material_name} ({material.unit})
            </Text>
            <View style={styles.materialInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Used:</Text>
                <TextInput
                  style={styles.materialInput}
                  value={String(usage.used || '')}
                  onChangeText={(value) =>
                    onMaterialUsageChange(material.material_id, 'used', value)
                  }
                  keyboardType="decimal-pad"
                  editable={!isCompleted}
                  placeholder="0"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Wastage:</Text>
                <TextInput
                  style={styles.materialInput}
                  value={String(usage.wastage || '')}
                  onChangeText={(value) =>
                    onMaterialUsageChange(
                      material.material_id,
                      'wastage',
                      value
                    )
                  }
                  keyboardType="decimal-pad"
                  editable={!isCompleted}
                  placeholder="0"
                />
              </View>
            </View>
            <View style={styles.materialSummary}>
              <Text style={styles.materialAllocated}>
                Allocated: {material.quantity} {material.unit}
              </Text>
              <Text
                style={[
                  styles.materialRemaining,
                  remaining < 0 && styles.materialExceeded,
                ]}
              >
                Remaining: {remaining.toFixed(2)} {material.unit}
              </Text>
            </View>
            {remaining < 0 && (
              <Text style={styles.warningText}>
                ⚠️ Exceeded allocated quantity!
              </Text>
            )}
          </View>
        );
      })}
      {assignedMaterials.length === 0 && (
        <Text style={styles.emptyText}>No materials assigned</Text>
      )}
    </View>
  );

  // Render photos section
  const renderPhotos = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
        {!isCompleted && (
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={() => onPhotosChange('add')}
          >
            <Icon name="camera" size={20} color="#009688" />
            <Text style={styles.addPhotoText}>Capture</Text>
          </TouchableOpacity>
        )}
      </View>
      {photos.length === 0 && (
        <Text style={styles.emptyText}>
          No photos captured. Recommended: 2-3 photos per step
        </Text>
      )}
      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <View style={styles.photoPlaceholder}>
                  <MaterialCommunityIcons
                    name="image"
                    size={40}
                    color="#999"
                  />
                </View>
                {!isCompleted && (
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => onPhotosChange('remove', index)}
                  >
                    <Icon name="x" size={16} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  // Render notes section
  const renderNotes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notes</Text>
      <TextInput
        style={styles.notesInput}
        value={localNotes}
        onChangeText={setLocalNotes}
        onBlur={() => onEditNotes(localNotes)}
        placeholder="Add notes about this step..."
        multiline
        numberOfLines={3}
        editable={!isCompleted}
      />
    </View>
  );

  // Render complete step button
  const renderCompleteButton = () => {
    if (isCompleted) {
      return (
        <View style={styles.completedBanner}>
          <Icon name="check-circle" size={20} color="#4CAF50" />
          <Text style={styles.completedText}>Step Completed</Text>
        </View>
      );
    }

    if (!isActive) {
      return null;
    }

    const isValid = canCompleteStep();

    return (
      <View style={styles.completeSection}>
        {!isValid && (
          <Text style={styles.validationText}>
            ⚠️ Complete all checklist items to proceed
          </Text>
        )}
        {photos.length === 0 && (
          <Text style={styles.recommendationText}>
            💡 Recommended: Capture at least 2 photos for documentation
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.completeButton,
            !isValid && styles.completeButtonDisabled,
          ]}
          onPress={() => {
            if (isValid) {
              Alert.alert(
                'Complete Step',
                `Are you sure you want to mark "${stepName}" as completed?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Complete',
                    onPress: onCompleteStep,
                    style: 'default',
                  },
                ]
              );
            }
          }}
          disabled={!isValid}
        >
          <Icon name="check-circle" size={20} color="#FFF" />
          <Text style={styles.completeButtonText}>Complete This Step</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!expanded) {
    return renderHeader();
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <View style={styles.content}>
        {stepDescription && (
          <Text style={styles.description}>{stepDescription}</Text>
        )}
        {renderChecklist()}
        {renderMaterialUsage()}
        {renderPhotos()}
        {renderNotes()}
        {renderCompleteButton()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderLeftWidth: 4,
  },
  activeHeader: {
    backgroundColor: '#FFF9F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumber: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  stepName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  stepStatus: {
    fontSize: 13,
    color: '#666',
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#009688',
    borderColor: '#009688',
  },
  checklistText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  materialItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  materialInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputGroup: {
    flex: 1,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  materialInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  },
  materialSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  materialAllocated: {
    fontSize: 12,
    color: '#666',
  },
  materialRemaining: {
    fontSize: 12,
    fontWeight: '600',
    color: '#009688',
  },
  materialExceeded: {
    color: '#F44336',
  },
  warningText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E0F2F1',
    borderRadius: 6,
  },
  addPhotoText: {
    fontSize: 13,
    color: '#009688',
    fontWeight: '600',
    marginLeft: 6,
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photoWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F44336',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  completeSection: {
    marginTop: 8,
  },
  validationText: {
    fontSize: 13,
    color: '#F44336',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 13,
    color: '#FF9800',
    marginBottom: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009688',
    padding: 14,
    borderRadius: 8,
    marginTop: 4,
  },
  completeButtonDisabled: {
    backgroundColor: '#CCC',
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginTop: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ProcessStepCard;
