import { StyleSheet, Text, View } from "react-native";
import React from "react";

export default function TopBar() {
  return (
<View style={{ width: "100%", alignItems: "center", marginTop: 40 }}>
    <View style={styles.container}>
      <Text style={styles.title}>Bem vindo!</Text>
      <Text style={styles.subtitle}>Vamos fazer </Text>
      <Text style={styles.subtitle}>seu pedido</Text>
    </View>
    </View>
  );
}

  

const styles = StyleSheet.create({
  container: {
    width: "90%",
    height: 130,
    justifyContent: "center",
    alignItems: "flex-start", 
    backgroundColor: "#8B1C1C",
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#fff",
    fontSize: 16,
    fontStyle: "italic",
    opacity: 0.9,
  },
});
