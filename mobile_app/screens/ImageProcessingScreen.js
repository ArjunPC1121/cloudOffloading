import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { framework } from "../framework/offloading-framework"
import Canvas from 'react-native-canvas';
import { TASKS } from '../framework/constants';

export default function ImageProcessingScreen() {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [networkState, setNetworkState] = useState(null);

    const [readyCanvas, setReadyCanvas] = useState(null);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setNetworkState(state);
        });
        return () => unsubscribe();
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.canceled) {
            setOriginalImage(result.assets[0]);
            setProcessedImage(null);
            setMessage('');
        }
    };

    const handleProcess = async () => {
        if (!originalImage) {
            setMessage('Please select an image first.');
            return;
        }

        // 2. Add a "guard" check
        // This stops the user from clicking "Process" before the canvas is ready
        if (!readyCanvas) {
            setMessage('Canvas is initializing, please wait a sec...');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // 1. Call the framework
            const response = await framework.execute(TASKS.GRAYSCALE, {
                originalImage: originalImage,
                networkState: networkState,
                canvas: readyCanvas
            });

            // 2. Set results from the framework's response, the framework returns URI (data)
            setProcessedImage(response.data.imageUri);
            setMessage(
                `Computed on ${response.ranOn} in ${response.timeMs} ms. Reason: ${response.reason}`
            );
        } catch (error) {
            setMessage('Error processing image: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCanvas = (canvasNode) => {
        if (canvasNode) {
            // You can set initial size here if needed
            // canvasNode.width = 100;
            // canvasNode.height = 100;

            // 5. Save the ready-to-use canvas node in state
            setReadyCanvas(canvasNode);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Image Processing (Cloud Offloading)</Text>

            <Button title="Pick an Image" onPress={pickImage} color="#1e90ff" />
            {originalImage && !processedImage && (
                <Image source={{ uri: originalImage.uri }} style={styles.image} />
            )}

            {processedImage && (
                <Image source={{ uri: processedImage }} style={styles.image} />
            )}

            <Button
                title="Process Image"
                onPress={handleProcess}
                color="#32cd32"
                disabled={loading}
            />

            {loading && <ActivityIndicator size="large" color="#ffffff" style={{ margin: 10 }} />}

            {message ? <Text style={styles.message}>{message}</Text> : null}
            <Canvas ref={handleCanvas} style={{ display: 'none' }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        padding: 20,
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    image: {
        width: '100%',
        height: 300,
        resizeMode: 'contain',
        marginVertical: 15,
        borderRadius: 8,
    },
    grayWrapper: {
        backgroundColor: 'black',
    },
    message: {
        color: 'lightgreen',
        textAlign: 'center',
        marginTop: 10,
        fontSize: 16,
    },
});
