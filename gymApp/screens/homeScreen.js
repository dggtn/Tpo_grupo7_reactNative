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
import { LinearGradient } from "expo-linear-gradient";
import {  useSelector } from "react-redux";
import { selectToken } from "../../store/slices/authSlice";
import { useNavigation } from "@react-navigation/native";
import CarouselComponent from "../components/Carousel";
import Dropdown from "../components/DropdownComponent";
import { API_BASE_URL } from "../../config/constants";

export default function HomeScreen() {

  const opcionTodos = {value: -1, label: 'TODOS'}

  const navigation = useNavigation();
  const url = API_BASE_URL;

  const [isLoading, setLoading] = useState(true);
  const [cursos, setCursos] = useState([]);        
  const [sedes, setSedes] = useState([opcionTodos]);          
  const [disciplinas, setDisciplinas] = useState([opcionTodos]); 
  const [horario, setHorario] = useState(null);    
  const [sedeId, setSedeId] = useState(null);
  const [disciplina, setDisciplina] = useState(null);
  const token = useSelector(selectToken);

  // --- helper: parseo seguro ---
  async function safeJson(res) {
    try {
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) return null;
      const text = await res.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  const getSedes = async () => {
    try {
      const response = await fetch(url + "/headquarters/allHeadquarters", {
        method: "GET",
         headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
 
 
      const json = await response.json();

      const sedesObtenidas = json.data.map((sede) => ({ label: sede.name, value: sede.id }))
      setSedes((original) => [...original, ...sedesObtenidas])
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
         headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
 
 
      const json = await response.json();


      const disciplinasObtenidas = json.data.map((disciplina) => ({ label: disciplina.sportTypeName, value: disciplina.id }))
      setDisciplinas((original) => [...original, ...disciplinasObtenidas])

    } catch (error) {
      console.log("ERROR, ", error);
    } finally {
      setLoading(false);
    }
  };
  //3 filtros sede,tipoDeporte,inicio .En un solo state o en 3 distintos

  const getCursos = async (endpoint) => {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
         headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
 
 
      const json = await response.json();
      setCursos(json.data);
    } catch (error) {
      console.log("ERROR, ", error);
    } finally {
      setLoading(false);
    }
  };

  const horarios = [
    { label: "TODOS", value: "-1" },
    { label: "8:00", value: "08:00" },
    { label: "9:00", value: "09:00" },
    { label: "10:00", value: "10:00" },
    { label: "11:00", value: "11:00" },
    { label: "12:00", value: "12:00" },
    { label: "13:00", value: "13:00" },
    { label: "14:00", value: "14:00" },
    { label: "15:00", value: "15:00" },
    { label: "16:00", value: "16:00" },
    { label: "17:00", value: "17:00" },
    { label: "18:00", value: "18:00" },
    { label: "19:00", value: "19:00" },
    { label: "20:00", value: "20:00" },
  ];

  // carga inicial
  useEffect(() => {
    getCursos(url + "/shifts");
    getSedes();
    getDisciplina();
  }, []);

  const cuandoSeSeleccionaSede = (id) => {
    console.log("Sede seleccionada:", id);
    setSedeId(id || null);
  };
  const cuandoSeSeleccionaDisciplina = (id) => {
    console.log("Disciplina seleccionada:", id);
    setDisciplina(id || null);
  };
  const cuandoSeSeleccionaHorario = (h) => {
    console.log("Horario seleccionado:", h);
    setHorario(h || null); // null cuando limpies el dropdown
  };


  useEffect(() => {
    let queryParameters = new URLSearchParams();
    if (sedeId && sedeId != -1) {
      console.log("Cargando cursos para la sede ID:", sedeId);
      queryParameters.append("sede", sedeId);
    }
    if (disciplina && disciplina != -1) {
      console.log("Cargando cursos para la disciplina ID:", disciplina);
      queryParameters.append("tipoDeporte", disciplina);
    }
    if (horario && horario != -1) {
      console.log("Cargando cursos para el horario:", horario);
      queryParameters.append("inicio", horario);
    }
    if (queryParameters.toString() !== "") {
      getCursos(url + "/shifts?" + queryParameters.toString());
    }
  }, [sedeId, disciplina, horario]);

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
     <LinearGradient
            colors={["#71c9efff", "#e99a84ff", "#f1dca0ff"]}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
    <View>
      <View>
        <CarouselComponent style={styles.carousel} />
      </View>
      <StatusBar />
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <>
        
          <View style={styles.posicionDropdown}>
            <Dropdown
              placeholder="sede"
              label="Sede"
              items={sedes ?? []}
              onValueChange={cuandoSeSeleccionaSede}
            />
            <Dropdown
              placeholder="sport"
              label="Sport"
              items={disciplinas ?? []}
              onValueChange={cuandoSeSeleccionaDisciplina}
            />
            <Dropdown
              placeholder="Hora"
              label="Hora"
              items={horarios}
              onValueChange={cuandoSeSeleccionaHorario}
            />
          </View>

          { (cursos?.length ?? 0) > 0 ? (
            <FlatList
              data={cursos ?? []}
              renderItem={({ item }) => (
                <Curso
                  nombreClase={item?.nombreClase}
                  tipoDeporte={item?.tipoDeporte}
                  horario={item?.horario}
                  sede={item?.sede}
                  onPress={() => {
                    if (item?.idCurso != null) {
                      navigation.navigate("DetalleCurso", { idCurso: item.idCurso });
                    }
                  }}
                />
              )}
              keyExtractor={(item, idx) => String(item?.idClase ?? idx)} // <- FIX: toString
            />
           
          ) : (
            <Text style={styles.title}>No hay cursos disponibles con esos filtros</Text>
          )}
        </>
      )}
    </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    borderWidth:1,
    borderColor:"#ffebcd",
    bordershadow:10,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    borderColor:"#ffebcd"
  },
  title: {
  fontSize: 20,
    fontWeight: 'bold',
    color: '#ffebcd',
    marginTop: 10,
  },
  subtitle: {
  fontSize: 20,
    fontWeight: 'bold',
    color: '#ffebcd',
    marginTop: 10,
  },
  posicionDropdown: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 0,
  },
});