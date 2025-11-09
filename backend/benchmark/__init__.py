import flask
from flask import request, jsonify
import os
import csv
import time

DATA_FILE = "benchmark_data.csv"
CSV_HEADER = [
    "log_timestamp",
    "task_name",
    "network_type",
    "battery_level",
    "is_charging",
    "latency_ms",
    "matrix_size",
    "image_size_kb",
    "local_time_ms",
    "remote_time_ms",
]

benchmark_bp = flask.Blueprint("log_benchmark", __name__, url_prefix="/log-benchmark")


@benchmark_bp.route("/", methods=["POST"])
def log_benchmark():
    data = request.json

    try:
        # Flatten the nested JSON into a single dictionary
        inputs = data.get("inputs", {})  # type: ignore
        outputs = data.get("outputs", {})  # type: ignore

        data_row = {
            "log_timestamp": time.time(),
            "task_name": inputs.get("task_name"),
            "network_type": inputs.get("network_type"),
            "battery_level": round(inputs.get("battery_level"), 3),
            "is_charging": inputs.get("is_charging"),
            "latency_ms": round(inputs.get("latency_ms"), 3),
            "matrix_size": inputs.get("matrix_size", 0),
            "image_size_kb": inputs.get("image_size_kb", 0),
            "local_time_ms": outputs.get("local_time_ms"),
            "remote_time_ms": outputs.get("remote_time_ms"),
        }

        # Check if file exists to see if we need to write the header
        file_exists = os.path.exists(DATA_FILE)

        # Open the file in "append" mode
        with open(DATA_FILE, "a", newline="") as f:
            # Use DictWriter to write rows from our dictionary
            writer = csv.DictWriter(f, fieldnames=CSV_HEADER)

            if not file_exists:
                writer.writeheader()  # Write the header row

            writer.writerow(data_row)  # Write the data row

        return jsonify(success=True, message="Log saved."), 200

    except Exception as e:
        print(f"Error logging benchmark: {e}")
        return jsonify(success=False, message="Error saving log."), 500
