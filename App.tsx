import { View, Text } from 'react-native'
import React from 'react'
import LoginScreen from './src/screens/Auth/LoginScreen'
import "./global.css"
import SignupScreen from './src/screens/Auth/SignupScreen'
import PricingScreen from './src/screens/pricing/PricingScreen'
import SubscriptionModal from './src/components/modals/SubscriptionModal'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen'

const stack = createNativeStackNavigator();

const Navigator = ()=>(
  <NavigationContainer>
    <stack.Navigator 
    screenOptions={{headerShown:false}}>
    <stack.Screen name='Onboarding' component={OnboardingScreen}/>
    <stack.Screen name='Login' component={LoginScreen}/>
    <stack.Screen name='Signup' component={SignupScreen}/>
    <stack.Screen name='Pricing' component={PricingScreen}/>
  </stack.Navigator>
  </NavigationContainer>
)

export default function App() {
  return (
    <View className=' flex-1 '>
      <Navigator/>
    </View>
  )
}