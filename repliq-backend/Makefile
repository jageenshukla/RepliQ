# Top-level Makefile for RepliQ Backend
# Usage:
#   make setup   # Install all Node.js and Python dependencies
#   make help    # Show this help message
#   make check   # Check for required tools
#   make clean   # Remove all venvs and node_modules
#   make start   # Start all services (npm run start:all)
#   make stop    # Stop all running dev servers (Node.js & Python)

PY_SERVICES = review-processing-py semantic-search-py feature-spec-py

help:
	@echo "Available targets:"
	@echo "  setup   Install all Node.js and Python dependencies (venv, pip, npm)"
	@echo "  check   Check for required tools (make, python3, pip, npm)"
	@echo "  clean   Remove all venvs and node_modules (fresh install)"
	@echo "  start   Start all services (npm run start:all)"
	@echo "  stop    Stop all running dev servers (Node.js & Python)"
	@echo "  help    Show this help message"
	@echo "  check-health   Check health endpoints for all services"

check:
	@command -v python3 >/dev/null 2>&1 || { echo >&2 "python3 is not installed. Aborting."; exit 1; }
	@python3 -m pip --version >/dev/null 2>&1 || { echo >&2 "python3 -m pip is not available. Aborting."; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo >&2 "npm is not installed. Aborting."; exit 1; }
	@echo "All required tools are installed."

setup: check
	npm install
	@for dir in $(PY_SERVICES); do \
	  echo "Setting up Python service: $$dir"; \
	  cd $$dir && python3 -m venv venv && . venv/bin/activate && python3 -m pip install -r requirements.txt && deactivate && cd ..; \
	done

clean:
	rm -rf node_modules package-lock.json
	@for dir in $(PY_SERVICES); do \
	  echo "Cleaning Python service: $$dir"; \
	  rm -rf $$dir/venv $$dir/__pycache__ $$dir/*.pyc; \
	done

start:
	npm run start:all

stop:
	@echo "Stopping all Node.js and Python dev servers..."
	-@pkill -f nodemon || true
	-@pkill -f uvicorn || true
	@echo "All dev servers stopped."

check-health:
	./check_health.sh

# Run all Node.js service tests
.PHONY: test test-coverage test-python test-python-coverage

test-python:
	cd review-processing-py && pytest
	cd semantic-search-py && pytest
	cd feature-spec-py && pytest

test-python-coverage:
	cd review-processing-py && pytest --cov=.
	cd semantic-search-py && pytest --cov=.
	cd feature-spec-py && pytest --cov=.

test: 
	cd review-ingestion && npm test
	cd api-gateway && npm test
	cd approval && npm test
	cd notification && npm test
	cd jira-integration && npm test
	$(MAKE) test-python

test-coverage:
	cd review-ingestion && npm run test:coverage
	cd api-gateway && npm run test:coverage
	cd approval && npm run test:coverage
	cd notification && npm run test:coverage
	cd jira-integration && npm run test:coverage
	$(MAKE) test-python-coverage
