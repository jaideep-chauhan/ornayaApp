import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { store, persistor } from './src/store';
import MainNavigator from './src/navigation/MainNavigator';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { initializeNetworkListener, startPeriodicSync } from './src/services/syncService';

const App = () => {
  useEffect(() => {
    // Initialize network status listener
    const unsubscribeNetwork = initializeNetworkListener();

    // Start periodic sync (every 5 minutes)
    const unsubscribeSync = startPeriodicSync();

    // Cleanup on unmount
    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate
          loading={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#009688" />
            </View>
          }
          persistor={persistor}
        >
          <ThemeProvider>
            <MainNavigator />
            <Toast />
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
};

export default App;
