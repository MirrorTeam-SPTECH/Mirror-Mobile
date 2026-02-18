import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import TopBar from './src/components/TopBar';
import SearchBar from './src/components/SearchBar';
import CategoryFilter from './src/components/CategoryFilter';
import ProductGrid from './src/components/ProductGrid';
import BottomNavBar from './src/components/BottomNavBar';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <TopBar />
      <SearchBar />
      <CategoryFilter />
      <ProductGrid />
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
