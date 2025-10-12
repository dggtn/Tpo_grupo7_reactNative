import {createStaticNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import CursosScreen from './gymApp/screens/cursosScreen';
import DetalleCurso from './gymApp/screens/detalleCursoScreen';
import HomeScreen from './gymApp/screens/homeScreen';
import { PaperProvider } from 'react-native-paper';
import Footer from './gymApp/screens/footer';
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
  return (
    <PaperProvider>
     <Navigation />
    </PaperProvider>
  );
}

;
