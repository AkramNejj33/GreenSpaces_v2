import {Text , View, FlatList, RefreshControl} from 'react-native';
// import { dummyData } from '../../data/dummy';
import EventItem from './event-item';
import { useNavigation } from '@react-navigation/native';
const EventList = ({ data }) => {
  const renderItem = ({ item }) => (
    <EventItem id={item.id} title={item.title} description={item.description} />
  );
  return (
    <View>
      <FlatList 
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
            <RefreshControl
                refreshing={false}
                onRefresh={() => console.log('Refresh')}
            />
        }
      />
    </View>
  );
}

export default EventList;