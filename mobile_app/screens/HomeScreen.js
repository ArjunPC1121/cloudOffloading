import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mobile Cloud Offloading</Text>
            <Button
                title="Go to Matrix Multiplication"
                onPress={() => navigation.navigate('MatrixMultiplication')}
                color="#1e90ff"
            />
            <Button
                title="Image flipping and rotation"
                onPress={() => navigation.navigate('ImageManipulation')}
                color="#ffa500"
            />
            <Button
                title="Grayscale Image Processing"
                onPress={() => navigation.navigate('Grayscale')}
                color="#FF0000"
            />
            <Button
                title="Profiler"
                onPress={() => navigation.navigate('Profiler')}
                color="#FF00FF"
            />
            <Button
                title="Profiler (Image manipulation)"
                onPress={() => navigation.navigate('ProfilerImage')}
                color="#FF000F"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        padding: 20
    },
    title: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center'
    }
});
