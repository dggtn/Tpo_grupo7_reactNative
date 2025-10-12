import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "./gymApp/screens/HomeScreen";
import { PaperProvider } from "react-native-paper";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import PerfilScreen from "./gymApp/screens/PerfilScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import DetalleCursoScreen from "./gymApp/screens/DetalleCursoScreen";


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Home() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialDesignIcons name="home" color={color} size={30} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialDesignIcons name="account" color={color} size={30} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function Navegaciones() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Inicio "
        component={Home}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="DetalleCurso" component={DetalleCursoScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <PaperProvider theme={{ version: 2 }}>
        <Navegaciones />
      </PaperProvider>
    </NavigationContainer>
  );
}
