import { View , Text} from 'react-native';
import { Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import EventList from '../components/events/events-list';
import { StyleSheet, ScrollView, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import axios from "axios";
import Note from './Note';

const HomeScreen = () => {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    getNotes();
  }, []);

  const getNotes = () => {
    axios
      .get("http://192.168.1.4:8000/api/notes/")
      .then((res) => res.data)
      .then((data) => {
        setNotes(data);
        console.log(data);
      })
      .catch((err) => alert(err));
  };

  const deleteNote = (id) => {
    axios
      .delete(`http://192.168.1.4:8000/api/notes/delete/${id}/`)
      .then((res) => {
        if (res.status === 204) {
          alert("Note deleted successfully");
        } else {
          alert("Error deleting note");
        }
            getNotes();

      })
      .catch((err) => {
        alert(err);
      });
  };

  const createNote = (e) => {
    e.preventDefault();
    axios
      .post("http://192.168.1.4:8000/api/notes/", { title, description })
      .then((res) => {
        if (res.status === 201) alert("Note created successfully");
        else alert("Error creating note");
            getNotes();

      })
      .catch((err) => {
        alert(err.message);
      });
  };
  return (
     <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Test Page</Text>
      <Text style={styles.subheader}>hada ghi test</Text>

      <Text style={styles.sectionTitle}>Notes</Text>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Note note={item} onDelete={deleteNote} />
        )}
      />

      <Text style={styles.sectionTitle}>Create a Note</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Description"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <Button title="Submit" onPress={createNote} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subheader: {
    fontSize: 16,
    color: "gray",
  },
  sectionTitle: {
    fontSize: 20,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
  },
});

export default HomeScreen;
