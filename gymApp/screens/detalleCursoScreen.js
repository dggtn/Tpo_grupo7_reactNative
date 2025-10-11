import { ActivityIndicator, Text, View, StyleSheet, StatusBar } from "react-native";
import { useEffect, useState } from 'react';

export default function DetalleCurso({route}) {

    // const token = process.env.EXPO_PUBLIC_API_TOKEN
    // const url = process.env.EXPO_PUBLIC_API_URL

    const [isLoading, setLoading] = useState(true)
    const [questions, setQuestions] = useState([])

    const curso = route.params.curso

    const getDetalleCurso = async (curso) => {
        console.log(curso)
        try {
            const response =  await fetch(url + '/questions?category=' + curso, {
                method: 'GET',
                headers: {
                    'X-Api-Key': token
                }
            })

            const json = await response.json()
            setQuestions(json)

        } catch(error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

    }

    useEffect(() => {
        getDetalleCurso(curso)
    }, [])

    const CurrentCurso = () => {
        const [index, setIndex] = useState(0)
        return (
            <View>
                <Text>{questions[index].question}</Text>
            </View>
        )
    }
    return (
        <View>
            {isLoading ? (
                <ActivityIndicator/>
            ) : (
                <CurrentQuestion/>
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