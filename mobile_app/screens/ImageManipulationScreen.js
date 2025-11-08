import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { useBatteryLevel } from 'expo-battery';
import { framework } from "../framework/offloading-framework"
import { TASKS } from '../framework/constants';

export default function ImageManipulationScreen() {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [networkState, setNetworkState] = useState(null);
    
    //NEW HOOK: Get battery level (0 to 1)
    const batteryLevel = useBatteryLevel(); 

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
            setOriginalImage(result.assets[0].uri);
            setProcessedImage(null);
            setMessage('');
        }
    };

    // Helper to get the battery percentage (0 to 100)
    const getBatteryPercentage = () => {
        return batteryLevel !== null && batteryLevel !== -1
            ? Math.round(batteryLevel * 100)
            : 'Unknown';
    };

    const handleProcess = async () => {
        if (!originalImage) {
            setMessage('Please select an image first.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // 1. Call the framework
            const response = await framework.execute(TASKS.MANIPULATE, {
                originalImage: originalImage,
                networkState: networkState,
                batteryPercentage: getBatteryPercentage(), 
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

    const handleLocally = async () => {
        if (!originalImage) {
            setMessage('Please select an image first.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // 1. Call the framework
            const response = await framework.execute(TASKS.FLIP_LOCAL, {
                originalImage: originalImage,
                networkState: networkState,
                batteryPercentage: getBatteryPercentage(), 
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

    const handleRemotely = async () => {
        if (!originalImage) {
            setMessage('Please select an image first.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // 1. Call the framework
            const response = await framework.execute(TASKS.FLIP_REMOTE, {
                originalImage: originalImage,
                networkState: networkState,
                batteryPercentage: getBatteryPercentage(), 
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

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Image Manipulation</Text>

            {/* Display current battery level */}
            <Text style={styles.batteryInfo}>
                Battery: **{getBatteryPercentage()}%** 🔋
            </Text>

            <Button title="Pick an Image" onPress={pickImage} color="#1e90ff" />
            {originalImage && !processedImage && (
                <Image source={{ uri: originalImage }} style={styles.image} />
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

            <Button
                title="Process Image Locally"
                onPress={handleLocally}
                color="#e41173ff"
                disabled={loading}
            />

            <Button
                title="Process Image Remotely"
                onPress={handleRemotely}
                color="#e6770fff"
                disabled={loading}
            />

            {loading && <ActivityIndicator size="large" color="#ffffff" style={{ margin: 10 }} />}

            {message ? <Text style={styles.message}>{message}</Text> : null}
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
    batteryInfo: {
        color: 'yellow',
        textAlign: 'center',
        marginBottom: 10,
        fontSize: 18,
    },
});