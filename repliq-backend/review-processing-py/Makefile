# Makefile for review-processing-py
# Usage:
#   make start      # Start in production mode (no reload)
#   make start-dev  # Start in dev mode (hot-reload on code changes)
#   make help       # Show this help message

VENV?=.venv
PYTHON?=$(VENV)/bin/python
UVICORN?=$(VENV)/bin/uvicorn

help:
	@echo "Available targets:"
	@echo "  start      Start the service (prod, no reload)"
	@echo "  start-dev  Start the service in dev mode (hot-reload)"
	@echo "  help       Show this help message"
	@echo "  test       Run all tests with pytest"
	@echo "  coverage   Run tests and check for 80%+ code coverage"

install:
	@echo "Setting up virtual environment and installing dependencies..."
	@if [ ! -d "$(VENV)" ]; then python3 -m venv $(VENV); fi
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r requirements.txt
	$(PYTHON) -m pip install pytest pytest-cov

start:
	@echo "Starting the server..."
	$(UVICORN) src.main:app --host 0.0.0.0 --port 3002

test:
	@echo "Running tests with pytest..."
	$(PYTHON) -m pytest

coverage:
	@echo "Running tests with coverage enforcement (min 80%)..."
	$(PYTHON) -m pytest --cov=src --cov-fail-under=80

start-dev:
	@echo "Starting the server in development mode with hot-reloading..."
	$(UVICORN) src.main:app --host 0.0.0.0 --port 3002 --reload
