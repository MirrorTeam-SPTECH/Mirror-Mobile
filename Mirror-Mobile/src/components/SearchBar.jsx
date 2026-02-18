import { StyleSheet, TextInput, View } from "react-native";
import React from "react";

export default function SearchBar() {
  return (
<View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
    <View style={styles.container}>
        <TextInput  style={styles.input}
            placeholder="Buscar..."           // ✅ Funciona igual
            placeholderTextColor="#C4C4C4"       // Cor do placeholder
>
        </TextInput>
    </View>
    </View>
  );    
}

  

const styles = StyleSheet.create({
  container: {
    width: "90%",
    height: 45,
    justifyContent: "center",
    alignItems: "flex-start", 
    backgroundColor: "#ffff",
    color: "#C4C4C4",
    paddingHorizontal: 10,
    borderRadius: 15,
    marginTop: -25.
  },
  input: {
    width: "100%",
    height: "100%",
    color: "#C4C4C4",
    fontSize: 16,
    borderWidth: 0,
    outlineStyle: 'none', 
  },    
});