import * as FileSystem from 'expo-file-system/legacy';
import * as Battery from 'expo-battery'; // For battery_level, is_charging
import * as Device from 'expo-device';   // For device_model_name
import { TASKS } from './constants';
import { localTaskExecutor } from './local-tasks';
import { remoteTaskExecutor } from './remote-tasks';

// --------------------------------------------------------
// --- CONFIGURATION ---
// --------------------------------------------------------
// IMPORTANT: Replace 'YOUR_SERVER_IP' with the actual IP address or domain name of your backend server.
const BACKEND_URL = 'http://192.168.1.4:5000'; 
const PING_ENDPOINT = `${BACKEND_URL}/ping`;
const PREDICTION_ENDPOINT = `${BACKEND_URL}/predict_offload`;

// A known model name to send to the backend if Device.modelName is null
const DEFAULT_DEVICE_MODEL = 'Unknown Android/iOS Device'; 
// Default latency value (in ms) if ping fails
const DEFAULT_LATENCY_MS = 200; 


class OffloadingFramework {

    /**
     * Measures RTT latency by pinging the backend server.
     * @returns {Promise<number>} Latency in milliseconds (ms).
     */
    async _measureLatency() {
        try {
            const start = Date.now();
            // Ping the light-weight /ping endpoint on the server
            await fetch(PING_ENDPOINT, { method: 'GET' }); 
            const end = Date.now();
            return end - start;
        } catch (error) {
            console.warn('Framework: Could not measure latency. Using default value.', error.message);
            return DEFAULT_LATENCY_MS; 
        }
    }

    /**
     * Collects all required runtime features (device, network, latency) that are client-side measurable.
     * @param {object} networkState - The current network state (e.g., from NetInfo).
     * @returns {Promise<object>} JSON object of features.
     */
    async _getDeviceAndNetworkState(networkState) {
        // 1. Device State Collection
        const batteryLevel = await Battery.getBatteryLevelAsync();
        const batteryState = await Battery.getBatteryStateAsync();
        // Convert BatteryState enum to a simple boolean/integer
        const isCharging = (batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL) ? 1 : 0;
        
        // 2. Network Metrics
        const latencyMs = await this._measureLatency();
        
        return {
            // Device Features
            battery_level: batteryLevel,
            is_charging: isCharging,
            device_model_name: Device.modelName || DEFAULT_DEVICE_MODEL,

            // Network Features
            network_type: networkState.type || 'unknown',
            latency_ms: latencyMs,

            // Server Metrics (Using 0.0 placeholders as clients cannot measure these in real-time)
            // NOTE: If your server exposes a status endpoint with these metrics, you should fetch them here.
            server_cpu_load: 0.0,
            server_memory_percent: 0.0,
        };
    }

    /**
     * Helper to prepare ALL features required by the ML model for prediction.
     * Combines task-specific metrics and runtime state.
     */
    async _prepareFeatures(taskName, params, runtimeState) {
        // 1. Task Complexity Features (Input data size/complexity)
        let matrix_size = 0;
        let image_size_kb = 0;

        if (taskName === TASKS.MATRIX_MULTIPLY) {
            // Assuming 'params.a' is the first matrix and its length is the order (NxN)
            matrix_size = params.a.length;
        } else if (taskName === TASKS.MANIPULATE || taskName === TASKS.GRAYSCALE || taskName === TASKS.FLIP_REMOTE) {
            // Assuming 'originalImage' is the file URI
            try {
                const fileInfo = await FileSystem.getInfoAsync(params.originalImage, { size: true });
                image_size_kb = fileInfo.size / 1024; // Convert bytes to KB
            } catch (e) {
                console.warn("Framework: Could not get file info for image task.");
                image_size_kb = 0;
            }
        }
        
        // 2. Combine all features for the ML endpoint
        const features = {
            task_name: taskName,
            matrix_size: matrix_size,
            image_size_kb: image_size_kb, 
            
            // Runtime state
            ...runtimeState
        };

        return features;
    }

    /**
     * Calls the ML Prediction API on the backend.
     */
    async _getMLPrediction(features) {
        try {
            const response = await fetch(PREDICTION_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(features),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // Expected data structure: { prediction: "remote" or "local", probability: 0.95 }
            const isRemote = data.prediction === 'remote';
            return {
                offload: isRemote,
                reason: `ML Prediction: ${data.prediction} (Prob: ${(data.probability * 100).toFixed(1)}%)`,
            };

        } catch (error) {
            console.error('Framework: ML Prediction failed, using local fallback:', error.message);
            // Fallback to a safe decision if ML API fails
            return { offload: false, reason: 'ML API failed, running locally (Fallback).' }; 
        }
    }


    /**
     * The ML-based decision engine.
     * @returns {Promise<{offload: boolean, reason: string}>} The decision and justification.
     */
    async shouldOffload(taskName, params) {
        const { networkState } = params;

        // 1. Global Rule: No connection? No offload.
        if (!networkState.isConnected || networkState.type === 'unknown') {
            return { offload: false, reason: 'No network connection.' };
        }
        
        // 2. Hardcoded Rules (if any)
        if (taskName === TASKS.FLIP_LOCAL) {
            return {offload: false, reason: 'Always run flip-local task locally (Hardcoded).'};
        }
        if( taskName === TASKS.FLIP_REMOTE) {
            return {offload: true, reason: 'Always offload flip-remote task (Hardcoded).'};
        }
        if(taskName === TASKS.GRAYSCALE) {
            return{offload: true, reason: 'Always run grayscale task remotely (Hardcoded).'};
        }
        
        // 3. CORE CHANGE: Use ML for the complex tasks
        const runtimeState = await this._getDeviceAndNetworkState(networkState);
        const features = await this._prepareFeatures(taskName, params, runtimeState);
        
        const decision = await this._getMLPrediction(features);
        
        return decision;
    }

    /**
     * The Executor.
     * This function calls the correct implementation based on the ML decision.
     */
    async execute(taskName, params) {
        const start = Date.now();

        // 1. Get the ML decision and the reason
        const decision = await this.shouldOffload(taskName, params);

        let taskResult;
        let ranOn = 'local';
        let finalReason = decision.reason;
        
        try {
            if (decision.offload) {
                console.log(`Framework: Attempting offload. Reason: ${decision.reason}`);
                ranOn = 'remote';
                taskResult = await remoteTaskExecutor[taskName](params);
            } else {
                console.log(`Framework: Running locally. Reason: ${decision.reason}`);
                taskResult = await localTaskExecutor[taskName](params);
            }
        } catch (error) {
            // 2. Fallback logic: If remote execution fails, fall back to local execution.
            console.warn(`Framework: Execution failed on '${ranOn}'! ${error.message}. Falling back to local.`);
            finalReason = `Failed on ${ranOn}. Fallback to local. (${decision.reason})`;
            ranOn = 'local_fallback';
            taskResult = await localTaskExecutor[taskName](params);
        }

        const end = Date.now();
        const timeMs = end - start;
        console.log(`Framework: ${taskName} completed in ${timeMs}ms. Ran on: ${ranOn}`);

        return {
            data: taskResult,
            timeMs: timeMs,
            ranOn: ranOn,
            reason: finalReason,
        };
    }
}

// Export a single instance for the app to use
export const framework = new OffloadingFramework();