# Neurosphere

Neurosphere is an application that helps doctors analyze MRI scans using advanced visualization and machine learning techniques.

## Features

- Upload and process MRI scans
- Automatic tumor detection
- Interactive 3D visualization of brain and tumor regions
- Comprehensive scan management dashboard
- Detailed scan reports with findings

## Tech Stack

- **Frontend**: React, React Router, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), MongoDB
- **ML/Visualization**: Python with visualization libraries

## Project Structure

The project is organized into two main components:

- `neurosphere/`: Frontend React application
- `backendv2/`: Backend FastAPI service

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python 3.9+
- MongoDB

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/neurosphere.git
   cd neurosphere
   ```

2. Install frontend dependencies:
   ```
   cd neurosphere
   npm install
   ```

3. Install backend dependencies:
   ```
   cd ../backendv2
   pip install -r requirements.txt
   ```

4. Make sure MongoDB is running:
   ```
   mongod --config /usr/local/etc/mongod.conf --fork
   ```

### Running the Application

You can start both the frontend and backend with the provided script:

```
./run-dev.sh
```

Or run them individually:

**Backend:**
```
cd backendv2
python -m uvicorn main:app --reload --port 8000
```

**Frontend:**
```
cd neurosphere
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## API Documentation

The API documentation is available at http://localhost:8000/docs when the backend is running.

## License

[MIT License](LICENSE)