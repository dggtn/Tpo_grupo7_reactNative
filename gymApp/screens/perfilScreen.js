import { useEffect, useState } from 'react';
import { View, Text,StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import { useTheme } from 'react-native-paper';

export default function PerfilScreen() {
    const navigation = useNavigation()
    const url = process.env.EXPO_PUBLIC_API_URL

    const [isLoading, setLoading] = useState(true)
    const [usuario, setUsuario] = useState({})

    const getUsuario = async () => {
        try {
            const response =  await fetch(url + '/user/' + {id}, {
                method: 'GET'
            })

            const json = await response.json()
            setUsuario(json.data)
        } catch(error) {
            console.log("ERROR, ", error)
        } finally {
            setLoading(false)
        }
    }
    return (
        <View style={styles.container}>
          <Text style={styles.title}>MI PERFIL</Text>
            <Text style={styles.subtitle}>Nombre: {usuario.name}</Text>
            <Text style={styles.subtitle}>Mail: {usuario.email}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b35cbdff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    fontSize: 32,
    borderRadius: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 20,
    color: "#fff",
  },
    subtitle: {
    fontSize: 32,
    fontWeight: "bold",
    fontStyle: "italic",
    marginBottom: 20,
    color: "#fff",
  }
});