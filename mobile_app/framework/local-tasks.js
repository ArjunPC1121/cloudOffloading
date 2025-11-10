import * as ImageManipulator from 'expo-image-manipulator';
import { TASKS } from './constants';

/**
 * Performs multiple local image manipulations (Rotate, Flip, Resize, and low compression)
 * to ensure a noticeable processing time, then returns a new local URI.
 * @param {object} params
 * @param {string} params.originalImage The URI of the image to process.
 * @returns {Promise<{imageUri: string}>} A promise that resolves with the URI of the processed image.
 */
const runManipulateLocally = async (params) => {
    console.log('Running extended image manipulation locally for longer delay...');

    const { originalImage } = params;

    //Added more actions and reduced compression for a longer task
    const actions = [
        { rotate: 90 },
        { flip: ImageManipulator.FlipType.Vertical }, // New step: Flip vertically
        { resize: { width: 600 } },
    ];

    const saveOptions = {
        compress: 0.1, // Reduced compression (0.1 = highest quality/largest file/slower save)
        format: ImageManipulator.SaveFormat.JPEG,
    };

    try {
        const manipResult = await ImageManipulator.manipulateAsync(
            originalImage,
            actions,
            saveOptions
        );

        return { imageUri: manipResult.uri };

    } catch (error) {
        console.error("Error during image manipulation:", error);
        // Fallback: return the original image URI on failure
        return { imageUri: originalImage }; 
    }
};

/**
 * Performs a simple image flip locally (light task).
 * @param {object} params
 * @returns {Promise<{imageUri: string}>}
 */
const runFlipLocally = async (params) => {
    console.log('Running simple flip locally (light task)...');
    const { originalImage } = params;
    
    try {
        const manipResult = await ImageManipulator.manipulateAsync(
            originalImage,
            [{ flip: ImageManipulator.FlipType.Horizontal }],
            { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG } // High compression for speed
        );
        return { imageUri: manipResult.uri };
    } catch (error) {
        console.error("Error during local flip:", error);
        return { imageUri: originalImage };
    }
};

/**
 * Performs a resizing operation to simulate local grayscale work.
 * @param {object} params
 * @returns {Promise<{imageUri: string}>}
 */
const runGrayscaleLocally = async (params) => {
    console.log('Running grayscale image manipulation locally (simulated)...');
    const { originalImage } = params;

    const actions = [
        // Using resize as a proxy for local image processing
        { resize: { width: 800 } }, 
    ];

    const saveOptions = {
        compress: 0.9, 
        format: ImageManipulator.SaveFormat.JPEG,
    };

    try {
        const manipResult = await ImageManipulator.manipulateAsync(
            originalImage,
            actions,
            saveOptions
        );
        return { imageUri: manipResult.uri };

    } catch (error) {
        console.error("Error during grayscale simulation:", error);
        return { imageUri: originalImage };
    }
};


const runMatrixLocally = (params) => {
    console.log('Running matrix locally...');
    const { a, b } = params; // Get matrices from params

    const rowsA = a.length;
    const colsA = a[0].length;
    const rowsB = b.length;
    const colsB = b[0].length;

    if (colsA !== rowsB) {
        // Use a standard Error object
        throw new Error('Incompatible matrix dimensions for multiplication'); 
    }

    const product = [];
    for (let i = 0; i < rowsA; i++) {
        product[i] = [];
        for (let j = 0; j < colsB; j++) {
            product[i][j] = 0;
            for (let k = 0; k < colsA; k++) {
                product[i][j] += a[i][k] * b[k][j];
            }
        }
    }

    // Return the full object instead of just the result
    const result = { result: product };

    return Promise.resolve(result);
};


export const localTaskExecutor = {
    [TASKS.MANIPULATE]: runManipulateLocally,
    [TASKS.MATRIX_MULTIPLY]: runMatrixLocally,
    [TASKS.GRAYSCALE]: runGrayscaleLocally, // Added missing task
    [TASKS.FLIP_LOCAL]: runFlipLocally,
};