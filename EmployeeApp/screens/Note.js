import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

function Note({ note}) {

    return (
        <View style={styles.noteContainer}>
            <Text style={styles.title}>{note.title}</Text>
            <Text style={styles.description}>{note.description}</Text>
            
        </View>
    );
}

const styles = StyleSheet.create({
    noteContainer: {
        backgroundColor: "#f9f9f9",
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
        marginHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 5,
    },
    description: {
        fontSize: 16,
        color: "#555",
        marginBottom: 5,
    },
    date: {
        fontSize: 14,
        color: "#999",
        marginBottom: 10,
    },
    deleteButton: {
        backgroundColor: "#ff4d4d",
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        alignSelf: "flex-start",
    },
    deleteText: {
        color: "#fff",
        fontWeight: "bold",
    },
});

export default Note;
