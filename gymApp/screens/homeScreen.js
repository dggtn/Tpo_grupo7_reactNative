import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import CarouselComponent from "../components/carousel";

export default function HomeScreen() {
  const navigation = useNavigation();
  const url = process.env.EXPO_PUBLIC_API_URL;

  const [isLoading, setLoading] = useState(true);
  const [cursos, setCursos] = useState([]);

  const getCursos = async () => {
    try {
      const response = await fetch(url + "/courses/allCourses", {
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

  const Curso = ({ cursoName, disciplina, vacancy, professor, onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={styles.title}>{cursoName}</Text>
      <Text style={styles.title}>tipo: {disciplina}</Text>
      <Text style={styles.title}>cupos:{vacancy}</Text>
      <Text style={styles.title}>profe: {professor}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <View>
        <View>
        <CarouselComponent style={styles.carousel} />
      </View>
        <StatusBar />
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={cursos}
            renderItem={({ item }) => (
              <Curso
                cursoName={item.name}
                disciplina={item.sportName.sportTypeName}
                vacancy={item.shifts[0].vacancy}
                professor={item.teachers[0].name}
                onPress={() =>
                  navigation.navigate("DetalleCurso", { idCurso: item.id })
                }
              />
            )}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>
      
    </>
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
    fontSize: 32, borderRadius: 10,
    justifyContent: "center",
    fontWeight: "bold",
    fontStyle: "italic",    
    alignItems: "center",
  },
});
