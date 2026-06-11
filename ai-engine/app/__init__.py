# IntelliHire FastAPI Application Package
# WHY: Allows both `uvicorn app.main:app` and `uvicorn app:app` to work.
from app.main import app
