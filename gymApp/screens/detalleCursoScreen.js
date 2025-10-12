import {
  ActivityIndicator,
  Text,
  View,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useEffect, useState } from "react";

export default function DetalleCursoScreen({ route }) {
  const url = process.env.EXPO_PUBLIC_API_URL;

  const [isLoading, setLoading] = useState(true);
  const [detalleCursos, setDetalleCursos] = useState({});

  const idCurso = route.params.idCurso;

  const getDetalleCurso = async (idCurso) => {
    try {
      const response = await fetch(url + "/courses/" + idCurso, {
        method: "GET",
      });

      const json = await response.json();
      setDetalleCursos(json.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDetalleCurso(idCurso);
  }, []);

  return (
    <View>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.container}>
          <Text style={styles.item}>Curso: {detalleCursos.name}</Text>
          <Text style={styles.item}>Fecha de inicio: {detalleCursos.fechaInicio}</Text>
          <Text style={styles.item}>Fecha fin: {detalleCursos.fechaFin}</Text>
          <Text style={styles.item}>Duración: {detalleCursos.length}</Text>
          <Text style={styles.item}>Precio: {detalleCursos.price}</Text>
          <Text style={styles.item}>Profesor: {detalleCursos.teachers.name}</Text>
          <Text style={styles.item}>Ubicacion: {detalleCursos.shifts[0].clase.sedes[0].address}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding:10,
    marginTop: 10,
    marginRight:20,
    marginLeft:20,

  },
  item: {
    fontSize: 30,
    borderRadius: 10,
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#0e6c5eff",
  },
});
