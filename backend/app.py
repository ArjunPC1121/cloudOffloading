from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os # Import os for path checking/debugging

from tasks import task_bp
from benchmark import benchmark_bp


# --- ML Model Setup (Runs when the server starts) ---

# Define file paths. Assuming they are in the same directory as app.py
MODEL_PATH = 'random_forest_model.pkl'
SCALER_PATH = 'scaler.pkl'
FEATURES_PATH = 'feature_columns.pkl'

# Initialize variables
MODEL = None
SCALER = None
FEATURE_COLUMNS = None
NUMERICAL_FEATURES = [
    'battery_level', 'latency_ms', 'matrix_size', 'image_size_kb', 
    'server_cpu_load', 'server_memory_percent'
]

try:
    # Check if files exist before trying to load (good practice for deployment)
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH) and os.path.exists(FEATURES_PATH):
        MODEL = joblib.load(MODEL_PATH)
        SCALER = joblib.load(SCALER_PATH)
        FEATURE_COLUMNS = joblib.load(FEATURES_PATH)
        print("ML Decision Model components loaded successfully.")
    else:
        print("WARNING: ML model files not found. Prediction endpoint will be disabled.")
        print(f"Expected files: {MODEL_PATH}, {SCALER_PATH}, {FEATURES_PATH}")

except Exception as e:
    print(f"ERROR: Failed to load ML components: {e}")
    MODEL = None
# --- End ML Model Setup ---


app = Flask(__name__)
app.register_blueprint(task_bp)
app.register_blueprint(benchmark_bp)
CORS(app)


# --- Existing Routes ---

@app.route("/status", methods=["GET"])
def status():
    return jsonify({"status": "Flask server is running"})


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify(status="ok")

# --- ML Prediction Route ---

@app.route('/predict_offload', methods=['POST'])
def predict_offload():
    """
    Receives features from the mobile app, runs the ML model, and returns the offloading decision.
    """
    if MODEL is None:
        return jsonify({"error": "ML decision model not available"}), 503

    try:
        # 1. Get JSON data (features) from the mobile app
        data = request.json 

        # 2. Convert to DataFrame
        input_df = pd.DataFrame([data])
        
        # 3. One-Hot Encode Categorical Features
        input_df = pd.get_dummies(
            input_df, 
            columns=['task_name', 'network_type', 'device_model_name']
        )

        # 4. Align columns (CRITICAL STEP)
        prediction_df = input_df.reindex(columns=FEATURE_COLUMNS, fill_value=0)
        
        # 5. Scale Numerical Features
        prediction_df[NUMERICAL_FEATURES] = SCALER.transform(prediction_df[NUMERICAL_FEATURES])
        
        # 6. Make Prediction
        prediction_class = MODEL.predict(prediction_df)[0]
        prediction_prob = MODEL.predict_proba(prediction_df)[0][prediction_class]

        # 7. Format Result
        result = 'remote' if prediction_class == 1 else 'local'

        return jsonify({
            "prediction": result,
            "probability": np.round(prediction_prob, 4),
            "status": "success",
            "model_used": "RandomForest"
        })

    except Exception as e:
        print(f"Prediction processing error: {e}")
        return jsonify({"error": f"Prediction failed due to internal error: {e}"}), 400

# --- Main Run Block ---

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)