from flask import Flask, jsonify
from flask_cors import CORS

from tasks import task_bp
from benchmark import benchmark_bp


app = Flask(__name__)
app.register_blueprint(task_bp)
app.register_blueprint(benchmark_bp)
CORS(app)


@app.route("/status", methods=["GET"])
def status():
    return jsonify({"status": "Flask server is running"})


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify(status="ok")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
