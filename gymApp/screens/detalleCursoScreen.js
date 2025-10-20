import { ActivityIndicator, Text, View, StyleSheet,ScrollView } from "react-native";
import { useEffect, useState } from "react";
import MapView from "react-native-maps";
import { Marker } from "react-native-maps";

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
        <ScrollView>
          <View style={styles.container}>
            <Text style={styles.item}>Curso: {detalleCursos.name}</Text>
            <Text style={styles.item}>
              Fecha de inicio: {detalleCursos.fechaInicio}
            </Text>
            <Text style={styles.item}>Fecha fin: {detalleCursos.fechaFin}</Text>
            <Text style={styles.item}>Duración: {detalleCursos.length}</Text>
            <Text style={styles.item}>Precio: {detalleCursos.price}</Text>
            <Text style={styles.item}>
              Profesor: {detalleCursos.teachers.name}
            </Text>
            <Text style={styles.item}>
              Ubicacion: {detalleCursos.shifts[0].clase.sedes[0].address}
            </Text>
            <Text style={styles.item}>Ubicacion en el mapa:</Text>

            <MapView style={{ width: "100%", height: 300 }}>
              <Marker
                coordinate={{
                  longitude:
                    detalleCursos.shifts[0].clase.sedes[0].location.lenght,
                  latitude:
                    detalleCursos.shifts[0].clase.sedes[0].location.latitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
              />
            </MapView>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginTop: 10,
    marginRight: 20,
    marginLeft: 20,
  },
  item: {
    fontSize: 25,
    borderRadius: 10,
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#0e6c5eff",
  },
});
