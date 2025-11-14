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
import CarouselComponent from "../components/Carousel";
import Dropdown from "../components/DropdownComponent";

export default function HomeScreen() {
  const navigation = useNavigation();
  const url = process.env.EXPO_PUBLIC_API_URL;

  const [isLoading, setLoading] = useState(true);
  const [cursos, setCursos] = useState([]);        // siempre array
  const [sedes, setSedes] = useState([]);          // siempre array
  const [disciplinas, setDisciplinas] = useState([]); // siempre array
  const [horario, setHorario] = useState(null);    // <- FIX: antes [] (truthy) mandaba inicio=[]

  // filtros
  const [sedeId, setSedeId] = useState(null);
  const [disciplina, setDisciplina] = useState(null);

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
      const response = await fetch(url + "/headquarters/allHeadquarters", { method: "GET" });
      const json = await safeJson(response);
      const lista = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      setSedes(lista.map((sede) => ({ label: sede.name, value: sede.id })));
    } catch (error) {
      console.log("ERROR getSedes:", error);
      setSedes([]); // nunca null
    }
  };

  const getDisciplina = async () => {
    try {
      const response = await fetch(url + "/sports/allSports", { method: "GET" });
      const json = await safeJson(response);
      const lista = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      setDisciplinas(
        lista.map((sport) => ({
          label: sport.sportTypeName,
          value: sport.id,
        }))
      );
    } catch (error) {
      console.log("ERROR getDisciplina:", error);
      setDisciplinas([]); // nunca null
    }
  };

  const getCursos = async (endpoint) => {
    try {
      setLoading(true);
      const response = await fetch(endpoint, { method: "GET" });
      const json = await safeJson(response);

      if (!response.ok) {
        throw new Error(json?.message || `Error ${response.status}`);
      }

      const lista = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      setCursos(lista); // nunca null
    } catch (error) {
      console.log("ERROR getCursos:", error);
      setCursos([]); // nunca null
    } finally {
      setLoading(false);
    }
  };

  const horarios = [
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
    // pedís todo sin filtros
    getCursos(url + "/shifts");
    // en paralelo traés combos (no toco isLoading acá para no “pisar” el spinner de cursos)
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

  // recarga según filtros
  useEffect(() => {
    const qp = new URLSearchParams();
    if (sedeId) {
      console.log("Cargando cursos para la sede ID:", sedeId);
      qp.append("sede", sedeId);
    }
    if (disciplina) {
      console.log("Cargando cursos para la disciplina ID:", disciplina);
      qp.append("tipoDeporte", disciplina);
    }
    if (horario) {
      console.log("Cargando cursos para el horario:", horario);
      qp.append("inicio", horario);
    }
    // si hay filtros, filtrado; si no, lista completa
    if (qp.toString() !== "") {
      getCursos(url + "/shifts?" + qp.toString());
    } else {
      getCursos(url + "/shifts");
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
    marginTop: 40,
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
  posicionDropdown: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 0,
  },
});
