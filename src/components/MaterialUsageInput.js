import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const MaterialUsageInput = ({
  assignedMaterials = [],
  currentUsage = {},
  onUsageChange,
  allowWastagePhotos = false,
  onCaptureWastagePhoto,
}) => {
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempUsage, setTempUsage] = useState({});

  // Calculate total usage across all steps
  const getTotalUsage = (materialId) => {
    const usage = currentUsage[materialId] || { used: 0, wastage: 0 };
    return {
      used: parseFloat(usage.used || 0),
      wastage: parseFloat(usage.wastage || 0),
      total:
        parseFloat(usage.used || 0) + parseFloat(usage.wastage || 0),
    };
  };

  // Calculate wastage percentage
  const getWastagePercentage = (materialId) => {
    const material = assignedMaterials.find(
      (m) => m.material_id === materialId
    );
    if (!material) return 0;

    const usage = getTotalUsage(materialId);
    const allocated = parseFloat(material.quantity || 0);

    if (allocated === 0) return 0;
    return ((usage.wastage / allocated) * 100).toFixed(2);
  };

  // Check if wastage is within allowance
  const isWastageWithinLimit = (materialId) => {
    const material = assignedMaterials.find(
      (m) => m.material_id === materialId
    );
    if (!material) return true;

    const wastagePercent = parseFloat(getWastagePercentage(materialId));
    const allowance = parseFloat(material.wastage_allowance || 5); // Default 5%

    return wastagePercent <= allowance;
  };

  // Get remaining material
  const getRemainingMaterial = (materialId) => {
    const material = assignedMaterials.find(
      (m) => m.material_id === materialId
    );
    if (!material) return 0;

    const usage = getTotalUsage(materialId);
    const allocated = parseFloat(material.quantity || 0);
    const allowance = parseFloat(material.wastage_allowance || 5);
    const maxAllowed = allocated + (allocated * allowance) / 100;

    return maxAllowed - usage.total;
  };

  // Open material detail modal
  const openMaterialModal = (material) => {
    setSelectedMaterial(material);
    setTempUsage(currentUsage[material.material_id] || { used: 0, wastage: 0 });
    setModalVisible(true);
  };

  // Save material usage
  const saveMaterialUsage = () => {
    if (!selectedMaterial) return;

    const materialId = selectedMaterial.material_id;
    const usage = getTotalUsage(materialId);
    const newUsed = parseFloat(tempUsage.used || 0);
    const newWastage = parseFloat(tempUsage.wastage || 0);
    const newTotal = newUsed + newWastage;

    const allocated = parseFloat(selectedMaterial.quantity || 0);
    const allowance = parseFloat(selectedMaterial.wastage_allowance || 5);
    const maxAllowed = allocated + (allocated * allowance) / 100;

    // Validate total usage
    if (newTotal > maxAllowed) {
      Alert.alert(
        'Usage Exceeded',
        `Total usage (${newTotal.toFixed(2)} ${selectedMaterial.unit}) exceeds allocated quantity with wastage allowance (${maxAllowed.toFixed(2)} ${selectedMaterial.unit}).\n\nPlease request additional material if needed.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Warn if wastage is high
    const wastagePercent = (newWastage / allocated) * 100;
    if (wastagePercent > 3 && wastagePercent <= allowance) {
      Alert.alert(
        'High Wastage',
        `Wastage is ${wastagePercent.toFixed(2)}% of allocated quantity. Please provide a reason in notes.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              onUsageChange(materialId, tempUsage);
              setModalVisible(false);
            },
          },
        ]
      );
      return;
    }

    onUsageChange(materialId, tempUsage);
    setModalVisible(false);
  };

  // Render material summary card
  const renderMaterialCard = (material) => {
    const usage = getTotalUsage(material.material_id);
    const remaining = getRemainingMaterial(material.material_id);
    const wastagePercent = getWastagePercentage(material.material_id);
    const isWithinLimit = isWastageWithinLimit(material.material_id);

    const usagePercent =
      (usage.total / parseFloat(material.quantity || 1)) * 100;

    return (
      <TouchableOpacity
        key={material.material_id}
        style={styles.materialCard}
        onPress={() => openMaterialModal(material)}
      >
        <View style={styles.materialHeader}>
          <Text style={styles.materialName}>{material.material_name}</Text>
          {material.purity && (
            <Text style={styles.materialPurity}>{material.purity}</Text>
          )}
        </View>

        <View style={styles.usageBar}>
          <View
            style={[
              styles.usageBarFill,
              { width: `${Math.min(usagePercent, 100)}%` },
              !isWithinLimit && styles.usageBarExceeded,
            ]}
          />
        </View>

        <View style={styles.materialStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Used</Text>
            <Text style={styles.statValue}>
              {usage.used.toFixed(2)} {material.unit}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Wastage</Text>
            <Text
              style={[
                styles.statValue,
                !isWithinLimit && styles.statValueError,
              ]}
            >
              {usage.wastage.toFixed(2)} {material.unit}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text
              style={[
                styles.statValue,
                remaining < 0 && styles.statValueError,
              ]}
            >
              {remaining.toFixed(2)} {material.unit}
            </Text>
          </View>
        </View>

        {!isWithinLimit && (
          <View style={styles.warningBanner}>
            <Icon name="alert-circle" size={16} color="#F44336" />
            <Text style={styles.warningText}>
              Wastage {wastagePercent}% exceeds {material.wastage_allowance}%
              allowance
            </Text>
          </View>
        )}

        <View style={styles.editIndicator}>
          <Icon name="edit-2" size={16} color="#009688" />
        </View>
      </TouchableOpacity>
    );
  };

  // Render material detail modal
  const renderMaterialModal = () => {
    if (!selectedMaterial) return null;

    const allocated = parseFloat(selectedMaterial.quantity || 0);
    const allowance = parseFloat(selectedMaterial.wastage_allowance || 5);
    const maxAllowed = allocated + (allocated * allowance) / 100;
    const currentTotal =
      parseFloat(tempUsage.used || 0) + parseFloat(tempUsage.wastage || 0);
    const remaining = maxAllowed - currentTotal;
    const wastagePercent =
      allocated > 0
        ? ((parseFloat(tempUsage.wastage || 0) / allocated) * 100).toFixed(2)
        : 0;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedMaterial.material_name}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.allocationInfo}>
                <Text style={styles.infoLabel}>Allocated Quantity</Text>
                <Text style={styles.infoValue}>
                  {allocated.toFixed(2)} {selectedMaterial.unit}
                </Text>
              </View>

              <View style={styles.allocationInfo}>
                <Text style={styles.infoLabel}>Wastage Allowance</Text>
                <Text style={styles.infoValue}>{allowance}%</Text>
              </View>

              <View style={styles.allocationInfo}>
                <Text style={styles.infoLabel}>Max Allowed (with wastage)</Text>
                <Text style={styles.infoValue}>
                  {maxAllowed.toFixed(2)} {selectedMaterial.unit}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.inputSection}>
                <Text style={styles.inputSectionTitle}>Material Used</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.numberInput}
                    value={String(tempUsage.used || '')}
                    onChangeText={(value) =>
                      setTempUsage({ ...tempUsage, used: value })
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                  <Text style={styles.inputUnit}>{selectedMaterial.unit}</Text>
                </View>
                <Text style={styles.inputHint}>
                  Amount of material actually used in production
                </Text>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputSectionTitle}>Wastage</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.numberInput}
                    value={String(tempUsage.wastage || '')}
                    onChangeText={(value) =>
                      setTempUsage({ ...tempUsage, wastage: value })
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                  <Text style={styles.inputUnit}>{selectedMaterial.unit}</Text>
                </View>
                <Text style={styles.inputHint}>
                  Material wasted during production
                </Text>
                {wastagePercent > 0 && (
                  <Text
                    style={[
                      styles.wastagePercentText,
                      wastagePercent > allowance && styles.wastageExceeded,
                    ]}
                  >
                    {wastagePercent}% of allocated quantity
                  </Text>
                )}
              </View>

              {wastagePercent > 5 && allowWastagePhotos && (
                <TouchableOpacity
                  style={styles.wastagePhotoButton}
                  onPress={() => {
                    setModalVisible(false);
                    onCaptureWastagePhoto(selectedMaterial.material_id);
                  }}
                >
                  <Icon name="camera" size={20} color="#FF9800" />
                  <Text style={styles.wastagePhotoText}>
                    Capture Wastage Photo (Recommended)
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.divider} />

              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Usage:</Text>
                  <Text style={styles.summaryValue}>
                    {currentTotal.toFixed(2)} {selectedMaterial.unit}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Remaining:</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      remaining < 0 ? styles.summaryValueError : styles.summaryValueSuccess,
                    ]}
                  >
                    {remaining.toFixed(2)} {selectedMaterial.unit}
                  </Text>
                </View>
              </View>

              {remaining < 0 && (
                <View style={styles.errorBanner}>
                  <Icon name="alert-triangle" size={20} color="#F44336" />
                  <Text style={styles.errorText}>
                    Total usage exceeds allocated quantity with allowance.
                    Please request additional material.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  remaining < 0 && styles.saveButtonDisabled,
                ]}
                onPress={saveMaterialUsage}
                disabled={remaining < 0}
              >
                <Text style={styles.saveButtonText}>Save Usage</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Material Usage Tracking</Text>
      <Text style={styles.subtitle}>
        Tap on a material to record usage and wastage
      </Text>

      {assignedMaterials.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="package" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No materials assigned</Text>
        </View>
      ) : (
        assignedMaterials.map(renderMaterialCard)
      )}

      {renderMaterialModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  materialCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  materialPurity: {
    fontSize: 13,
    color: '#009688',
    fontWeight: '600',
  },
  usageBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: '#009688',
  },
  usageBarExceeded: {
    backgroundColor: '#F44336',
  },
  materialStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statValueError: {
    color: '#F44336',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
  },
  warningText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
  },
  editIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  allocationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 12,
  },
  numberInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#333',
  },
  inputUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  wastagePercentText: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '600',
    marginTop: 8,
  },
  wastageExceeded: {
    color: '#F44336',
  },
  wastagePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
    marginTop: 12,
  },
  wastagePhotoText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 8,
  },
  summarySection: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryValueSuccess: {
    color: '#4CAF50',
  },
  summaryValueError: {
    color: '#F44336',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#F44336',
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#009688',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCC',
  },
  saveButtonText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default MaterialUsageInput;
