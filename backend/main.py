from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import subprocess
import tempfile
import os
import shutil

app = FastAPI(title="ScoreFlow OMR API")

# Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/omr")
async def process_omr(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Only PNG and JPEG images are supported.")
    
    # Create a temporary directory to avoid conflicts
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Save uploaded image
        img_path = os.path.join(temp_dir, file.filename)
        with open(img_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Find oemer executable path based on sys.executable (which points to python in venv)
        import sys
        oemer_exec = os.path.join(os.path.dirname(sys.executable), "oemer")
        if os.name == 'nt':
            oemer_exec += ".exe"
            
        if not os.path.exists(oemer_exec):
            oemer_exec = "oemer" # fallback to PATH
            
        # Run oemer via subprocess
        # Command: oemer path/to/image.png -o path/to/output
        # It takes some time as it runs AI models
        print(f"Starting Oemer for {file.filename}...")
        result = subprocess.run(
            [oemer_exec, img_path, "-o", temp_dir],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print("Oemer Error:", result.stderr)
            raise HTTPException(status_code=500, detail="Oemer failed to process the image.")
            
        # Oemer generates a file with the same name but .musicxml extension
        base_name = os.path.splitext(file.filename)[0]
        musicxml_path = os.path.join(temp_dir, f"{base_name}.musicxml")
        
        if not os.path.exists(musicxml_path):
            raise HTTPException(status_code=500, detail="Oemer finished but MusicXML file was not found.")
            
        with open(musicxml_path, "r", encoding="utf-8") as f:
            musicxml_content = f.read()
            
        return JSONResponse(content={"musicxml": musicxml_content})
        
    finally:
        # Clean up temporary directory
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
