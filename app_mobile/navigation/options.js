import { Ionicons } from "@expo/vector-icons";

export const NavOptions = (nav) => {
  return {
    headerTintColor: '#cbd5e1',
    headerStyle: {
      backgroundColor: '#0f172a',
    },
    headerLeft: () => (
        <Ionicons
          name="menu"
          size={32}
          color="#cbd5e1"
          onPress={() => nav.toggleDrawer()}
        />
    )
  };
}