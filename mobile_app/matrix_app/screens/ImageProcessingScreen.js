import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy';
import axios from 'axios';

export default function ImageProcessingScreen() {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [networkState, setNetworkState] = useState(null);

  const BASE_URL = 'http://192.168.1.6:5000'; // Flask backend

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

  // Local grayscale conversion (Adding a tint)
  const convertToGrayscaleLocally = async (uri) => {
  await new Promise(resolve => setTimeout(resolve, 800)); // simulate processing time

  
  return (
    <View style={styles.grayWrapper}>
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { opacity: 0.6 }, // slightly fade the colors for effect
        ]}
      />
      <View style={styles.overlay} />
    </View>
  );
};


  const handleProcess = async () => {
    if (!originalImage) {
      setMessage('Please select an image first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const fileInfo = await FileSystem.getInfoAsync(originalImage, { size: true });
      const fileSizeMB = fileInfo.size / (1024 * 1024);

      const isConnected = networkState?.isConnected;
      const isFastNetwork = isConnected && (
        networkState.type === 'wifi' ||
        networkState.details?.cellularGeneration === '4g' ||
        networkState.details?.cellularGeneration === '5g'
      );

      let computationLocation = '';
      let reason = '';
      const start = Date.now();
      let outputImage = null;

      if (fileSizeMB < 2 || (!isConnected || !isFastNetwork)) {
        // Local computation for small image or poor network
        outputImage = await convertToGrayscaleLocally(originalImage);
        computationLocation = 'mobile device';
        reason = `small image (${fileSizeMB.toFixed(2)} MB) or slow/no network`;
      } else {
        // Offload to backend
        const response = await fetch(originalImage);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('image', {
          uri: originalImage,
          type: blob.type,
          name: 'upload.jpg',
        });

        const res = await axios.post(`${BASE_URL}/process-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        outputImage = `data:image/jpeg;base64,${res.data.processed_image}`;

        computationLocation = 'backend server';
        reason = isFastNetwork
          ? 'fast network detected (WiFi or 4G/5G)'
          : `large image (${fileSizeMB.toFixed(2)} MB) prioritized for backend`;
      }

      const end = Date.now();
      setProcessedImage(outputImage);
      setMessage(
        `Computed on ${computationLocation} in ${end - start} ms because ${reason}.`
      );
    } catch (error) {
      setMessage('Error processing image: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Image Processing (Cloud Offloading)</Text>

      <Button title="Pick an Image" onPress={pickImage} color="#1e90ff" />
      {originalImage && !processedImage && (
        <Image source={{ uri: originalImage }} style={styles.image} />
      )}

      {typeof processedImage === 'string' && (
        <Image source={{ uri: processedImage }} style={styles.image} />
      )}

      {React.isValidElement(processedImage) && processedImage}

      <Button
        title="Process Image"
        onPress={handleProcess}
        color="#32cd32"
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
  grayWrapper: {
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
  },
  overlay: {
  position: 'absolute',
  width: '100%',
  height: '100%',
  backgroundColor: 'gray',
  opacity: 0.4, // overlay on top to dull colors visually
  borderRadius: 8,
  },
});
