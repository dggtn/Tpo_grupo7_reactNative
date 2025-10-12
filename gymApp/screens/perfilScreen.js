import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, StatusBar, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import { useTheme } from 'react-native-paper';

export default function perfilScreen() {
    const navigation = useNavigation()
    const url = process.env.EXPO_PUBLIC_API_URL

    const [isLoading, setLoading] = useState(true)
    const [usuario, setUsuario] = useState({})

    const getUsuario = async () => {
        try {
            const response =  await fetch(url + '/user/id', {
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
        <View>
            <Text>{usuario.name}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
});