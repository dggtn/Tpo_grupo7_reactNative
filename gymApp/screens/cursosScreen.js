import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, StatusBar, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

export default function CursosScreen() {
    const navigation = useNavigation()
    // const token = process.env.EXPO_PUBLIC_API_TOKEN
    // const url = process.env.EXPO_PUBLIC_API_URL

    const [isLoading, setLoading] = useState(true)
    const [cursos, setCursos] = useState([])

    const getCursos = async () => {
        try {
            const response =  await fetch(url + '/courses/initializeCourses"', {
                method: 'GET',
                headers: {
                    // 'X-Api-Key': token
                }
            })

            const json = await response.json()
            console.log(json)
            setCursos(json)
        } catch(error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getCursos()        
    }, [])

    const Curso = ({cursoName, onPress}) => (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <Text style={styles.title}>{cursoName}</Text>
        </TouchableOpacity>
    )

    return (
        <View>
            {isLoading ? (
                <ActivityIndicator />
            ) : (
                <FlatList
                    data={cursos}
                    renderItem={({item}) => <Curso cursoName={item.name} onPress={() => navigation.navigate('DetalleCurso', {curso: item.name})}/> }
                    keyExtractor={item => item.id}
                />
            )}
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