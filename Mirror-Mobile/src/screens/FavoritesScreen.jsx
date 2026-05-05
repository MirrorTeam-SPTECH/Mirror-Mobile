import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFavorites } from "../context/FavoritesContext";
import { formatPrice } from "../services/api";
import { PRODUCT_IMAGES } from "../services/productImages";

const BG      = "#FAF5EC";
const INK     = "#2A1E14";
const PRIMARY = "#D91C1C";
const SUBTLE  = "#8A7558";
const LINE    = "#E8DFD1";
const MUTED   = "#7A6A56";
const SERIF   = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

function FavoriteCard({ product }) {
  const navigation = useNavigation();
  const { toggleFavorite } = useFavorites();
  const localImage = PRODUCT_IMAGES[product.id] ?? null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate("ProductDetail", { productId: product.id })}
    >
      <View style={styles.imageWrap}>
        {localImage ? (
          <Image source={localImage} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]}>
            <Ionicons name="fast-food-outline" size={26} color={SUBTLE} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{product.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{formatPrice(product.base_price_cents)}</Text>
          <Text style={styles.time}>⏱ {product.prep_minutes} min</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.heartBtn}
        onPress={() => toggleFavorite(product.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="heart" size={22} color={PRIMARY} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const { favoriteProducts, loadFavorites } = useFavorites();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={INK} />
        </TouchableOpacity>
        <View style={styles.topBarText}>
          <Text style={styles.topLabel}>Portal do Churras</Text>
          <Text style={styles.topTitle}>Favoritos</Text>
        </View>
      </View>

      {favoriteProducts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={56} color={SUBTLE} />
          <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
          <Text style={styles.emptyHint}>
            Toque no coração de um lanche para salvar aqui
          </Text>
        </View>
      ) : (
        <FlatList
          data={favoriteProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <FavoriteCard product={item} />}
          contentContainerStyle={styles.list}
          onRefresh={loadFavorites}
          refreshing={false}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: Platform.OS === "android" ? 44 : 18,
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 4,
  },
  backBtn: {
    padding: 4,
    marginBottom: 2,
  },
  topBarText: { flex: 1 },
  topLabel: {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: SUBTLE,
    fontWeight: "600",
    marginBottom: 4,
  },
  topTitle: {
    fontFamily: SERIF,
    fontSize: 28,
    color: INK,
    fontWeight: "400",
    letterSpacing: -0.3,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: SERIF,
    fontSize: 20,
    color: INK,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  separator: {
    height: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    overflow: "hidden",
    alignItems: "center",
  },
  imageWrap: {
    width: 88,
    height: 88,
    backgroundColor: "#F0E8D8",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0E8D8",
  },
  info: { flex: 1, paddingVertical: 12, paddingHorizontal: 12 },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: INK,
    marginBottom: 3,
  },
  description: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 8,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: PRIMARY,
  },
  time: { fontSize: 12, color: MUTED },
  heartBtn: { padding: 14 },
});
