"""
Test script to verify heatmap generation works correctly
"""

import os
import shutil
from ml.GradCam import get_cam_overlay
import cv2

def main():
    print("Testing heatmap generation...")
    
    # Ensure directories exist
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("heatmaps", exist_ok=True)
    
    # Test using the sample image from ml directory
    ml_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ml")
    test_image = os.path.join(ml_dir, "test.jpg")
    
    # Verify the test image exists
    if not os.path.exists(test_image):
        print(f"Error: Test image not found at {test_image}")
        return
    
    # Copy test image to uploads directory with a test ID
    test_id = "test_scan_123"
    test_upload_path = os.path.join("uploads", f"{test_id}_test.jpg")
    shutil.copy(test_image, test_upload_path)
    
    print(f"Copied test image to {test_upload_path}")
    
    # Generate heatmap
    try:
        print("Generating heatmap...")
        overlay = get_cam_overlay(test_upload_path)
        
        # Save the heatmap
        heatmap_path = os.path.join("heatmaps", f"{test_id}_heatmap.jpg")
        cv2.imwrite(heatmap_path, overlay)
        
        print(f"Heatmap generated and saved to {heatmap_path}")
        print("Test successful!")
    except Exception as e:
        print(f"Error generating heatmap: {e}")

if __name__ == "__main__":
    main() 