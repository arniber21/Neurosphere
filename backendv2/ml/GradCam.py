import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import numpy as np
import cv2

import torch.nn.functional as F

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self.hook_layers()

    def hook_layers(self):
        def forward_hook(module, input, output):
            self.activations = output

        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0]

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_backward_hook(backward_hook)

    def generate_cam(self, input_tensor, class_idx=None):
        self.model.eval()
        output = self.model(input_tensor)

        if class_idx is None:
            class_idx = torch.argmax(output, dim=1).item()

        self.model.zero_grad()
        class_score = output[:, class_idx]
        class_score.backward()

        gradients = self.gradients.detach().cpu().numpy()
        activations = self.activations.detach().cpu().numpy()

        weights = np.mean(gradients, axis=(2, 3))
        cam = np.zeros(activations.shape[2:], dtype=np.float32)

        for i, w in enumerate(weights[0]):
            cam += w * activations[0, i, :, :]

        cam = np.maximum(cam, 0)
        cam = cv2.resize(cam, (input_tensor.shape[2], input_tensor.shape[3]))
        cam = cam - np.min(cam)
        cam = cam / np.max(cam)
        return cam

def preprocess_image(image_path, input_size):
    transform = transforms.Compose([
        transforms.Resize(input_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    image = Image.open(image_path).convert('RGB')
    return transform(image).unsqueeze(0)

def overlay_cam_on_image(image, cam, alpha=0.5):
    heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    heatmap = np.float32(heatmap) / 255
    overlay = heatmap + np.float32(image)
    overlay = overlay / np.max(overlay)
    return np.uint8(255 * overlay)

def predict(image_path):
    labels = ['notumor', 'glioma', 'meningioma', 'pituitary']

    # Load trained brain tumor model
    model = models.resnet18(pretrained=True)
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_ftrs, 512),  
        nn.ReLU(),                
        nn.Dropout(0.5),           
        nn.Linear(512, 4)          
    )
    model.load_state_dict(torch.load('resnet18_finetuned.pth'))

    # Check for tumor type
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    img = Image.open(img_path).convert('RGB')
    img = test_transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(img)
        _, predicted = torch.max(outputs, 1)
    
    return labels[predicted.item()]

def get_cam_overlay(image_path):
    # Load the original image for visualization
    original_image = cv2.imread(image_path)
    original_image = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)
    original_image = cv2.resize(original_image, (224, 224))

    # Check if tumor actually exists
    label = predict(image_path)

    # Do not add overlay if no tumor is detected
    if label == 'notumor':
        return original_image

    # Select target layer in neural network for Grad CAM
    target_layer = model.layer4[-1]  # Replace with the correct target layer

    # Initialize Grad-CAM
    grad_cam = GradCAM(model, target_layer)

    # Preprocess the input imageinput_tensor = preprocess_image(image_path, input_size=(224, 224))
    input_tensor = preprocess_image(image_path, input_size=(224, 224))

    # Generate Grad-CAM
    cam = grad_cam.generate_cam(input_tensor)

    # Overlay CAM on the image
    overlay = overlay_cam_on_image(original_image / 255.0, cam)

    return overlay

def get_brain_region(image_path, image, cam):
    # Check tumor type / existence
    label = predict(image_path)
    if label == 'notumor':
        return "None"
    elif label == 'pituitary':
        return "Pituitary"
    
    # Find the point of maximum intensity in the CAM
    max_idx = np.unravel_index(np.argmax(cam, axis=None), cam.shape)
    tumor_point = (max_idx[1], max_idx[0])  # (x, y) coordinates

    # Map the point back to the original image dimensions
    h_ratio = image.shape[0] / cam.shape[0]
    w_ratio = image.shape[1] / cam.shape[1]
    tumor_point = (int(tumor_point[0] * w_ratio), int(tumor_point[1] * h_ratio))

    # Convert the image to grayscale for edge detection
    gray_image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

    # Blur to smooth
    blurred = cv2.GaussianBlur(gray_image, (5, 5), 0)

    # Use Canny edge detection to find edges in the image
    edges = cv2.Canny(blurred, threshold1=30, threshold2=100)

    # Morphological close to fill gaps
    kernel = np.ones((5, 5), np.uint8)
    closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

    # Find contours from the edges
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Find the largest contour, assuming it corresponds to the brain
    largest_contour = max(contours, key=cv2.contourArea)

    # Fit a bounding box around the largest contour
    x, y, w, h = cv2.boundingRect(largest_contour)
    bbox_x_min, bbox_y_min = x, y
    bbox_x_max, bbox_y_max = x + w, y + h

    # Draw the bounding box on the image
    cv2.rectangle(image, (bbox_x_min, bbox_y_min), (bbox_x_max, bbox_y_max), (0, 255, 0), 2)

    # Draw the tumor point on the image
    cv2.circle(image, tumor_point, radius=5, color=(255, 0, 0), thickness=-1)

    # Calculate the relative position of the tumor within the bounding box
    relative_x = (tumor_point[0] - bbox_x_min) / (bbox_x_max - bbox_x_min)
    relative_y = (tumor_point[1] - bbox_y_min) / (bbox_y_max - bbox_y_min)

    if relative_y < 0.5:
        return "Frontal"
    elif relative_y > 0.75:
        return "Occipital"
    elif relative_x > 0.225 and relative_x < 0.775:
        return "Parietal"
    return "Temporal"