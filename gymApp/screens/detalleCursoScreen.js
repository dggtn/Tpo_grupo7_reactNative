import { ActivityIndicator, Text, View, StyleSheet, StatusBar } from "react-native";
import { useEffect, useState } from 'react';

export default function DetalleCursoScreen({route}) {

    const url = process.env.EXPO_PUBLIC_API_URL


    const [isLoading, setLoading] = useState(true)
    const [detalleCursos, setDetalleCursos] = useState({})

    const idCurso = route.params.idCurso

    const getDetalleCurso = async (idCurso) => {
        try {
            const response =  await fetch(url + '/courses/' + idCurso, {
                method: 'GET',
            })

            const json = await response.json()
            setDetalleCursos(json.data)
        } catch(error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

    }

    useEffect(() => {
        getDetalleCurso(idCurso)
    }, [])

    return (
        <View>
            {isLoading ? (
                <ActivityIndicator/>
            ) : (
                <View>
                    <Text>{detalleCursos.name}</Text>
                    <Text>{detalleCursos.sportName.sportType}</Text>
                    <Text>{detalleCursos.fechaInicio}</Text>
                    <Text>{detalleCursos.fechaFin}</Text>
                    <Text>{detalleCursos.length}</Text>
                    <Text>{detalleCursos.price}</Text>
                    <Text>{detalleCursos.teachers.name}</Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
})