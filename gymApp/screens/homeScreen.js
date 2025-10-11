import { StyleSheet, Text, View, Button } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {useNavigation} from '@react-navigation/native';

export default function WelcomeScreen() {
    const navigation = useNavigation()
    return (
        <View style={styles.container}>
            <Text>Bienvenido a gym app!</Text>
            <View style={styles.pt8}>
                <Button
                    style={styles.pt8}
                    title="Iniciar"
                    onPress={() => 
                        navigation.navigate('Cursos')
                    }
                />
            </View>
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pt8: {
        paddingTop: 24
    }
});