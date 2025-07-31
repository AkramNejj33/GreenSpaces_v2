import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { dummyData } from '../../data/dummy';   
const EventItem = ({ item }) => {
    const navigation = useNavigation();
  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Event', { eventId: item.id })}>
        <Text>{item.id}</Text>
        <Text>{item.title}</Text>
        <Text>{item.description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
});

export default EventItem;