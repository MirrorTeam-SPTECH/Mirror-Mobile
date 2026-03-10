import { StyleSheet, View, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const tabs = [
  { id: 1, iconName: "home", label: "Home", screen: "Home" },
  { id: 2, iconName: "magnify", label: "Buscar", screen: null },
  { id: 3, iconName: "clipboard-text-outline", label: "Pedidos", screen: null, requiresAuth: true },
  { id: 4, iconName: "heart-outline", label: "Favoritos", screen: null, requiresAuth: true },
  { id: 5, iconName: "account-outline", label: "Perfil", screen: "Profile", requiresAuth: true },
];

export default function BottomNavBar() {
  const [activeTab, setActiveTab] = useState(1);
  const navigation = useNavigation();
  const { isLoggedIn } = useAuth();

  const handleTabPress = (tab) => {
    setActiveTab(tab.id);

    if (tab.requiresAuth && !isLoggedIn) {
      navigation.navigate("Login");
      return;
    }

    if (tab.screen) {
      navigation.navigate(tab.screen);
    }
  };

  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 0,
      }}
    >
      <View style={styles.container}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => handleTabPress(tab)}
          >
            <MaterialCommunityIcons
              name={tab.iconName}
              size={24}
              color={activeTab === tab.id ? "#fff" : "#666"}
            />
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
    bottom: 20,
    alignSelf: "center",
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
