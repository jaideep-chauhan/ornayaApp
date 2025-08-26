import React from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import MainNavigator from './src/navigation/MainNavigator';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from './src/contexts/ThemeContext';

const App = () => (
  <SafeAreaProvider>
    <Provider store={store}>
      <ThemeProvider>
        <MainNavigator />
        <Toast />
      </ThemeProvider>
    </Provider>
  </SafeAreaProvider>
);

export default App;
