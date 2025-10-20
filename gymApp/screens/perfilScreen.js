import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

const PerfilScreen = () => {
  const [text, onChangeText] = useState("edita o agrega tu nombre");
  const [text2, onChangeText2] = useState("edita o agrega tu email");
  const navigation = useNavigation();
  const url = process.env.EXPO_PUBLIC_API_URL;

  const [isLoading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState({});

  const getUsuario = async () => {
    try {
      const response = await fetch(url + "/user/" + { id }, {
        method: "GET",
      });

      const json = await response.json();
      setUsuario(json.data);
    } catch (error) {
      console.log("ERROR, ", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
   
    <SafeAreaProvider>
      <SafeAreaView>
        <Text style={styles.title}>Perfil</Text>
        <TextInput
          style={styles.input}
          onChangeText={onChangeText}
          value={text}
          placeholder="edita o agrega tu nombre"
        />
        <TextInput
          style={styles.input}
          onChangeText={onChangeText2}
          value={text2}
          placeholder="edita o agrega tu email"
        />
      </SafeAreaView>
    </SafeAreaProvider>
  </View>
  );
};

export default PerfilScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#b35cbdff",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    fontSize: 32,
    borderRadius: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 20,
    color: "#e2dcebff",
    marginBottom: 30,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: "bold",
    fontStyle: "italic",
    marginBottom: 20,
    color: "#e2dcebff",
    
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    borderColor: "#ecdae8ff",
    borderStyle: "solid",
    borderRadius: 10,
    padding: 10,
    color: "#e2dcebff",
    fontSize: 15,
    fontWeight: "bold",
    fontStyle: "italic",
  },
});
