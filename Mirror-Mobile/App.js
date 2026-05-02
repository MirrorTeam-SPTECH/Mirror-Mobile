import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider } from "./src/context/AuthContext";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import { ProductsProvider } from "./src/context/ProductsContext";
import { CartProvider, useCart } from "./src/context/CartContext";
import { useAuth } from "./src/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";
import CartScreen from "./src/screens/CartScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import OrderTrackingScreen from "./src/screens/OrderTrackingScreen";
import OrderHistoryScreen from "./src/screens/OrderHistoryScreen";
import GrillAdvisorScreen from "./src/screens/GrillAdvisorScreen";
import LabelScannerScreen from "./src/screens/LabelScannerScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { getCartItemCount } = useCart();
  const { isLoggedIn } = useAuth();
  const cartItemCount = getCartItemCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "HomeTab") {
            iconName = "home";
          } else if (route.name === "Search") {
            iconName = "magnify";
          } else if (route.name === "Orders") {
            iconName = "cart";
          } else if (route.name === "Favorites") {
            iconName = "heart-outline";
          } else if (route.name === "ProfileTab") {
            iconName = "account-outline";
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#C41E3A",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: 25,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#eee",
          height: 60,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
        tabBarBadge: route.name === "Orders" && cartItemCount > 0 ? cartItemCount : null,
        tabBarBadgeStyle: { backgroundColor: "#C41E3A", color: "#fff" },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen
        name="Search"
        component={HomeScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
          },
        })}
      />
      <Tab.Screen name="Orders" component={CartScreen} />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isLoggedIn) {
              e.preventDefault();
              navigation.navigate("Login");
            }
          },
        })}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isLoggedIn) {
              e.preventDefault();
              navigation.navigate("Login");
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
      setInitialRoute(hasSeenOnboarding === "true" ? "Login" : "Onboarding");
    };

    checkOnboarding();
  }, []);

  if (initialRoute === null) {
    return null;
  }

  return (
    <AuthProvider>
      <FavoritesProvider>
        <ProductsProvider>
          <CartProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{ headerShown: false }}
              >
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
                <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
                <Stack.Screen name="GrillAdvisor" component={GrillAdvisorScreen} />
                <Stack.Screen name="LabelScanner" component={LabelScannerScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </CartProvider>
        </ProductsProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
