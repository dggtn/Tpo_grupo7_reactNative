// gymApp/screens/HistorialScreen.js
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Modal,
  Pressable,
  TextInput
} from "react-native";
import { useSelector } from "react-redux";
import { selectToken } from "../../store/slices/authSlice";
import { Button } from "react-native-paper";
import StarRating from 'react-native-star-rating-widget';
import { showSuccessToast, } from "../../utils/toastUtils";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

export default function HistorialScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [selectedCourse, setSelectedCourse] = useState({})
  

  // 👉 token desde Redux (igual que en MisReservas / Checkin / DetalleCurso)
  const token = useSelector(selectToken);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_URL}/reservations/history`, { headers });

      const payload = await safeJson(res);
      if (!res.ok) throw new Error(payload?.message || `Error ${res.status}`);

      const lista = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      setItems(lista);
    } catch (e) {
      const msg = (e?.message || "").toLowerCase();
      // No mostrar alerta si simplemente no hay historial
      if (
        !msg.includes("no hay historial") &&
        !msg.includes("no hay asistencias")
      ) {
        Alert.alert("Historial", e.message || "No se pudo cargar el historial");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, []);

  const openModal = (course) => {
    setRating(0)
    setComment("")
    setSelectedCourse(course)
    setModalOpen(true)
  }

  const calificarCurso = async () => {

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', }
    const endpoint = `${API_URL}/shifts/${selectedCourse.shiftId}/rating`
    const body = {
      rating: rating,
      comment: comment
    }

    fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(rta => {
      const item = items.find(item => item.shiftId == selectedCourse.shiftId)
      item.rating = rta.data

      setItems((lista) => lista.map(i => i.shiftId === item.shiftId ? item : i));
      showSuccessToast('Calificación exitosa', 'Gracias por compartir tu opinión')
    })
  }

  const renderItem = ({ item }) => {
    console.log(item)
    const nombreCurso = item?.nombreCurso ?? "Curso";
    const estado = item?.estadoReserva ?? "N/D";
    const diaClase = item?.diaClase ?? null;
    const sede = item?.sede ?? null;
    const calificado = !!item?.rating

    return (
      
      <View style={styles.card}>
        <Text style={styles.curso}>{nombreCurso}</Text>
        {diaClase ? (
          <Text style={styles.linea}>Día / Horario: {diaClase}</Text>
        ) : null}
        {sede ? <Text style={styles.linea}>Sede: {sede}</Text> : null}
        <Text style={[styles.linea, styles.estado]}>Estado: {estado}</Text>
        {calificado && <Text style={[styles.linea, styles.estado]}>Tu calificación: {item.rating.valor}</Text> }
        {!calificado && <Button onPress={() => openModal(item)} style={[styles.button, styles.buttonClose]}>Calificar</Button>}
      </View>
    );
  };

  if (loading && items.length === 0) {
    return <ActivityIndicator style={{ marginTop: 24 }} />;
  }

  return (
    <View style={styles.vista}>
      <FlatList        
        data={items ?? []}
        keyExtractor={(it, idx) => String(it?.reservationId ?? idx)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Todavía no tenés historial de asistencias.
          </Text>
        }
        contentContainerStyle={
          (items ?? []).length === 0
            ? { flexGrow: 1, justifyContent: "center" }
            : null
        }
      />
      <Modal
        transparent={true}
        visible={modalOpen}>
          <View style={styles.centered}>
              <View style={styles.modalView}>
                <Text>¿Que te pareció la clase {selectedCourse.nombreCurso}?</Text>
                <StarRating 
                  rating={rating} 
                  onChange={(rating) => {setRating(rating)}}
                  step="full"/>
              <TextInput
                        style={styles.input}
                        onChangeText={(comment)=>setComment(comment)}
                        value={comment}
                        placeholder="agrega comentario"
                        placeholderTextColor="#000000"
                      />
                  
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => setModalOpen(!modalOpen)}>
                   <Text style={styles.textStyle}>Cerrar</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => {
                    calificarCurso()
                    setModalOpen(!modalOpen)
                    }}>
                   <Text >Calificar</Text>
                </Pressable>
              </View>
          </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor:"#D2FCFC",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  curso: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0e6c5e",
    marginBottom: 4,
  },
  linea: {
    fontSize: 14,
    color: "#444",
  },
  estado: {
    marginTop: 4,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 16,
    color: "#666",
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input:{
    borderColor:"#274DF5",
    borderWidth:3,
    borderRadius:20,
    padding:3,
    marginBottom:6,
    marginTop:3

  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop:4,
    marginBottom:4

  },
  buttonClose: {
   backgroundColor: "skyblue",
  },
  vista:{
    flex: 1 ,
    backgroundColor: "linear-gradient(120deg, rgba(255, 156, 117, 1) 0%, rgba(163, 235, 226, 1) 100%);",
  }
});
