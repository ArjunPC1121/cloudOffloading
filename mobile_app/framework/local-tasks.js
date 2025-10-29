import { TASKS } from './constants';
const runGrayscaleLocally = (params) => {
    return new Promise(resolve => {
        setTimeout(() => {
            // Just return the original image URI as the "result", after delay
            resolve({ imageUri: params.originalImage });
        }, 800);
    });
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

    return Promise.resolve(product);
};


export const localTaskExecutor = {
    [TASKS.GRAYSCALE]: runGrayscaleLocally,
    [TASKS.MATRIX_MULTIPLY]: runMatrixLocally,
};