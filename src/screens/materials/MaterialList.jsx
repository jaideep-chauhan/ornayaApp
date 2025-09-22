import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import TopBar from '../../components/ui/TopBar';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MaterialCard = ({ material, onPress }) => {
    const materialColors = [
        { bgColor: COLORS.accent + '15', color: COLORS.accent },
        { bgColor: COLORS.warning + '15', color: COLORS.warning },
        { bgColor: COLORS.primary + '15', color: COLORS.primary },
        { bgColor: COLORS.info + '15', color: COLORS.info },
        { bgColor: COLORS.success + '15', color: COLORS.success }
    ];
    
    const materialIcons = {
        'Gold': 'gold',
        'Silver': 'silverware-fork-knife',
        'Platinum': 'diamond-stone',
        'Copper': 'circle-outline',
        'Diamond': 'diamond'
    };

    const colorIndex = Math.abs(material.materialName.charCodeAt(0)) % materialColors.length;
    const { bgColor, color } = materialColors[colorIndex];
    const icon = materialIcons[material.materialName] || 'circle-outline';

    return (
        <TouchableOpacity
            style={[styles.materialCard, { backgroundColor: bgColor }]}
            onPress={() => onPress(material)}
        >
            <View style={styles.materialHeader}>
                <Icon name={icon} size={32} color={color} />
                <View style={styles.materialInfo}>
                    <Text style={[styles.materialName, { color: color }]}>
                        {material.materialName}
                    </Text>
                    <Text style={[styles.materialQuantity, { color: color }]}>
                        {material.quantity}{material.unit}
                    </Text>
                </View>
            </View>
            
            <View style={styles.materialDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Used:</Text>
                    <Text style={styles.detailValue}>
                        {material.usedQuantity || 0}{material.unit}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Remaining:</Text>
                    <Text style={styles.detailValue}>
                        {material.remainingQuantity || material.quantity}{material.unit}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Usage:</Text>
                    <Text style={[styles.detailValue, { color: color }]}>
                        {material.usagePercentage || 0}%
                    </Text>
                </View>
            </View>

            <View style={styles.viewDetailsContainer}>
                <Text style={[styles.viewDetailsText, { color: color }]}>
                    View Details →
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const MaterialList = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { theme } = useTheme();
    
    const { materials = [] } = route.params || {};

    const handleMaterialPress = (materialData) => {
        navigation.navigate('MaterialUsage', {
            materialId: materialData.materialId,
            material: materialData.materialName,
            issued: materialData.quantity.toString(),
            used: materialData.usedQuantity?.toString() || '0',
            remaining: materialData.remainingQuantity?.toString() || materialData.quantity.toString(),
            unit: materialData.unit,
            usagePercentage: materialData.usagePercentage || 0,
            taskBreakdown: [
                { id: '#T987430', description: `${materialData.materialName} Pendant Crafting`, status: 'In progress', amount: 5.25 },
                { id: '#T987431', description: `${materialData.materialName} Ring Polishing`, status: 'Completed', amount: 3.25 },
            ],
        });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <TopBar title="Materials Issued" showBack={true} showNotification={false} />
            
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>All Materials</Text>
                    <Text style={styles.headerSubtitle}>
                        {materials.length} material{materials.length !== 1 ? 's' : ''} issued
                    </Text>
                </View>

                {materials.length > 0 ? (
                    materials.map((material, index) => (
                        <MaterialCard
                            key={`${material.materialId}-${index}`}
                            material={material}
                            onPress={handleMaterialPress}
                        />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Icon name="package-variant-closed" size={64} color={COLORS.textSecondary} />
                        <Text style={styles.emptyTitle}>No Materials Found</Text>
                        <Text style={styles.emptySubtitle}>
                            No materials have been issued yet.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default MaterialList;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        paddingBottom: 20,
        backgroundColor: COLORS.background,
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '400',
    },
    materialCard: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    materialHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    materialInfo: {
        marginLeft: 12,
        flex: 1,
    },
    materialName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 2,
    },
    materialQuantity: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    materialDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '400',
    },
    detailValue: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    viewDetailsContainer: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    viewDetailsText: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});