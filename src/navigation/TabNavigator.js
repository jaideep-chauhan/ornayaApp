import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import UserDashBoard from '../screens/home/UserDashBoard';
import TaskList from '../screens/tasks/TaskList';
import RepairList from '../screens/repairList/RepairList';
import Settings from '../screens/setting/Settings';
import { COLORS, SHADOWS } from '../constants/theme';

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
                                color={focused ? COLORS.accent : COLORS.textSecondary}
                            />
                        );
                    },
                    tabBarActiveTintColor: COLORS.accent,
                    tabBarInactiveTintColor: COLORS.textSecondary,
                    tabBarStyle: {
                        backgroundColor: COLORS.background,
                        height: 70,
                        borderTopLeftRadius: 30,
                        borderTopRightRadius: 30,
                        borderWidth: 1,
                        borderColor: COLORS.primary,
                        marginHorizontal: 8,
                        marginBottom: 6,
                        position: 'absolute',
                        ...SHADOWS.lg,
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
