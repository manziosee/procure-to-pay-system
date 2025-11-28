#!/usr/bin/env bash
# Render start script

echo "🚀 Starting Django application..."
gunicorn procure_to_pay.wsgi:application --bind 0.0.0.0:$PORT