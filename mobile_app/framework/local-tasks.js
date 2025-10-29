import { TASKS } from './constants';
import { Image as CanvasImage } from 'react-native-canvas';
const runGrayscaleLocally = (params) => {
    return new Promise((resolve, reject) => {
        try {
            // 1. Get the *ready canvas* and asset from params
            const { originalImage, canvas } = params;

            // 2. Check if the canvas was passed
            if (!canvas) {
                return reject(new Error('Canvas object was not provided.'));
            }

            const ctx = canvas.getContext('2d');
            const image = new CanvasImage(canvas); // Pass the canvas to the image

            // 3. Set dimensions (this will work now)
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;

            // 4. Set onload handler
            image.onload = () => {
                ctx.drawImage(image, 0, 0, originalImage.width, originalImage.height);

                const imageData = ctx.getImageData(0, 0, originalImage.width, originalImage.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const avg = 0.299 * r + 0.587 * g + 0.114 * b;
                    data[i] = avg;
                    data[i + 1] = avg;
                    data[i + 2] = avg;
                }

                ctx.putImageData(imageData, 0, 0);

                const newImageBase64 = canvas.toDataURL('image/jpeg');
                resolve({ imageUri: newImageBase64 });
            };

            image.onerror = (err) => {
                reject(new Error('Canvas image failed to load: ' + err));
            };

            // 5. Load the image
            image.src = originalImage.uri;

        } catch (err) {
            reject(err);
        }
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