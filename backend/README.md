# Neurosphere Backend API

Backend REST API for Neurosphere, a system for CT scan processing and 3D brain model visualization.

## Features

- Authentication via Clerk SDK
- CT scan upload and processing
- ML-based tumor detection
- 3D visualization generation
- User statistics

## Getting Started

### Prerequisites

- Python 3.8+
- Virtual environment (recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/neurosphere-backend.git
cd neurosphere-backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file with your configuration:
```
CLERK_API_KEY=your_clerk_api_key
CLERK_FRONTEND_API=your_clerk_frontend_api
```

### Running the API

```bash
python main.py
```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, access the OpenAPI documentation at:
- http://localhost:8000/docs
- http://localhost:8000/redoc

## Development

This project uses FastAPI with the following structure:
- `main.py` - Application entry point
- `routers/` - API route modules
  - `auth.py` - Authentication routes
  - `scans.py` - CT scan management
  - `visualizations.py` - 3D visualization
  - `users.py` - User statistics

## TODO

- Implement actual authentication with Clerk
- Set up file storage system
- Implement ML pipeline
- Integrate 3D visualization generation 