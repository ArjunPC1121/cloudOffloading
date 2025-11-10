import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

def train_and_save_model(data_path="benchmark_data.csv"):
    """
    Loads the dataset, preprocesses it, trains the Random Forest model,
    and saves the model, scaler, and feature list for deployment.
    """
    print("--- Starting Model Training Pipeline ---")
    
    # 1. Load Data
    try:
        df = pd.read_csv(data_path)
    except FileNotFoundError:
        print(f"ERROR: Dataset file not found at {data_path}. Aborting.")
        return
    
    print(f"Successfully loaded {len(df)} records.")

    # 2. Define Target Variable: Optimal Offload (1 if remote_time is faster, 0 otherwise)
    df['optimal_offload'] = np.where(df['remote_time_ms'] < df['local_time_ms'], 1, 0)
    y = df['optimal_offload']
    
    # Check target balance
    remote_count = y.sum()
    local_count = len(y) - remote_count
    print(f"Optimal Decision Distribution: Local={local_count}, Remote={remote_count}")
    
    # 3. Define Features (X)
    features = [
        'task_name', 'network_type', 'device_model_name',
        'battery_level', 'is_charging', 'latency_ms',
        'matrix_size', 'image_size_kb', 'server_cpu_load', 'server_memory_percent'
    ]
    X = df[features]
    
    # Identify numerical columns for scaling
    numerical_features = [
        'battery_level', 'latency_ms', 'matrix_size', 'image_size_kb',
        'server_cpu_load', 'server_memory_percent'
    ]

    # 4. Preprocessing: One-Hot Encode Categorical Features
    X = pd.get_dummies(X, columns=['task_name', 'network_type', 'device_model_name'], drop_first=True)
    
    # 5. Split Data (Stratified split ensures the rare 'remote' class is preserved in both sets)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    
    print(f"Training on {len(X_train)} samples, Testing on {len(X_test)} samples.")

    # 6. Scaling Numerical Features
    scaler = StandardScaler()
    X_train[numerical_features] = scaler.fit_transform(X_train[numerical_features])
    X_test[numerical_features] = scaler.transform(X_test[numerical_features])

    # 7. Model Training (Random Forest)
    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        class_weight='balanced', # Essential for imbalanced data
        max_depth=5 
    )
    model.fit(X_train, y_train)

    # 8. Evaluation
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("\n--- Model Evaluation ---")
    print(classification_report(y_test, y_pred))
    roc_auc = roc_auc_score(y_test, y_prob)
    print(f"ROC AUC Score: {roc_auc:.4f}")

    # 9. Save Components for Deployment
    joblib.dump(scaler, 'scaler.pkl')
    joblib.dump(model, 'random_forest_model.pkl')
    # Save the final column list to ensure correct feature ordering in the API
    joblib.dump(X_train.columns.tolist(), 'feature_columns.pkl')

    print("\n--- Deployment Files Saved Successfully ---")
    print("Files: scaler.pkl, random_forest_model.pkl, feature_columns.pkl")


if __name__ == "__main__":
    train_and_save_model()