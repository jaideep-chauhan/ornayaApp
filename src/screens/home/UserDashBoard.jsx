import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    useWindowDimensions,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from '../../components/ui/TopBar';
import { useNavigation } from '@react-navigation/native';
import { fetchDashboardData } from '../../store/slices/dashboardSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { createCommonStyles, getStatusBadgeStyle } from '../../utils/commonStyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


const StatusBadge = ({ status }) => {
    const { theme } = useTheme();
    const badgeStyle = getStatusBadgeStyle(status, theme);

    return (
        <View style={badgeStyle}>
            <Text style={[{ ...theme.typography.caption, fontWeight: '600' }, styles.statusText]}>
                {status === 'pending' ? 'New' : status}
            </Text>
        </View>
    );
};

const AgendaCard = ({ item, navigation }) => {
    if (!item || !item.title || !item.id || !item.date || !item.due || !item.status) {
        return null; // Skip rendering if any required property is missing
    }

    // Determine if this is a repair or task based on the ID format
    const isRepair = item.id && (item.id.toString().includes('R') || item.originalType === 'repair');

    const handleViewDetails = () => {
        // Extract the actual ID from the formatted ID (remove # and any prefixes)
        // Ensure item.id is converted to string first
        const cleanId = item.id.toString().replace('#', '').replace(/^[TR]/, '');

        navigation.navigate('TaskDetail', {
            taskId: cleanId,
            isRepair: isRepair,
            from: 'Dashboard'
        });
    };

    return (
        <View style={styles.agendaCard}>
            <View style={styles.agendaTop}>
                <Text style={styles.agendaTitle}>{item.title}</Text>
                <Text style={styles.agendaDate}>{item.date}</Text>
            </View>
            <Text style={styles.agendaId}>#{item.id}</Text>
            <Text style={styles.dueText}>📅 Due: {item.due}</Text>
            <View style={styles.agendaActions}>
                <StatusBadge status={item.status} />
                <TouchableOpacity style={styles.detailsBtn} onPress={handleViewDetails}>
                    <Text style={styles.detailsText}>View Details</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const UserDashboard = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const scrollRef = useRef();
    const [activeSlide, setActiveSlide] = useState(0);
    const { theme } = useTheme();
    const commonStyles = createCommonStyles(theme);

    const {
        dashboardData,
        statistics,
        loading,
        error
    } = useSelector((state) => state.dashboard);

    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchDashboardData());
    }, [dispatch]);

    const handleRefresh = () => {
        dispatch(fetchDashboardData());
    };

    const handleScroll = (event) => {
        const slide = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveSlide(slide);
    };

    const handleMaterialPress = (index) => {
        if (index === 1) {
            navigation.navigate('MaterialUsage', {
                material: 'Gold',
                issued: '128.75',
                used: '97.20',
                remaining: '31.55',
                taskBreakdown: [
                    { id: '#T987430', description: 'Gold Pendant Crafting', status: 'In progress', amount: 5.25 },
                    { id: '#T987431', description: 'Gold Ring Polishing', status: 'Completed', amount: 3.25 },
                ],
            });
        }
    };

    const handleSummaryCardPress = (label) => {
        if (label === 'Total Orders') {
            navigation.navigate('Order List');
        } else if (label === 'Total Repairs') {
            navigation.navigate('RepairList');
        }
    };

    // Use API data if available, otherwise fall back to static data
    const displaySummaryCards = [
        {
            id: '1',
            title: `You have ${statistics?.totalTasks || 0} new order today!`,
            items: [
                { label: 'Total Tasks', value: statistics?.totalTasks || 0, bgColor: '#E7F3FF', color: '#005AA9', icon: 'clipboard-check' },
                { label: 'Product Repairs', value: statistics?.totalRepairs || 0, bgColor: '#FFE6D4', color: '#FF9142', icon: 'tools' },
                { label: 'New Product', value: 9, bgColor: '#FEF5D3', color: '#B58B00', icon: 'package-variant' },
            ],
        },
        {
            id: '2',
            title: `Material Issued`,
            items: [
                { label: 'Gold', value: '128.75g', bgColor: '#E6F0FF', color: '#005AA9', icon: 'gold' },
                { label: 'Platinum', value: '97.20g', bgColor: '#FFEDE0', color: '#FF9142', icon: 'diamond-stone' },
                { label: 'Silver', value: '31.55g', bgColor: '#E0F8FF', color: '#B58B00', icon: 'silverware-fork-knife' },
            ],
        }
    ];

    // Format the agenda items from dashboardData
    const displayAgendaItems = [
        ...dashboardData.todayTasks.map(task => ({
            title: task.title,
            id: task.orderId,
            // Convert date strings to Date objects for formatting only at display time
            date: task.createdAt ? new Date(parseInt(task.createdAt)).toLocaleDateString() : 'N/A',
            due: task.deadline ? new Date(parseInt(task.deadline)).toLocaleDateString() : 'N/A',
            status: task.status,
            originalType: 'task'
        })),
        ...dashboardData.weekTasks.map(task => ({
            title: task.title,
            id: task.orderId,
            date: task.createdAt ? new Date(parseInt(task.createdAt)).toLocaleDateString() : 'N/A',
            due: 'N/A',
            status: task.status,
            originalType: 'task'
        })),
        ...dashboardData.todayRepairs.map(repair => ({
            title: repair.product,
            id: repair.repairId,
            date: repair.createdAt ? new Date(parseInt(repair.createdAt)).toLocaleDateString() : 'N/A',
            due: repair.deadline ? new Date(parseInt(repair.deadline)).toLocaleDateString() : 'N/A',
            status: repair.status,
            originalType: 'repair'
        })),
        ...dashboardData.weekRepairs.map(repair => ({
            title: repair.product,
            id: repair.repairId,
            date: repair.createdAt ? new Date(parseInt(repair.createdAt)).toLocaleDateString() : 'N/A',
            due: 'N/A',
            status: repair.status,
            originalType: 'repair'
        })),
    ];

    if (loading && !dashboardData) {
        return (
            <SafeAreaView style={styles.safe}>
                <TopBar title="Dashboard" showBack={false} showNotification={true} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007BFF" />
                    <Text style={styles.loadingText}>Loading dashboard...</Text>
                </View>
            </SafeAreaView>
        );
    }
    return (
        <SafeAreaView style={styles.safe}>
            <TopBar title="Dashboard" showBack={false} showNotification={true} />

            <ScrollView
                contentContainerStyle={[styles.container]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
                }
            >
                <View style={styles.userRow}>
                    <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.avatar} />
                    <Text style={styles.welcome}>Welcome, {user?.username || 'User'}!</Text>
                </View>

                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                >
                    {displaySummaryCards.map((item, index) => (
                        <View
                            key={`${item.id}-${index}`}
                            style={[styles.carouselCard, { width: screenWidth - 16 }]} // FULL WIDTH
                        >
                            <View style={styles.carouselHeader}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.viewMore}>View More</Text>
                            </View>
                            <View style={styles.cardRow}>
                                {item.items.map((info, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.cardItem, { backgroundColor: info.bgColor }]}
                                        onPress={() => {
                                            if (info.label === 'Total Orders' || info.label === 'Total Repairs') {
                                                handleSummaryCardPress(info.label);
                                            } else {
                                                handleMaterialPress(idx);
                                            }
                                        }}
                                    >
                                        {/* ICON + VALUE */}
                                        <Text style={[styles.cardLabel, { color: info.color }]}>{info.label}</Text>
                                        <View style={styles.cardValueContainer}>
                                            <Icon name={info.icon || 'clipboard-check'} size={24} color={info.color} />
                                            <Text style={[styles.cardValue, { color: info.color }]}>{info.value}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>



                <View style={styles.dots}>
                    {displaySummaryCards.map((_, index) => (
                        <View
                            key={index}
                            style={[styles.dot, activeSlide === index && styles.dotActive]}
                        />
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Today</Text>
                {displayAgendaItems.length > 0 ? (
                    <AgendaCard item={displayAgendaItems[0]} navigation={navigation} />
                ) : (
                    <Text style={styles.emptyMessage}>No orders or repairs for today</Text>
                )}

                <Text style={styles.sectionTitle}>This week agenda</Text>
                {displayAgendaItems.length > 1 ? (
                    displayAgendaItems.filter(item => item && item.title).slice(1).map((item, i) => (
                        <AgendaCard item={item} key={i} navigation={navigation} />
                    ))
                ) : (
                    <Text style={styles.emptyMessage}>No upcoming orders or repairs this week</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default UserDashboard;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
        width: screenWidth,
        height: screenHeight,
    },
    container: {
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    userRow: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 5,
    },
    avatar: {
        width: 41,
        height: 41,
        borderRadius: 21,
        marginRight: 10,
    },
    welcome: {
        fontSize: 16,
        fontWeight: '400',
    },
    carouselCard: {
        backgroundColor: '#fff',
        marginHorizontal: 8,
        borderRadius: 10,
        padding: 16,
        marginTop: 8,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    carouselHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    cardTitle: { fontSize: 14, fontWeight: '600', color: "#292A2D", },
    viewMore: { fontSize: 12, color: '#007CFF', fontWeight: '400' },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardItem: {
        flex: 1,
        height: 75,
        marginHorizontal: 4,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cardLabel: { fontSize: 12, color: '#333' },
    cardValueContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5, justifyContent: 'center', gap: 5, },
    cardValue: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ccc',
        marginHorizontal: 4,
    },
    dotActive: {
        backgroundColor: '#007BFF',
        width: 10,
        height: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 500,
        color: '#242424',
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    agendaCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginHorizontal: 16,
        padding: 16,
        marginBottom: 14,

        // iOS shadow
        shadowColor: '#494949',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1, // ~1A in hex = 10% opacity
        shadowRadius: 10, // Approx for 20px blur

        // Android shadow
        elevation: 6, // Tweak as needed to match shadow intensity
    },

    agendaTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    agendaTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
    agendaDate: { fontSize: 14, fontWeight: '400', color: '#878787' },
    agendaId: { fontSize: 12, color: '#0067C8', marginVertical: 4, fontWeight: '400' },
    dueText: { fontSize: 14, fontWeight: 400, color: '#D10000', marginTop: 4, },
    agendaActions: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    statusText: { fontSize: 14, fontWeight: '400' },
    detailsBtn: {
        backgroundColor: '#007BFF',
        height: 34,
        width: 130,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailsText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '400',
    },
    emptyMessage: {
        textAlign: 'center',
        color: '#888',
        fontSize: 14,
        fontStyle: 'italic',
        marginVertical: 10,
        marginHorizontal: 16,
    },
});
