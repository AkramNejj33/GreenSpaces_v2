import { View , Text} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
const ProfileDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { profileId } = route.params; // Get the profileId from route params
    useLayoutEffect(() => {
        navigation.setOptions({ 
            headerTitle: "new Title" });
    }, []);

    return (
    <View>
      <Text>This is profile detail screen for {profileId}</Text>
    </View>
  );
}

export default ProfileDetailScreen;