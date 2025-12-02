import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../gymApp/screens/auth/LoginScreen';
import RegisterScreen from '../gymApp/screens/auth/RegisterScreen';
import VerificationScreen from '../gymApp/screens/auth/VerificationScreen';
import RecoveryScreen from '../gymApp/screens/auth/RecoveryScreen';
import ForgotPasswordScreen from '../gymApp/screens/auth/ForgotPasswordScreen'; 
import ResetPasswordVerificationScreen from '../gymApp/screens/auth/ResetPassVerifScreen';
import NewPasswordScreen from '../gymApp/screens/auth/NewPasswordScreen'; 

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="Recovery" component={RecoveryScreen} />
      
      {/* PANTALLAS DE RECUPERACIÓN DE CONTRASEÑA */}
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="ResetPasswordVerification" 
        component={ResetPasswordVerificationScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="NewPassword" 
        component={NewPasswordScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}