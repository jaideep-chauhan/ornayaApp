import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
    Modal,
    Alert,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'react-native-image-picker';
import { apiGet, apiPost, apiPut } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import socketService from '../services/socketService';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';

const OrderChat = ({ orderId, currentUserType = 'manufacture' }) => {
    const { theme } = useTheme();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [viewImageUrl, setViewImageUrl] = useState(null);
    const [typingUsers, setTypingUsers] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const flatListRef = useRef(null);
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState('');
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        let mounted = true;

        const initializeChat = async () => {
            await getUserInfo();
            await fetchMessages();
            
            // Connect to socket
            console.log('Initializing socket connection...');
            const connected = await socketService.connect();
            console.log('Socket connection result:', connected);
            
            if (connected && mounted) {
                setIsConnected(true);
                
                // Remove any existing listeners first
                socketService.removeAllListeners();
                
                // Set up socket event listeners BEFORE joining room
                socketService.onNewMessage((message) => {
                    console.log('Received new message via socket:', message);
                    if (mounted && message) {
                        setMessages(prev => {
                            console.log('Previous messages:', prev.length);
                            // Check if message already exists to avoid duplicates
                            const exists = prev.some(m => 
                                m.id === message.id || 
                                (m.message === message.message && 
                                 m.sender_id === message.sender_id && 
                                 Math.abs(new Date(m.created_at) - new Date(message.created_at)) < 1000)
                            );
                            
                            if (exists) {
                                console.log('Message already exists, skipping');
                                return prev;
                            }
                            
                            const updated = [...prev, message];
                            console.log('Updated messages:', updated.length);
                            return updated;
                        });
                        // Auto-scroll to bottom for new messages
                        setTimeout(() => {
                            flatListRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                    }
                });

                socketService.onUserTyping(({ userId, userName, isTyping }) => {
                    if (mounted) {
                        setTypingUsers(prev => ({
                            ...prev,
                            [userId]: isTyping ? userName : undefined
                        }));
                        
                        // Remove typing indicator after 3 seconds
                        if (isTyping) {
                            setTimeout(() => {
                                setTypingUsers(prev => {
                                    const updated = { ...prev };
                                    delete updated[userId];
                                    return updated;
                                });
                            }, 3000);
                        }
                    }
                });

                socketService.onMessagesRead(({ orderId: readOrderId, userId: readUserId }) => {
                    if (mounted && readOrderId === orderId) {
                        // Update read status for messages from this user
                        setMessages(prev => prev.map(msg => 
                            msg.sender_id === readUserId ? { ...msg, is_read: true } : msg
                        ));
                    }
                });

                socketService.onMessageError(({ error }) => {
                    Toast.show({
                        type: 'error',
                        text1: 'Message Error',
                        text2: error
                    });
                });
                
                // Join the room AFTER setting up listeners
                console.log('Joining order chat room:', orderId);
                socketService.joinOrderChat(orderId);
                
            } else if (!connected) {
                console.error('Failed to connect to socket');
                setIsConnected(false);
            }
        };

        initializeChat();

        return () => {
            mounted = false;
            socketService.leaveOrderChat(orderId);
            socketService.removeAllListeners();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [orderId]);

    const getUserInfo = async () => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserId(user.id || user.user_id);
                setUserName(`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User');
            }
        } catch (error) {
            console.error('Error getting user info:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await apiGet(`comments/order/${orderId}`);
            if (response && response.ok && response.data) {
                setMessages(response.data.data || response.data || []);
                // Mark messages as read
                if (isConnected) {
                    socketService.markAsRead(orderId);
                } else {
                    await apiPut(`comments/order/${orderId}/read`);
                }
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchMessages();
    };

    const sendMessage = async () => {
        if (!newMessage.trim() && !selectedImage) {
            return;
        }

        setSending(true);
        try {
            // If connected via socket, use socket for real-time messaging
            if (isConnected && !selectedImage) {
                console.log('Sending message via socket:', newMessage.trim());
                socketService.sendMessage(orderId, newMessage.trim());
                setNewMessage('');
                setSending(false); // Reset sending state immediately for socket
                // Message will be added to the list via socket event
                return; // Exit early for socket messages
            } else {
                // Fall back to HTTP API if not connected or if sending image
                const formData = new FormData();
                formData.append('message', newMessage.trim());
                
                if (selectedImage) {
                    formData.append('image', {
                        uri: selectedImage.uri,
                        type: selectedImage.type || 'image/jpeg',
                        name: selectedImage.fileName || 'photo.jpg',
                    });
                }

                const response = await apiPost(`comments/order/${orderId}`, formData);
                
                if (response && response.ok) {
                    setNewMessage('');
                    setSelectedImage(null);
                    if (!isConnected) {
                        await fetchMessages();
                    }
                    // Scroll to bottom after sending
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                } else {
                    Toast.show({
                        type: 'error',
                        text1: 'Failed to send message',
                        text2: 'Please try again',
                    });
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to send message',
            });
        } finally {
            setSending(false);
        }
    };

    const pickImage = () => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 0.8,
        };

        Alert.alert(
            'Select Image',
            'Choose from where you want to select an image',
            [
                { text: 'Camera', onPress: () => openCamera(options) },
                { text: 'Gallery', onPress: () => openGallery(options) },
                { text: 'Cancel', style: 'cancel' },
            ],
        );
    };

    const openCamera = (options) => {
        ImagePicker.launchCamera(options, handleImageResponse);
    };

    const openGallery = (options) => {
        ImagePicker.launchImageLibrary(options, handleImageResponse);
    };

    const handleImageResponse = (response) => {
        if (response.didCancel || response.error) {
            return;
        }
        if (response.assets && response.assets[0]) {
            setSelectedImage(response.assets[0]);
        }
    };

    const removeSelectedImage = () => {
        setSelectedImage(null);
    };

    const openImageViewer = (imageUrl) => {
        setViewImageUrl(imageUrl);
        setImageModalVisible(true);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        
        // Calculate difference in milliseconds
        const diffMs = now - date;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        // Less than a minute ago
        if (diffSeconds < 60) {
            return 'Just now';
        }
        // Less than an hour ago
        else if (diffMinutes < 60) {
            return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
        }
        // Less than 24 hours ago - show time
        else if (diffHours < 24) {
            // Check if it's the same day
            const isToday = date.toDateString() === now.toDateString();
            if (isToday) {
                return date.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                });
            } else {
                return 'Yesterday';
            }
        }
        // Yesterday
        else if (diffDays === 1) {
            return 'Yesterday';
        }
        // Less than a week ago
        else if (diffDays < 7) {
            return `${diffDays} days ago`;
        }
        // Older messages
        else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    };

    const renderMessage = ({ item, index }) => {
        const isOwnMessage = item.sender_type === currentUserType;
        const showDateHeader = index === 0 || 
            new Date(messages[index - 1].created_at).toDateString() !== 
            new Date(item.created_at).toDateString();

        return (
            <>
                {showDateHeader && (
                    <View style={styles.dateHeader}>
                        <View style={styles.dateHeaderContainer}>
                            <View style={styles.dateHeaderLine} />
                            <Text style={styles.dateHeaderText}>
                                {new Date(item.created_at).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </Text>
                            <View style={styles.dateHeaderLine} />
                        </View>
                    </View>
                )}
                <View style={[
                    styles.messageContainer,
                    isOwnMessage ? styles.ownMessage : styles.otherMessage
                ]}>
                    <View style={[
                        styles.messageBubble,
                        isOwnMessage ? styles.ownBubble : styles.otherBubble
                    ]}>
                        {!isOwnMessage && (
                            <View style={styles.senderHeader}>
                                <View style={styles.avatarContainer}>
                                    <MaterialIcon name="account-circle" size={16} color={COLORS.textSecondary} />
                                </View>
                                <Text style={styles.senderName}>
                                    {item.sender_name}
                                </Text>
                                <View style={styles.roleTag}>
                                    <Text style={styles.roleText}>{item.sender_role}</Text>
                                </View>
                            </View>
                        )}
                        
                        {item.message && (
                            <Text style={[
                                styles.messageText,
                                isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                            ]}>
                                {item.message}
                            </Text>
                        )}
                        
                        {item.image_url && (
                            <TouchableOpacity onPress={() => openImageViewer(item.image_url)}>
                                <Image 
                                    source={{ uri: item.image_url }} 
                                    style={styles.messageImage}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        )}
                        
                        <View style={styles.messageFooter}>
                            <Text style={[
                                styles.messageTime,
                                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
                            ]}>
                                {formatTime(item.created_at)}
                            </Text>
                            {isOwnMessage && (
                                <Icon 
                                    name={item.is_read ? "check-circle" : "check"} 
                                    size={12} 
                                    color={item.is_read ? "#007BFF" : "#999"}
                                    style={styles.readIcon}
                                />
                            )}
                        </View>
                    </View>
                </View>
            </>
        );
    };

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <MaterialIcon name="chat-outline" size={64} color={COLORS.textLight} />
            </View>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubText}>Start the conversation to collaborate on this order</Text>
            <View style={styles.emptyFeatures}>
                <View style={styles.featureItem}>
                    <MaterialIcon name="image" size={16} color={COLORS.accent} />
                    <Text style={styles.featureText}>Share images</Text>
                </View>
                <View style={styles.featureItem}>
                    <MaterialIcon name="clock-outline" size={16} color={COLORS.accent} />
                    <Text style={styles.featureText}>Real-time messaging</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.messagesList}
                ListEmptyComponent={renderEmptyComponent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#007BFF']}
                    />
                }
                onContentSizeChange={() => {
                    if (messages.length > 0) {
                        flatListRef.current?.scrollToEnd({ animated: false });
                    }
                }}
            />
            
            {selectedImage && (
                <View style={styles.selectedImageContainer}>
                    <Image 
                        source={{ uri: selectedImage.uri }} 
                        style={styles.selectedImage}
                    />
                    <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={removeSelectedImage}
                    >
                        <Icon name="x" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}
            
            {/* Typing Indicator */}
            {Object.keys(typingUsers).length > 0 && (
                <View style={styles.typingIndicator}>
                    <View style={styles.typingDots}>
                        <View style={[styles.dot, styles.dot1]} />
                        <View style={[styles.dot, styles.dot2]} />
                        <View style={[styles.dot, styles.dot3]} />
                    </View>
                    <Text style={styles.typingText}>
                        {Object.values(typingUsers).filter(Boolean).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
                    </Text>
                </View>
            )}
            
            <View style={styles.inputContainer}>
                {/* Connection Status */}
                <View style={styles.connectionStatus}>
                    <View style={[styles.connectionDot, { backgroundColor: isConnected ? COLORS.success : COLORS.danger }]} />
                    <Text style={styles.connectionText}>
                        {isConnected ? 'Connected' : 'Offline'}
                    </Text>
                </View>
                
                <View style={styles.inputRow}>
                    <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
                        <MaterialIcon name="attachment" size={24} color={COLORS.accent} />
                    </TouchableOpacity>
                    
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type a message..."
                            placeholderTextColor={COLORS.textLight}
                            value={newMessage}
                            onChangeText={(text) => {
                                setNewMessage(text);
                                // Handle typing indicator
                                if (isConnected && text.length > 0) {
                                    if (typingTimeoutRef.current) {
                                        clearTimeout(typingTimeoutRef.current);
                                    }
                                    socketService.startTyping(orderId, userName);
                                    typingTimeoutRef.current = setTimeout(() => {
                                        socketService.stopTyping(orderId);
                                    }, 1000);
                                }
                            }}
                            multiline
                            maxHeight={100}
                        />
                    </View>
                    
                    <TouchableOpacity 
                        style={[
                            styles.sendButton,
                            (!newMessage.trim() && !selectedImage) && styles.sendButtonDisabled
                        ]}
                        onPress={sendMessage}
                        disabled={!newMessage.trim() && !selectedImage || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={COLORS.textWhite} />
                        ) : (
                            <MaterialIcon name="send" size={20} color={COLORS.textWhite} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* Image Viewer Modal */}
            <Modal
                visible={imageModalVisible}
                transparent={true}
                onRequestClose={() => setImageModalVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.imageViewerContainer}
                    activeOpacity={1}
                    onPress={() => setImageModalVisible(false)}
                >
                    <TouchableOpacity 
                        style={styles.closeImageButton}
                        onPress={() => setImageModalVisible(false)}
                    >
                        <Icon name="x" size={28} color="#FFF" />
                    </TouchableOpacity>
                    {viewImageUrl && (
                        <Image 
                            source={{ uri: viewImageUrl }}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                    )}
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundSecondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexGrow: 1,
    },
    dateHeader: {
        alignItems: 'center',
        marginVertical: SPACING.lg,
    },
    dateHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    dateHeaderLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dateHeaderText: {
        fontSize: FONT_SIZES.xs,
        fontWeight: FONT_WEIGHTS.medium,
        color: COLORS.textSecondary,
        backgroundColor: COLORS.cardBackground,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
        marginHorizontal: SPACING.sm,
        ...SHADOWS.sm,
    },
    messageContainer: {
        marginBottom: 12,
        flexDirection: 'row',
    },
    ownMessage: {
        justifyContent: 'flex-end',
    },
    otherMessage: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '75%',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.xl,
        ...SHADOWS.sm,
    },
    ownBubble: {
        backgroundColor: COLORS.accent,
        borderBottomRightRadius: BORDER_RADIUS.sm,
    },
    otherBubble: {
        backgroundColor: COLORS.cardBackground,
        borderBottomLeftRadius: BORDER_RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    senderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    avatarContainer: {
        marginRight: SPACING.xs,
    },
    senderName: {
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.semibold,
        color: COLORS.textPrimary,
        marginRight: SPACING.xs,
    },
    roleTag: {
        backgroundColor: COLORS.accent + '15',
        paddingHorizontal: SPACING.xs,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    roleText: {
        fontSize: FONT_SIZES.xs,
        fontWeight: FONT_WEIGHTS.medium,
        color: COLORS.accent,
    },
    messageText: {
        fontSize: FONT_SIZES.md,
        lineHeight: 20,
        fontWeight: FONT_WEIGHTS.regular,
    },
    ownMessageText: {
        color: COLORS.textWhite,
    },
    otherMessageText: {
        color: COLORS.textPrimary,
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 8,
        marginTop: 8,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    messageTime: {
        fontSize: FONT_SIZES.xs,
        fontWeight: FONT_WEIGHTS.regular,
    },
    ownMessageTime: {
        color: COLORS.textWhite + '80',
    },
    otherMessageTime: {
        color: COLORS.textSecondary,
    },
    readIcon: {
        marginLeft: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: SPACING.lg,
    },
    emptyIconContainer: {
        backgroundColor: COLORS.backgroundSecondary,
        padding: SPACING.xl,
        borderRadius: BORDER_RADIUS.full,
        marginBottom: SPACING.lg,
    },
    emptyText: {
        fontSize: FONT_SIZES.xl,
        fontWeight: FONT_WEIGHTS.semibold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: SPACING.lg,
    },
    emptyFeatures: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.lg,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    featureText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontWeight: FONT_WEIGHTS.medium,
    },
    inputContainer: {
        backgroundColor: COLORS.cardBackground,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.md,
        ...SHADOWS.sm,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    connectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: SPACING.xs,
    },
    connectionText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        fontWeight: FONT_WEIGHTS.medium,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: SPACING.sm,
    },
    attachButton: {
        width: 44,
        height: 44,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: COLORS.inputBackground,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textInput: {
        minHeight: 44,
        maxHeight: 100,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZES.md,
        color: COLORS.textPrimary,
        fontWeight: FONT_WEIGHTS.regular,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.disabled,
    },
    selectedImageContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    selectedImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeImageButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '80%',
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.backgroundSecondary,
    },
    typingDots: {
        flexDirection: 'row',
        marginRight: SPACING.sm,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.accent,
        marginRight: 2,
    },
    dot1: {
        animationDelay: '0s',
    },
    dot2: {
        animationDelay: '0.1s',
    },
    dot3: {
        animationDelay: '0.2s',
    },
    typingText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        fontWeight: FONT_WEIGHTS.medium,
    },
});

export default OrderChat;