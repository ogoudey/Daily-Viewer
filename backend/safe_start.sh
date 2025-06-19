#!/bin/bash


while true; do

  HOST=$1

  echo "Starting Python script..."
  
  python3 backend.py "$HOST"

  EXIT_CODE=$?
  echo "Python script exited with code $EXIT_CODE"

  # Optional: change the condition if you only want to restart on certain codes
  if [ $EXIT_CODE -eq 8 ]; then
    sleep 1  # optional delay
  else
    echo "Non-zero exit code. Exiting Bash script."
    break
  fi
done
