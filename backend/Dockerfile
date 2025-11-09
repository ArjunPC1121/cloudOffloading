FROM python:3.13-slim

WORKDIR /app

# RUN apt-get update && apt-get install ffmpeg libsm6 libxext6  -y
RUN apt-get update && apt-get install libgl1 -y

COPY docker_requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r docker_requirements.txt

COPY . .

EXPOSE 5000

# CMD ["flask", "--app", "log_app.py", "run", "--host", "0.0.0.0", "--port", "80"]
CMD ["gunicorn", "-b", "0.0.0.0:80", "-w", "8", "app:app"]