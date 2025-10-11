import {createStaticNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import CursosScreen from './gymApp/screens/cursosScreen';
import DetalleCurso from './gymApp/screens/detalleCursoScreen';
import HomeScreen from './gymApp/screens/homeScreen';
import { StyleSheet } from 'react-native';
const screens = createNativeStackNavigator({
  screens: {
    Welcome: {
      screen: HomeScreen
    },
    Cursos: {
      screen: CursosScreen
    },
    DetalleCurso: {
      screen: DetalleCurso
    }
  }
})

const Navigation = createStaticNavigation(screens)

export default function App() {
  return <Navigation/>
}

const styles = StyleSheet.create({
  container: {
    flex: 3,
    backgroundColor: '#2213afff',
    color: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
    marginTop: 50,
    marginBottom: 50,
    flexDirection: 'column',  
  },
});
