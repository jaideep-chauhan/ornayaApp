import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = 'https://api.ornaaya.com';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentRoom = null;
        this.connectionPromise = null;
    }

    async connect() {
        // If already connecting, wait for that connection
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        // If already connected, return true
        if (this.socket && this.isConnected) {
            console.log('Socket already connected');
            return true;
        }

        this.connectionPromise = this._doConnect();
        const result = await this.connectionPromise;
        this.connectionPromise = null;
        return result;
    }

    async _doConnect() {
        try {
            const tokenData = await AsyncStorage.getItem('token');
            if (!tokenData) {
                console.error('No token found for socket connection');
                return false;
            }

            const { accessToken } = JSON.parse(tokenData);
            console.log('Connecting to socket with token:', accessToken ? 'Present' : 'Missing');

            // Disconnect any existing socket
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }

            return new Promise((resolve) => {
                this.socket = io(SOCKET_URL, {
                    auth: {
                        token: accessToken
                    },
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                });

                // Set up a timeout for connection
                const connectionTimeout = setTimeout(() => {
                    console.error('Socket connection timeout');
                    resolve(false);
                }, 5000);

                this.socket.on('connect', () => {
                    console.log('Socket connected successfully');
                    this.isConnected = true;
                    clearTimeout(connectionTimeout);
                    
                    // Rejoin room if we had one
                    if (this.currentRoom) {
                        console.log('Rejoining room after reconnect:', this.currentRoom);
                        this.socket.emit('join_order_chat', this.currentRoom);
                    }
                    
                    resolve(true);
                });

                this.socket.on('disconnect', (reason) => {
                    console.log('Socket disconnected:', reason);
                    this.isConnected = false;
                });

                this.socket.on('connect_error', (error) => {
                    console.error('Socket connection error:', error.message);
                    this.isConnected = false;
                    clearTimeout(connectionTimeout);
                    resolve(false);
                });
            });
        } catch (error) {
            console.error('Error connecting socket:', error);
            return false;
        }
    }

    joinOrderChat(orderId) {
        this.currentRoom = orderId;
        if (this.socket && this.isConnected) {
            this.socket.emit('join_order_chat', orderId);
            console.log(`Joining order chat room: ${orderId}`);
        } else {
            console.error(`Cannot join room - not connected. OrderId: ${orderId}. Will join when connected.`);
        }
    }

    leaveOrderChat(orderId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leave_order_chat', orderId);
            console.log(`Left order chat: ${orderId}`);
        }
    }

    sendMessage(orderId, message, imageUrl = null) {
        if (this.socket && this.isConnected) {
            const messageData = {
                orderId: String(orderId), // Ensure orderId is a string
                message: message.trim(),
                imageUrl
            };
            console.log('Emitting send_message event:', messageData);
            this.socket.emit('send_message', messageData);
        } else {
            console.error('Cannot send message - socket not connected:', {
                socket: !!this.socket,
                isConnected: this.isConnected
            });
        }
    }

    startTyping(orderId, userName) {
        if (this.socket && this.isConnected) {
            this.socket.emit('typing_start', { orderId, userName });
        }
    }

    stopTyping(orderId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('typing_stop', { orderId });
        }
    }

    markAsRead(orderId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('mark_as_read', { orderId });
        }
    }

    onNewMessage(callback) {
        if (this.socket) {
            this.socket.on('new_message', callback);
        }
    }

    onUserTyping(callback) {
        if (this.socket) {
            this.socket.on('user_typing', callback);
        }
    }

    onUserJoined(callback) {
        if (this.socket) {
            this.socket.on('user_joined', callback);
        }
    }

    onMessagesRead(callback) {
        if (this.socket) {
            this.socket.on('messages_read', callback);
        }
    }

    onMessageError(callback) {
        if (this.socket) {
            this.socket.on('message_error', callback);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    removeAllListeners() {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }
}

export default new SocketService();