import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { getProductById, getProductNutrition, getNutritionNarrative, formatPrice } from "../services/api";
import { useCart } from "../context/CartContext";

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [nutrition, setNutrition] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  useEffect(() => {
    fetchProductDetails();
    fetchNutrition();
  }, [productId]);

  const fetchNutrition = async () => {
    try {
      const data = await getProductNutrition(productId);
      setNutrition(data);
    } catch (_) {
      // nutrition data is optional — silently skip if not available
    }
  };

  const handleGetNarrative = async () => {
    if (!nutrition || !product) return;
    setNarrativeLoading(true);
    try {
      const data = await getNutritionNarrative(product.id, product.name, nutrition);
      setNarrative(data.narrative);
    } catch (_) {
      setNarrative("Narrativa não disponível no momento.");
    } finally {
      setNarrativeLoading(false);
    }
  };

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const data = await getProductById(productId);
      setProduct(data);

      // Initialize selected options with required defaults
      const initialOptions = {};
      data.option_groups.forEach(group => {
        if (group.is_required && group.min_select === 1 && group.max_select === 1) {
          // Auto-select first option for required single-select groups
          if (group.options.length > 0) {
            initialOptions[group.id] = [group.options[0].id];
          }
        } else {
          initialOptions[group.id] = [];
        }
      });
      setSelectedOptions(initialOptions);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch product details:", err);
      setError("Não foi possível carregar os detalhes do produto");
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (groupId, optionId, group) => {
    setSelectedOptions((prev) => {
      const currentSelections = prev[groupId] || [];
      const isSelected = currentSelections.includes(optionId);

      if (group.max_select === 1) {
        // Radio button behavior (single select)
        return { ...prev, [groupId]: [optionId] };
      } else {
        // Checkbox behavior (multi select)
        let newSelections;
        if (isSelected) {
          newSelections = currentSelections.filter((id) => id !== optionId);
        } else {
          // Check if max_select limit reached
          if (currentSelections.length >= group.max_select) {
            return prev; // Don't add more
          }
          newSelections = [...currentSelections, optionId];
        }
        return { ...prev, [groupId]: newSelections };
      }
    });
  };

  const isOptionSelected = (groupId, optionId) => {
    return (selectedOptions[groupId] || []).includes(optionId);
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;

    let total = product.base_price_cents;

    // Add price deltas from selected options
    product.option_groups.forEach((group) => {
      const selections = selectedOptions[group.id] || [];
      selections.forEach((selectedOptionId) => {
        const option = group.options.find((opt) => opt.id === selectedOptionId);
        if (option) {
          total += option.price_delta_cents;
        }
      });
    });

    return total * quantity;
  };

  const canAddToCart = () => {
    if (!product) return false;

    // Check all required option groups are satisfied
    return product.option_groups.every((group) => {
      const selections = selectedOptions[group.id] || [];
      if (group.is_required) {
        return selections.length >= group.min_select;
      }
      return true;
    });
  };

  const handleAddToCart = () => {
    if (!product || !canAddToCart()) return;

    // Build selected options array for cart
    const selectedOptionsArray = [];
    product.option_groups.forEach((group) => {
      const selections = selectedOptions[group.id] || [];
      selections.forEach((selectedOptionId) => {
        const option = group.options.find((opt) => opt.id === selectedOptionId);
        if (option) {
          selectedOptionsArray.push({
            optionId: option.id,
            optionName: option.name,
            priceDeltaCents: option.price_delta_cents,
            groupName: group.name,
          });
        }
      });
    });

    // Create cart item
    const cartItem = {
      productId: product.id,
      productName: product.name,
      basePriceCents: product.base_price_cents,
      imageUrl: product.image_url,
      quantity: quantity,
      selectedOptions: selectedOptionsArray,
    };

    addToCart(cartItem);

    Alert.alert("Adicionado!", `${product.name} adicionado ao carrinho.`);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#C41E3A" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error || "Produto não encontrado"}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Produto</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        {product.image_url && (
          <Image source={{ uri: product.image_url }} style={styles.productImage} />
        )}

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.name}</Text>
          {product.description && (
            <Text style={styles.productDescription}>{product.description}</Text>
          )}
          <View style={styles.metaInfo}>
            <Text style={styles.prepTime}>⏱ {product.prep_minutes} min</Text>
            <Text style={styles.basePrice}>{formatPrice(product.base_price_cents)}</Text>
          </View>
        </View>

        {/* Option Groups */}
        {product.option_groups.map((group) => (
          <View key={group.id} style={styles.optionGroup}>
            <View style={styles.optionGroupHeader}>
              <Text style={styles.optionGroupTitle}>{group.name}</Text>
              {group.is_required ? (
                <Text style={styles.requiredBadge}>Obrigatório</Text>
              ) : (
                <Text style={styles.optionalBadge}>Opcional</Text>
              )}
            </View>
            <Text style={styles.optionGroupHint}>
              {group.max_select === 1
                ? "Escolha 1 opção"
                : `Escolha até ${group.max_select} opções`}
            </Text>

            {group.options.map((option) => {
              const selected = isOptionSelected(group.id, option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionItem,
                    selected && styles.optionItemSelected,
                  ]}
                  onPress={() => toggleOption(group.id, option.id, group)}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        group.max_select === 1 ? styles.radio : styles.checkbox,
                        selected && styles.selectedIndicator,
                      ]}
                    >
                      {selected && <View style={styles.selectedDot} />}
                    </View>
                    <Text style={styles.optionName}>{option.name}</Text>
                  </View>
                  {option.price_delta_cents !== 0 && (
                    <Text style={styles.optionPrice}>
                      {option.price_delta_cents > 0 ? "+" : ""}
                      {formatPrice(option.price_delta_cents)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Nutrition Section */}
        {nutrition && (
          <View style={styles.nutritionSection}>
            <Text style={styles.nutritionTitle}>Informações Nutricionais</Text>
            <Text style={styles.nutritionDisclaimer}>* Valores orientativos por porção</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.total_kcal}</Text>
                <Text style={styles.nutritionLabel}>kcal</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.total_protein_g}g</Text>
                <Text style={styles.nutritionLabel}>Proteínas</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.total_carb_g}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition.total_fat_g}g</Text>
                <Text style={styles.nutritionLabel}>Gorduras</Text>
              </View>
            </View>
            {narrative ? (
              <Text style={styles.narrativeText}>{narrative}</Text>
            ) : (
              <TouchableOpacity
                style={styles.narrativeButton}
                onPress={handleGetNarrative}
                disabled={narrativeLoading}
              >
                {narrativeLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.narrativeButtonText}>✨ Análise do Nutricionista</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quantity Selector */}
        <View style={styles.quantitySection}>
          <Text style={styles.quantityLabel}>Quantidade</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{formatPrice(calculateTotalPrice())}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, !canAddToCart() && styles.addButtonDisabled]}
          onPress={handleAddToCart}
          disabled={!canAddToCart()}
        >
          <Text style={styles.addButtonText}>
            {canAddToCart() ? "Adicionar ao Carrinho" : "Selecione as opções"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backIconButton: {
    marginRight: 15,
  },
  backIcon: {
    fontSize: 28,
    color: "#333",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  productImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
    backgroundColor: "#fff",
  },
  infoSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  metaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prepTime: {
    fontSize: 14,
    color: "#999",
  },
  basePrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2ECC71",
  },
  optionGroup: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
  },
  optionGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  optionGroupTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  requiredBadge: {
    fontSize: 12,
    color: "#C41E3A",
    fontWeight: "600",
  },
  optionalBadge: {
    fontSize: 12,
    color: "#999",
  },
  optionGroupHint: {
    fontSize: 13,
    color: "#999",
    marginBottom: 15,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  optionItemSelected: {
    borderColor: "#C41E3A",
    backgroundColor: "#fff5f5",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ddd",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIndicator: {
    borderColor: "#C41E3A",
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#C41E3A",
  },
  optionName: {
    fontSize: 15,
    color: "#333",
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2ECC71",
  },
  quantitySection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#C41E3A",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#999",
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#740000",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#C41E3A",
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#C41E3A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  nutritionSection: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  nutritionDisclaimer: {
    fontSize: 11,
    color: "#bbb",
    marginBottom: 14,
  },
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  nutritionItem: {
    alignItems: "center",
    flex: 1,
  },
  nutritionValue: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#C41E3A",
  },
  nutritionLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  narrativeButton: {
    backgroundColor: "#740000",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  narrativeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  narrativeText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 21,
    fontStyle: "italic",
  },
});
