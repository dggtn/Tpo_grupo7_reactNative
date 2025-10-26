import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import CarouselComponent from "../components/Carousel";
import Dropdown from "../components/DropdownComponent";

export default function HomeScreen() {

  const navigation = useNavigation();
  const url = process.env.EXPO_PUBLIC_API_URL;

  const [isLoading, setLoading] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [disciplina, setDisciplina] = useState([]);



  const getSedes = async () => {
    try {
      const response = await fetch(url + "/headquarters/allHeadquarters", {
        method: "GET",
      });

      const json = await response.json();
      setSedes(json.data.map((sede) => ({ label: sede.name, value: sede.id })));
    } catch (error) {
      console.log("ERROR, ", error);
    } finally {
      setLoading(false);
    }
  };
   const getDisciplina = async () => {
    try {
      const response = await fetch(url + "/sports/allSports", {
        method: "GET",
      });

      const json = await response.json();
      setDisciplina(json.data.map((sport) => ({ label: sport.sportTypeName, value: sport.id })));
    } catch (error) {
      console.log("ERROR, ", error);
    } finally {
      setLoading(false);
    }
  };


  const getCursos = async () => {
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

  const horario = [
    {label: "8:00", value: "8:00"},
    {label: "9:00", value: "9:00"},
    {label: "10:00", value: "10:00"},
    {label: "11:00", value: "11:00"},
    {label: "12:00", value: "12:00"},
    {label: "13:00", value: "13:00"},
    {label: "14:00", value: "14:00"},
    {label: "15:00", value: "15:00"},
    {label: "16:00", value: "16:00"},
    {label: "17:00", value: "17:00"},
    {label: "18:00", value: "18:00"},
    {label: "19:00", value: "19:00"},
    {label: "20:00", value: "20:00"}
  ];


  useEffect(() => {
    getCursos();
    getSedes();
    getDisciplina();
  }, []);

  const Curso = ({ sede, nombreClase, horario, tipoDeporte, onPress }) => (
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
     <ScrollView style={styles.scrollView}>
      <View>
        <CarouselComponent style={styles.carousel} />
      </View>
      <StatusBar />
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <>
        <View style={styles.posicionDropdown}>
          <Dropdown placeholder="sede" label  ="Sede" items={sedes}  />
          <Dropdown placeholder="sport" label="Sport" items={disciplina} />
          <Dropdown placeholder="Hora" label="Hora" items={horario} />
          </View>
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
    </ScrollView>
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
  posicionDropdown:{
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-evenly",
      marginVertical: 0,
  }
});
