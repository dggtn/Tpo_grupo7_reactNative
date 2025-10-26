import { useState,} from "react";
import { StyleSheet, Text, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

function DropdownComponent({items,placeholder,label, onValueChange}) {
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);  

  const renderLabel = () => {
    if (value || isFocus) {
      return (
        <Text style={[styles.label, isFocus && { color: "blue" }]}>{label}</Text>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {renderLabel()}
      <Dropdown
        style={[styles.dropdown, isFocus && { borderColor: "blue" }]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={items}
        search
        maxHeight={300}
        labelField="label" 
        valueField="value"
        placeholder={!isFocus ? placeholder : "..."}
        value={value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={(item) => {
          setValue(item.value);
          setIsFocus(false);
          onValueChange(item.value);
        }}
      />
    </View>
  );
}

export default DropdownComponent;

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  dropdown: {
    width: 110,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 3,
    borderColor: "skyblue",
    borderWidth: 1,
    height: 40,
    paddingHorizontal: 8,
    backgroundColor: "skyblue",
    justifyContent: "center",
    fontFamily: "Arial",
    fontStyle: "italic",
    color: "white",
    fontWeight: "bold",
  },
  icon: {
    marginRight: 5,
  },
  label: {
    backgroundColor: "skyblue",
    top: 8,
    zIndex: 999,
    fontSize: 10,
    borderRadius: 3,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});
