
#!/bin/bash
DIR=$(cd "$(dirname "$0")" && pwd)

(cd "$DIR/review-processing-py" && source venv/bin/activate && uvicorn main:app --reload --port 8001) &
(cd "$DIR/semantic-search-py" && source venv/bin/activate && uvicorn main:app --reload --port 8002) &
(cd "$DIR/feature-spec-py" && source venv/bin/activate && uvicorn main:app --reload --port 8003) &
wait
