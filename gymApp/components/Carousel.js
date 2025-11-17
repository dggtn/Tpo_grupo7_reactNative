import { FlatList, View, Text, Dimensions, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const data = [
  { id: "1", text: "Ahora tus clases empiezan más temprano" },
  { id: "2", text: "Ahora tus clases empiezan cuando quieras" },
  { id: "3", text: "Ahora tus clases empiezan como quieras"  },
];

const { width } = Dimensions.get("window");

const Carousel = () => {
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <LinearGradient
        colors={["#71c9efff", "#e99a84ff", "#f1dca0ff"]}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.text}>{item.text}</Text>
      </LinearGradient>
    </View>
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      contentContainerStyle={styles.contentContainer}
    />
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    width: 350, 
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  gradientContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  text: {
    fontSize: 20, 
    fontWeight: "bold",
    color: "#f0f8ff",
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  contentContainer: {
    paddingVertical: 10,
    height:200
  },
});

export default Carousel;
