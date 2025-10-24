import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  onPress,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import CarouselComponent from "../components/Carousel";
import Dropdown from "../components/DropdownComponent";

export default function HomeScreen() {
  const navigation = useNavigation();
  const url = process.env.EXPO_PUBLIC_API_URL;

  const [isLoading, setLoading] = useState(true);
  const [cursos, setCursos] = useState([]);

  const getCursos = async () =>  {
    try {
      const response = await fetch(url + "/shifts", {
        method: "GET",
      });

      const json = await response.json();
      setCursos(json.data);
    } catch (error) {
      console.log("ERROR, ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCursos();
  }, []);

  const Curso = ({ sede, nombreClase, horario, tipoDeporte,onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.subtitle}>
        clase:<Text style={styles.title}> {nombreClase}</Text>
      </Text>
      <Text style={styles.subtitle}>
        tipo de deporte:<Text style={styles.title}> {tipoDeporte}</Text>
      </Text>
      <Text style={styles.subtitle}>
        horario:<Text style={styles.title}> {horario}</Text>
      </Text>
      <Text style={styles.subtitle}>
        sede:<Text style={styles.title}> {sede}</Text>
      </Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <View>
        <CarouselComponent style={styles.carousel} />
      </View>
      <StatusBar />
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Dropdown />
          <FlatList
            data={cursos}
            renderItem={({ item }) => (
              <Curso
                nombreClase={item.nombreClase}
                tipoDeporte={item.tipoDeporte}
                horario={item.horario}
                sede={item.sede}
                onPress={() => {
                  console.log(item.idCurso);
                  navigation.navigate("DetalleCurso", {
                    idCurso: item.idCurso,
                  });
                }}
              />
            )}
            keyExtractor={(item) => item.idClase}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    backgroundColor: "#f9c2ff",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  title: {
    fontSize: 32,
    borderRadius: 10,
    justifyContent: "center",
    fontWeight: "bold",
    fontStyle: "italic",
    alignItems: "center",
    color: "#b3385bff",
  },

  subtitle: {
    fontSize: 22,
    borderRadius: 10,
    justifyContent: "center",
    fontWeight: "bold",
    fontStyle: "italic",
    alignItems: "center",
    color: "#3c7090ff",
  },
});