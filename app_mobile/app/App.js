import 'react-native-gesture-handler';
import { SafeAreaView, StyleSheet } from 'react-native';
import 'react-native-gesture-handler';
import { HomeStack } from '../navigation/stack';
import { MyDrawer } from '../navigation/drawer';
import { StatusBar } from 'react-native';
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <MyDrawer />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});