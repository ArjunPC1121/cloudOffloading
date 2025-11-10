import React, { useState } from 'react';
import {
    View, Text, Button, ScrollView, StyleSheet,
    ActivityIndicator, Image, Platform
} from 'react-native';

// --- Expo/React Native Imports ---
import NetInfo from '@react-native-community/netinfo';
import * as Battery from 'expo-battery';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Device from 'expo-device';

// --- Framework Imports ---
import { API_BASE_URL, LOG_URL } from '../config'; // Using your config file
import { TASKS } from '../framework/constants';
import { localTaskExecutor } from '../framework/local-tasks';
import { remoteTaskExecutor } from '../framework/remote-tasks';

// --- 1. Define Your Test Plan ---
const CROP_SIZES_TO_BENCHMARK = [500, 800, 1000, 1200, 1500, 1800, 2000, 2500, 3000];
const ITERATIONS_PER_SIZE = 3;

export default function ImageProfilerScreen() {
    const [log, setLog] = useState('Please pick a large base image to start...');
    const [loading, setLoading] = useState(false);
    const [baseImage, setBaseImage] = useState(null); // Stores the { uri, width, height }

    // (Helper function to get latency)
    const getLatency = async () => {
        const t0 = Date.now();
        try {
            await fetch(`${API_BASE_URL}/ping`);
            return Date.now() - t0;
        } catch (e) {
            return -1;
        }
    };

    // (Helper function to pick the base image)
    const pickImage = async () => {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            const maxCrop = CROP_SIZES_TO_BENCHMARK[CROP_SIZES_TO_BENCHMARK.length - 1];
            if (asset.width < maxCrop || asset.height < maxCrop) {
                setLog(`Error: Pick an image that is at least ${maxCrop}x${maxCrop} pixels.`);
                setBaseImage(null);
            } else {
                setLog(`Base image selected: ${asset.fileName || 'image.jpg'} (${asset.width}x${asset.height})`);
                setBaseImage(asset);
            }
        }
    };

    // --- 2. THIS IS THE BATCH FUNCTION (modeled after your Matrix Profiler) ---
    const runImageBenchmarkBatch = async () => {
        if (!baseImage) {
            setLog('Please pick a base image first.');
            return;
        }

        setLoading(true);
        setLog('Starting dynamic crop benchmark batch...\n');

        const totalTests = CROP_SIZES_TO_BENCHMARK.length * ITERATIONS_PER_SIZE;
        let currentTest = 1;

        for (const size of CROP_SIZES_TO_BENCHMARK) {
            // --- CROP THE IMAGE FIRST ---
            let croppedAsset = null;
            try {
                setLog(prev => prev + `\nCropping base image to ${size}x${size}...\n`);
                const cropAction = {
                    crop: { originX: 0, originY: 0, width: size, height: size },
                };
                croppedAsset = await ImageManipulator.manipulateAsync(
                    baseImage.uri,
                    [cropAction],
                    { format: ImageManipulator.SaveFormat.JPEG }
                );
            } catch (e) {
                setLog(prev => prev + `Crop failed: ${e.message}\n`);
                continue;
            }
            // Add a tiny delay to let the OS file system "catch up"
            // and release the lock on the new file. 50ms is more than enough.
            await new Promise(resolve => setTimeout(resolve, 50));

            const fileInfo = await FileSystem.getInfoAsync(croppedAsset.uri, { size: true });
            const fileSizeKB = fileInfo.size / 1024;

            for (let i = 0; i < ITERATIONS_PER_SIZE; i++) {
                const logHeader = `[${currentTest}/${totalTests}] Benchmarking ${size}x${size} (${fileSizeKB.toFixed(0)}KB), Iter ${i + 1}...\n`;
                setLog(prev => prev + logHeader);

                try {
                    // 1. --- GATHER FRESH CONTEXT ---
                    const network = await NetInfo.fetch();
                    const battery = await Battery.getBatteryLevelAsync();
                    const isCharging = (await Battery.getBatteryStateAsync()) === Battery.BatteryState.CHARGING;
                    const latency = await getLatency();
                    const wifi_strength = network.type === 'wifi' ? network.details?.strength : null;
                    const wifi_frequency = network.type === 'wifi' ? network.details?.frequency : null;
                    const network_type = network.details?.cellularGeneration || network.type;

                    // We'll benchmark a 90-degree rotation
                    const taskParams = {
                        originalImage: croppedAsset.uri, // Pass the cropped asset
                    };

                    const inputs = {
                        task_name: TASKS.MANIPULATE,
                        network_type: network_type,
                        battery_level: battery,
                        is_charging: isCharging,
                        latency_ms: latency,
                        matrix_size: 0,
                        image_size_kb: fileSizeKB,
                        image_resolution: `${croppedAsset.width}x${croppedAsset.height}`,
                        image_complexity: baseImage.fileName || 'user_photo',
                        device_manufacturer: Device.manufacturer,
                        device_model_name: Device.modelName,
                        os_name: Device.osName,
                        os_version: Device.osVersion,
                        total_memory: Device.totalMemory,
                        client_cpu_cores: Device.cpuCores,
                        client_cpu_processor: Device.processor,
                        wifi_strength: wifi_strength,
                        wifi_frequency: wifi_frequency,
                    };

                    // 2. --- RUN TASKS ---
                    let t_local_ms = -1;
                    let t_remote_ms = -1;
                    let server_response = null;

                    // Local
                    const t0 = Date.now();
                    await localTaskExecutor[TASKS.MANIPULATE](taskParams);
                    t_local_ms = Date.now() - t0;

                    // Remote
                    const t1 = Date.now();
                    // Pass URI string to remote task
                    const remoteTaskParams = {
                        originalImage: croppedAsset.uri,
                        rotation: 90,
                        flip: null,
                    };
                    server_response = await remoteTaskExecutor[TASKS.MANIPULATE](remoteTaskParams);
                    t_remote_ms = Date.now() - t1;

                    const server_stats = {
                        server_cpu_load: server_response.server_cpu_load,
                        server_memory_percent: server_response.server_memory_percent,
                        server_compute_time_ms: server_response.server_compute_time_ms,
                        server_core_count: server_response.server_core_count,
                        server_cpu_model: server_response.server_cpu_model,
                        server_cpu_freq_current: server_response.server_cpu_freq_current,
                        server_cpu_freq_max: server_response.server_cpu_freq_max
                    };

                    setLog(prev => prev + `-> Local: ${t_local_ms}ms, Remote: ${t_remote_ms}ms, Server:${server_stats.server_compute_time_ms}ms\n`);

                    // 3. --- LOG THE DATA ---
                    const outputs = {
                        local_time_ms: t_local_ms,
                        remote_time_ms: t_remote_ms,
                        ...server_stats
                    };
                    const log_data = { inputs: inputs, outputs: outputs };

                    // Use your benchmark/log endpoint
                    await fetch(`${LOG_URL}/benchmark/log`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        // Add your API key if you've implemented it
                        // 'X-API-KEY': 'your-key' 
                        body: JSON.stringify(log_data),
                    });
                    setLog(prev => prev + '-> Logged to server.\n');

                } catch (error) {
                    setLog(prev => prev + `-> FAILED: ${error.message}\n`);
                }
                currentTest++;
            }
        }
        setLog(prev => prev + '\n--- BATCH COMPLETE! ---');
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Image Profiler</Text>

            <Button title="1. Pick Large Base Image" onPress={pickImage} />
            {baseImage && (
                <Image source={{ uri: baseImage.uri }} style={styles.preview} />
            )}

            <Button
                title={loading ? 'Running Image Batch...' : '2. Run Full Image Benchmark'}
                onPress={runImageBenchmarkBatch}
                disabled={loading || !baseImage} // Disable until image is picked
                color="#841584"
            />

            {loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 10 }} />}

            <ScrollView style={styles.logContainer}>
                <Text style={styles.logText}>{log}</Text>
            </ScrollView>
        </View>
    );
}

// (Styles are the same, with 'preview' added)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    preview: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginVertical: 10,
        borderColor: '#ccc',
        borderWidth: 1,
    },
    logContainer: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderColor: '#ccc',
        borderWidth: 1,
        marginTop: 20,
        padding: 10,
        height: 300,
    },
    logText: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 12,
    },
});