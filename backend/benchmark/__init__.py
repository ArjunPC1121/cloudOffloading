import flask
from flask import request, jsonify
import time
import pathlib
import sqlite3

pathlib.Path("data").mkdir(parents=True, exist_ok=True)

DB_FILE = "data/benchmark_data.db"


def init_db():
    """Initialize the SQLite database with the benchmark table."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS benchmark_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_timestamp REAL,
            task_name TEXT,
            network_type TEXT,
            wifi_strength INTEGER,
            wifi_frequency REAL,
            battery_level REAL,
            is_charging BOOLEAN,
            latency_ms REAL,
            matrix_size INTEGER,
            image_size_kb REAL,
            image_resolution TEXT,
            image_complexity TEXT,
            local_time_ms REAL,
            remote_time_ms REAL,
            device_manufacturer TEXT,
            device_model_name TEXT,
            os_name TEXT,
            os_version TEXT,
            total_memory REAL,
            server_cpu_load REAL,
            server_memory_percent REAL,
            server_compute_time_ms REAL,
            server_core_count INTEGER,
            server_cpu_model TEXT,
            server_cpu_freq_current REAL,
            server_cpu_freq_max REAL
        )
    """
    )

    conn.commit()
    conn.close()


# Initialize database on import
init_db()

benchmark_bp = flask.Blueprint("log_benchmark", __name__, url_prefix="/benchmark")


@benchmark_bp.route("/log", methods=["POST"])
def log_benchmark():
    data = request.json

    try:
        # Flatten the nested JSON into a single dictionary
        inputs = data.get("inputs", {})  # type: ignore
        outputs = data.get("outputs", {})  # type: ignore

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO benchmark_logs (
                log_timestamp, task_name, network_type, wifi_strength, wifi_frequency,
                battery_level, is_charging, latency_ms, matrix_size, image_size_kb,
                image_resolution, image_complexity, local_time_ms, remote_time_ms,
                device_manufacturer, device_model_name, os_name, os_version, total_memory,
                server_cpu_load, server_memory_percent, server_compute_time_ms,
                server_core_count, server_cpu_model, server_cpu_freq_current, server_cpu_freq_max
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                time.time(),
                inputs.get("task_name"),
                inputs.get("network_type"),
                inputs.get("wifi_strength"),
                inputs.get("wifi_frequency"),
                round(inputs.get("battery_level", 0), 3),
                inputs.get("is_charging"),
                round(inputs.get("latency_ms", 0), 3),
                inputs.get("matrix_size", 0),
                inputs.get("image_size_kb", 0),
                inputs.get("image_resolution"),
                inputs.get("image_complexity"),
                outputs.get("local_time_ms"),
                outputs.get("remote_time_ms"),
                inputs.get("device_manufacturer"),
                inputs.get("device_model_name"),
                inputs.get("os_name"),
                inputs.get("os_version"),
                inputs.get("total_memory"),
                outputs.get("server_cpu_load"),
                outputs.get("server_memory_percent"),
                outputs.get("server_compute_time_ms"),
                outputs.get("server_core_count"),
                outputs.get("server_cpu_model"),
                outputs.get("server_cpu_freq_current"),
                outputs.get("server_cpu_freq_max"),
            ),
        )

        conn.commit()
        conn.close()

        return jsonify(success=True, message="Log saved."), 200

    except Exception as e:
        print(f"Error logging benchmark: {e}")
        return jsonify(success=False, message="Error saving log."), 500


@benchmark_bp.route("/show", methods=["GET"])
def show_data():
    """Reads the SQLite database and displays it as an HTML table."""

    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row  # This allows us to access columns by name
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM benchmark_logs ORDER BY log_timestamp DESC")
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return "<h3>No data in the database yet.</h3>", 200

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
        headers = rows[0].keys()[1:]
        html += "<thead><tr>"
        for header in headers:
            html += f"<th>{header}</th>"
        html += "</tr></thead>"

        # 3. Create the table body with all the data
        html += "<tbody>"
        for row in rows:
            html += "<tr>"
            for header in headers:
                html += f"<td>{row[header] if row[header] is not None else ''}</td>"
            html += "</tr>"
        html += "</tbody>"

        # 4. Close the tags
        html += "</table></body></html>"

        return html

    except Exception as e:
        return f"<h1>Error reading database</h1><p>{e}</p>", 500


@benchmark_bp.route("/csv", methods=["GET"])
def get_csv():
    """Returns the data as CSV format for download."""

    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM benchmark_logs ORDER BY log_timestamp DESC")
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return jsonify(success=False, message="No benchmark data found."), 404

        # Build CSV content
        headers = list(rows[0].keys()[1:])
        csv_lines = [",".join(headers)]

        for row in rows:
            csv_row = []
            for header in headers:
                value = row[header]
                if value is None:
                    csv_row.append("")
                else:
                    csv_row.append(str(value))
            csv_lines.append(",".join(csv_row))

        csv_content = "\n".join(csv_lines)

        response = flask.Response(
            csv_content,
            mimetype="text/plain",
        )
        return response

    except Exception as e:
        return jsonify(success=False, message=f"Error reading database: {e}"), 500
