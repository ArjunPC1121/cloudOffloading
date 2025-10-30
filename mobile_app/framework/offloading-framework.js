import * as FileSystem from 'expo-file-system/legacy';
import { TASKS } from './constants';
import { localTaskExecutor } from './local-tasks';
import { remoteTaskExecutor } from './remote-tasks';

class OffloadingFramework {
    async shouldOffload(taskName, params) {
        const { networkState } = params;

        // 1. Global rule: No connection? No offload.
        if (!networkState.isConnected || networkState.type === 'unknown') {
            return { offload: false, reason: 'No network connection.' };
        }

        // 2. Task-Specific Rules
        switch (taskName) {

            case TASKS.MANIPULATE: {
                const { originalImage } = params;
                const fileInfo = await FileSystem.getInfoAsync(originalImage, { size: true });
                const fileSizeMB = fileInfo.size / (1024 * 1024);

                if (fileSizeMB < 1) {
                    return { offload: false, reason: `Image is small (${fileSizeMB.toFixed(2)} MB)` };
                }

                const isFastNetwork =
                    networkState.type === 'wifi' ||
                    networkState.details?.cellularGeneration === '4g' ||
                    networkState.details?.cellularGeneration === '5g';

                if (isFastNetwork) {
                    return { offload: true, reason: `Fast network (${networkState.type}) and large image.` };
                } else {
                    return { offload: false, reason: `Slow network (${networkState.type})` };
                }
            }

            case TASKS.MATRIX_MULTIPLY: {
                const { a, b } = params;
                const orderA = a.length;
                const orderB = b.length;

                // Rule 1: Small matrix? Run locally.
                if (orderA < 25 && orderB < 25) {
                    return { offload: false, reason: `Matrix size is small (${orderA}x${orderA})` };
                }

                // Rule 2: Large matrix. Check network.
                const isFastNetwork =
                    networkState.type === 'wifi' ||
                    networkState.details?.cellularGeneration === '4g' ||
                    networkState.details?.cellularGeneration === '5g';

                if (isFastNetwork) {
                    // Large matrix + fast network = OFFLOAD
                    return { offload: true, reason: `Fast network (${networkState.type}) for large matrix.` };
                } else {
                    // Large matrix + slow network = LOCAL
                    return { offload: false, reason: `Slow network (${networkState.type})` };
                }
            }

            case TASKS.GRAYSCALE: {
                return {offload: true, reason: 'Always offload grayscale task.'};
            }
            
            default:
                return { offload: false, reason: 'Unknown task.' };
        }
    }

    /**
     * The Executor.
     * This function calls the correct implementation.
     */
    async execute(taskName, params) {
        const start = Date.now();

        // 1. Get the decision and the reason
        const decision = await this.shouldOffload(taskName, params);

        let taskResult;
        try {
            if (decision.offload) {
                console.log(`Framework: Attempting offload. Reason: ${decision.reason}`);
                taskResult = await remoteTaskExecutor[taskName](params);
            } else {
                console.log(`Framework: Running locally. Reason: ${decision.reason}`);
                taskResult = await localTaskExecutor[taskName](params);
            }
        } catch (error) {
            // 2. Fallback logic
            console.warn(`Framework: Offload failed! ${error.message}. Falling back to local.`);
            taskResult = await localTaskExecutor[taskName](params);
        }

        const end = Date.now();
        console.log(`Framework: ${taskName} completed in ${end - start}ms.`);

        return {
            data: taskResult,
            timeMs: end - start,
            ranOn: decision.offload ? 'remote' : 'local',
            reason: decision.reason,
        };
    }
}

// Export a single instance for the app to use
export const framework = new OffloadingFramework();