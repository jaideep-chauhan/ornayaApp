import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import UserDashBoard from '../screens/home/UserDashBoard';
import TaskList from '../screens/tasks/TaskList';
import RepairList from '../screens/repairList/RepairList';
import Settings from '../screens/setting/Settings';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {

    return (
        <View style={{ flex: 1, }}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused }) => {
                        let iconName;
                        switch (route.name) {
                            case 'Home':
                                iconName = 'home';
                                break;
                            case 'Order List':
                                iconName = 'clipboard';
                                break;
                            case 'Repair List':
                                iconName = 'tool';
                                break;
                            case 'Setting':
                                iconName = 'settings';
                                break;
                            case 'Debug':
                                iconName = 'info';
                                break;
                        }
                        return (
                            <Icon
                                name={iconName}
                                size={24}
                                color={focused ? '#007BFF' : '#333'}
                            />
                        );
                    },
                    tabBarActiveTintColor: '#007BFF',
                    tabBarInactiveTintColor: '#333',
                    tabBarStyle: {
                        backgroundColor: '#F5F5F5',
                        height: 70,
                        borderTopLeftRadius: 30,
                        borderTopRightRadius: 30,
                        borderWidth: 1,
                        borderColor: '#00B4D8',
                        marginHorizontal: 8,
                        marginBottom: 6,
                        position: 'absolute',
                        elevation: 5,
                        shadowColor: '#000',
                        shadowOpacity: 0.1,
                        shadowOffset: { width: 0, height: -1 },
                        shadowRadius: 5,
                        overflow: 'hidden',
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '500',
                    },
                    headerShown: false,
                })}
            >
                <Tab.Screen name="Home" component={UserDashBoard} />
                <Tab.Screen name="Order List" component={TaskList} />
                <Tab.Screen name="Repair List" component={RepairList} />
                <Tab.Screen name="Setting" component={Settings} />
            </Tab.Navigator>
        </View>
    );
};

export default TabNavigator;
