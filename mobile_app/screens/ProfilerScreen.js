import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Battery from 'expo-battery';
import { TASKS } from '../framework/constants';
import { localTaskExecutor } from '../framework/local-tasks';
import { remoteTaskExecutor } from '../framework/remote-tasks';
import { API_BASE_URL } from '../config';
import * as Device from 'expo-device';

// --- 1. DEFINE YOUR TEST PLAN ---
const BENCHMARK_SIZES = [10, 25, 50, 100, 150, 200, 250, 300]; // Test these N x N sizes
const ITERATIONS_PER_SIZE = 3;

// (Your generateMatrix helper function)
const generateMatrix = (size) => {
    return Array(size).fill(0).map(() => Array(size).fill(0).map(() => Math.random()));
};

export default function ProfilerScreen() {
    const [log, setLog] = useState('Press button to start benchmark batch...');
    const [loading, setLoading] = useState(false);

    // (Your getLatency helper function is the same)
    const getLatency = async () => {
        const t0 = Date.now();
        try {
            await fetch(`${API_BASE_URL}/ping`);
            return Date.now() - t0;
        } catch (e) {
            return -1;
        }
    };

    // --- 2. THIS IS THE NEW BATCH FUNCTION ---
    const runBenchmarkBatch = async () => {
        setLoading(true);
        setLog('Starting benchmark batch...\n');

        const totalTests = BENCHMARK_SIZES.length * ITERATIONS_PER_SIZE;
        let currentTest = 1;

        // Loop over each size
        for (const size of BENCHMARK_SIZES) {
            // Loop N times for that size
            for (let i = 0; i < ITERATIONS_PER_SIZE; i++) {

                const logHeader = `\n[${currentTest}/${totalTests}] Running ${size}x${size} (Iter ${i + 1})...\n`;
                setLog(prev => prev + logHeader);

                // We wrap each test in a try/catch so one failure doesn't stop the whole batch
                try {
                    // 1. --- GATHER FRESH CONTEXT ---
                    // We get fresh context for *every single test*
                    const network = await NetInfo.fetch();
                    const battery = await Battery.getBatteryLevelAsync();
                    const isCharging = (await Battery.getBatteryStateAsync()) === Battery.BatteryState.CHARGING;
                    const latency = await getLatency();

                    const testMatrixA = generateMatrix(size);
                    const testMatrixB = generateMatrix(size);
                    const taskParams = { a: testMatrixA, b: testMatrixB };

                    const inputs = {
                        task_name: TASKS.MATRIX_MULTIPLY,
                        network_type: network.type,
                        battery_level: battery,
                        is_charging: isCharging,
                        latency_ms: latency,
                        matrix_size: size,
                        image_size_kb: 0,

                        // Device specific parameters
                        device_manufacturer: Device.manufacturer,
                        device_model_name: Device.modelName,
                        os_name: Device.osName,
                        os_version: Device.osVersion,
                        total_memory: Device.totalMemory,
                    };

                    // 2. --- RUN TASKS ---
                    let t_local_ms = -1;
                    let t_remote_ms = -1;
                    let server_stats = {};

                    // Local
                    const t0 = Date.now();
                    await localTaskExecutor[TASKS.MATRIX_MULTIPLY](taskParams);
                    t_local_ms = Date.now() - t0;

                    // Remote
                    const t1 = Date.now();
                    const response = await remoteTaskExecutor[TASKS.MATRIX_MULTIPLY](taskParams);
                    t_remote_ms = Date.now() - t1;

                    server_stats = {
                        server_cpu_load: response.server_cpu_load,
                        server_memory_percent: response.server_memory_percent,
                        server_compute_time_ms: response.server_compute_time_ms
                    };

                    setLog(prev => prev + `-> Local: ${t_local_ms}ms, Remote: ${t_remote_ms}ms, Server:${server_stats.server_compute_time_ms}ms\n`);

                    // 3. --- LOG THE DATA ---
                    const outputs = {
                        local_time_ms: t_local_ms,
                        remote_time_ms: t_remote_ms,
                        ...server_stats
                    };

                    await fetch(`${API_BASE_URL}/benchmark/log`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ inputs, outputs }),
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
            <Text style={styles.title}>Profiler</Text>
            <Button
                title={loading ? 'Running Benchmark Batch...' : 'Run Full Batch'}
                onPress={runBenchmarkBatch} // 👈 3. Call the new batch function
                disabled={loading}
            />
            {loading && <ActivityIndicator size="large" color="#0000ff" />}
            <ScrollView style={styles.logContainer}>
                <Text style={styles.logText}>{log}</Text>
            </ScrollView>
        </View>
    );
}

// (Styles are the same)
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
        fontSize: 12,
    },
});