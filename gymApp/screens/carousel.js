import { FlatList, View, Text, Dimensions, StyleSheet } from "react-native";
const { width: windowWidth } = Dimensions.get("window");
const ITEM_WIDTH = windowWidth * 0.8;

const data = [
  { id: "1", text: "Ahora tus clases empiezan mas temprano" },
  { id: "2", text: "PROMO 2X1" },
  { id: "3", text: "Semana del amigo" },
];

const CarouselComponent = () => {
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.text}</Text>
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
      snapToInterval={ITEM_WIDTH}
      decelerationRate="fast"
      contentContainerStyle={styles.contentContainer}
    />
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    width: ITEM_WIDTH,
    height: 200,
    backgroundColor: "#7dad95ff",
    borderRadius: 10,
    justifyContent: "center",
    fontSize: 150,
    fontWeight: "bold",
    fontStyle: "italic",    
    alignItems: "center",
    marginHorizontal: windowWidth * 0.05,
    contentContainer: {
      paddingHorizontal: windowWidth * 0.1,
      borderRadius: 10,
      fontSize: 150,
      fontWeight: "bold",
      fontStyle: "italic",
      color: "#fff",
      textAlign: "center",
    },
  },
});

export default CarouselComponent;
