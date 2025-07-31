import { View , Text} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
const EventDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { eventId } = route.params; // Get the eventId from route params
    useLayoutEffect(() => {
        navigation.setOptions({ 
            headerTitle: "new Title" });
    }, []);

    return (
    <View>
      <Text>This is event detail screen for {eventId}</Text>
    </View>
  );
}

export default EventDetailScreen;