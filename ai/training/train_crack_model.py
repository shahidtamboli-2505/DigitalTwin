"""
Train Concrete Structural Crack Detector on real concrete lining images.
"""

import os
import cv2
import numpy as np
import joblib
from sklearn.svm import SVC
from sklearn.metrics import classification_report

def extract_features(img_path: str):
    """Extract computer vision features (Canny edge intensity, variance, Laplacian score)."""
    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError(f"Failed to load image: {img_path}")

    img_resized = cv2.resize(img, (256, 256))

    # Canny Edge Detection (cracks create high edge density)
    edges = cv2.Canny(img_resized, 50, 150)
    edge_density = np.mean(edges > 0)

    # Laplacian Variance (sharp crack edges increase variance)
    laplacian_var = cv2.Laplacian(img_resized, cv2.CV_64F).var()

    # Intensity Statistics
    mean_val = np.mean(img_resized)
    std_val = np.std(img_resized)
    min_val = np.min(img_resized)

    # Dark line features (cracks are thin dark lines)
    dark_ratio = np.mean(img_resized < (mean_val - 1.2 * std_val))

    return [edge_density, laplacian_var, mean_val, std_val, min_val, dark_ratio]


def main():
    dataset_dir = os.path.join("ai", "datasets", "cracks")
    X = []
    y = []
    filenames = []

    for fname in os.listdir(dataset_dir):
        if not fname.endswith((".jpg", ".png", ".jpeg")):
            continue
        fpath = os.path.join(dataset_dir, fname)
        feat = extract_features(fpath)
        X.append(feat)
        label = 1 if fname.startswith("crack") else 0
        y.append(label)
        filenames.append(fname)

    X = np.array(X)
    y = np.array(y)

    print(f"Loaded {len(X)} real concrete image feature vectors.")
    print("Features shape:", X.shape)

    model = SVC(probability=True, kernel="rbf", C=1.0)
    model.fit(X, y)

    y_pred = model.predict(X)
    print("\nTraining set performance on real dataset:")
    print(classification_report(y, y_pred, target_names=["Healthy Concrete", "Cracked Concrete"]))

    out_dir = os.path.join("ai", "models")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "crack_classifier.joblib")

    joblib.dump({"model": model, "feature_extractor": "opencv_canny_laplacian_v1"}, out_path)
    print(f"✅ Real Concrete Crack Classification model saved to: {out_path}")

if __name__ == "__main__":
    main()
