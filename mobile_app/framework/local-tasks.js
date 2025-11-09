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
    [TASKS.FLIP_LOCAL]: runManipulateLocally,
};