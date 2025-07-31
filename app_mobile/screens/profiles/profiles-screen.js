import { useNavigation } from "expo-router";
import { Button } from "react-native";
import { View, Text } from 'react-native';
const ProfileScreen = () => {
  const navigation = useNavigation();

  return (
    <View>
      <Text>This is the profile screen</Text>
      <Button
        title="Go to Profile Detail"
        onPress={() => navigation.navigate("Profile", { profileId: "123" })}
      />
    </View>
  );
}

export default ProfileScreen;
