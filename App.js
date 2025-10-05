import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.container}>GYM APP!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 3,
    backgroundColor: '#2213afff',
    color: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
    marginTop: 50,
  },
});
