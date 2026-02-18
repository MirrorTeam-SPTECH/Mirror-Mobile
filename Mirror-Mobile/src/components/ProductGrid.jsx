import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React from "react";
import ProductCard from "./ProductCard";

const products = [
  {
    id: 1,
    name: "X - salada",
    time: "15-20 min",
    price: "29,00",
    image:
      "https://img.freepik.com/fotos-gratis/hamburger-com-carne-e-queijo_23-21482735https://img.freepik.com/psd-gratuitas/delicious-triple-cheeseburger-with-melted-cheese-and-fresh-lettuce_84443-70875.jpg?t=st=1771338117~exp=1771341717~hmac=84ab362df38b945dc1f435983ebf15e155c18bf794e8a85bf80a38ba8fca0ef4.jpg",
  },
  {
    id: 2,
    name: "gfg",
    time: "15-20 min",
    price: "20,00",
    image:
      "https://img.freepik.com/fotos-gratis/hamburger-com-carne-e-queijo_23-21482735https://img.freepik.com/psd-gratuitas/delicious-triple-cheeseburger-with-melted-cheese-and-fresh-lettuce_84443-70875.jpg?t=st=1771338117~exp=1771341717~hmac=84ab362df38b945dc1f435983ebf15e155c18bf794e8a85bf80a38ba8fca0ef4.jpg",
  },
  {
    id: 3,
    name: "X-Gordao",
    time: "15-20 min",
    price: "32,00",
    image:
      "https://img.freepik.com/fotos-gratis/hamburger-com-carne-e-queijo_23-21482735https://img.freepik.com/psd-gratuitas/delicious-triple-cheeseburger-with-melted-cheese-and-fresh-lettuce_84443-70875.jpg?t=st=1771338117~exp=1771341717~hmac=84ab362df38b945dc1f435983ebf15e155c18bf794e8a85bf80a38ba8fca0ef4.jpg",
  },
  {
    id: 4,
    name: "qlq um ",
    time: "15-20 min",
    price: "37,00",
    image:
      "https://img.freepik.com/fotos-gratis/hamburger-com-carne-e-queijo_23-21482735https://img.freepik.com/psd-gratuitas/delicious-triple-cheeseburger-with-melted-cheese-and-fresh-lettuce_84443-70875.jpg?t=st=1771338117~exp=1771341717~hmac=84ab362df38b945dc1f435983ebf15e155c18bf794e8a85bf80a38ba8fca0ef4.jpg",
  },
];

export default function ProductGrid() {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </View>

        <TouchableOpacity style={styles.loadMoreButton}>
          <Text style={styles.loadMoreText}>Ver mais</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    marginTop: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  loadMoreButton: {
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 100,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  loadMoreText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});
