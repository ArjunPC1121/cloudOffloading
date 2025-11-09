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
    "wifi_strength",
    "wifi_frequency",
    "battery_level",
    "is_charging",
    "latency_ms",
    "matrix_size",
    "image_size_kb",
    "image_resolution",
    "image_complexity",
    "local_time_ms",
    "remote_time_ms",
    "device_manufacturer",
    "device_model_name",
    "os_name",
    "os_version",
    "total_memory",
    "server_cpu_load",
    "server_memory_percent",
    "server_compute_time_ms",
    "server_core_count",
    "server_cpu_model",
    "server_cpu_freq_current",
    "server_cpu_freq_max",
]

benchmark_bp = flask.Blueprint("log_benchmark", __name__, url_prefix="/benchmark")


@benchmark_bp.route("/log", methods=["POST"])
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
            "wifi_strength": inputs.get("wifi_strength"),
            "wifi_frequency": inputs.get("wifi_frequency"),
            "battery_level": round(inputs.get("battery_level"), 3),
            "is_charging": inputs.get("is_charging"),
            "latency_ms": round(inputs.get("latency_ms"), 3),
            "matrix_size": inputs.get("matrix_size", 0),
            "image_size_kb": inputs.get("image_size_kb"),
            "image_resolution": inputs.get("image_resolution"),
            "image_complexity": inputs.get("image_complexity"),
            "image_size_kb": inputs.get("image_size_kb", 0),
            "local_time_ms": outputs.get("local_time_ms"),
            "remote_time_ms": outputs.get("remote_time_ms"),
            "device_manufacturer": inputs.get("device_manufacturer"),
            "device_model_name": inputs.get("device_model_name"),
            "os_name": inputs.get("os_name"),
            "os_version": inputs.get("os_version"),
            # We'll modify the task endpoint to send this
            "server_cpu_load": outputs.get("server_cpu_load"),
            "server_memory_percent": outputs.get("server_memory_percent"),
            "server_compute_time_ms": outputs.get("server_compute_time_ms"),
            "server_core_count": outputs.get("server_core_count"),
            "server_cpu_model": outputs.get("server_cpu_model"),
            "server_cpu_freq_current": outputs.get("server_cpu_freq_current"),
            "server_cpu_freq_max": outputs.get("server_cpu_freq_max"),
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


@benchmark_bp.route("/show", methods=["GET"])
def show_data():
    """Reads the CSV file and displays it as an HTML table."""

    # Check if the file exists
    if not os.path.exists(DATA_FILE):
        return "<h3>Benchmark data file not found.</h3>", 404

    # Read all data from the CSV
    data_rows = []
    try:
        with open(DATA_FILE, "r", newline="") as f:
            reader = csv.DictReader(f)
            data_rows = list(reader)
    except Exception as e:
        return f"<h1>Error reading CSV</h1><p>{e}</p>", 500

    if not data_rows:
        return "<h3>No data in the CSV file yet.</h3>", 200

    # --- Build the HTML string ---

    # 1. Start with a simple style for the table
    html = """
    <html>
    <head>
        <title>Benchmark Data</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; position: sticky; top: 0; }
            tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
    </head>
    <body>
        <h1>Benchmark Data</h1>
        <table>
    """

    # 2. Create the table header
    headers = data_rows[0].keys()
    html += "<thead><tr>"
    for header in headers:
        html += f"<th>{header}</th>"
    html += "</tr></thead>"

    # 3. Create the table body with all the data
    html += "<tbody>"
    for row in data_rows:
        html += "<tr>"
        for header in headers:
            html += f"<td>{row.get(header, '')}</td>"
        html += "</tr>"
    html += "</tbody>"

    # 4. Close the tags
    html += "</table></body></html>"

    return html


@benchmark_bp.route("/csv", methods=["GET"])
def get_csv():
    """Returns the CSV file for download."""

    # Check if the file exists
    if not os.path.exists(DATA_FILE):
        return jsonify(success=False, message="Benchmark data file not found."), 404

    try:
        with open(DATA_FILE, "r", newline="") as f:
            csv_content = f.read()

        response = flask.Response(
            csv_content,
            mimetype="text/plain",
        )
        return response

    except Exception as e:
        return jsonify(success=False, message=f"Error reading CSV file: {e}"), 500
