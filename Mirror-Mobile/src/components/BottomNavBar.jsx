import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import React, { useState } from "react";

const tabs = [
  { id: 1, icon: "🏠", label: "Home" },
  { id: 2, icon: "🔍", label: "Buscar" },
  { id: 3, icon: "📋", label: "Pedidos" },
  { id: 4, icon: "❤️", label: "Favoritos" },
  { id: 5, icon: "👤", label: "Perfil" },
];

export default function BottomNavBar() {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <View style={{ width: "100%", alignItems: "center", justifyContent:"center", marginTop: 0 }}>
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Text
            style={[styles.icon, activeTab === tab.id && styles.iconActive]}
          >
            {tab.icon}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 5,
    paddingBottom: 5,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 25,
  },
  tab: {
    padding: 10,
    borderRadius: 25,
  },
  tabActive: {
    backgroundColor: "#C41E3A",
  },
  icon: {
    fontSize: 22,
  },
  iconActive: {
    fontSize: 22,
  },
});
