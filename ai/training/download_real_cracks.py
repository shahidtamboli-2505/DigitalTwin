import os
import httpx

IMAGES = [
    ("non_crack_1.jpg", "https://raw.githubusercontent.com/FY387/Intelligent-segmentation-of-tunnel-lining-cracks/main/Background%20example-1.jpg"),
    ("non_crack_2.jpg", "https://raw.githubusercontent.com/FY387/Intelligent-segmentation-of-tunnel-lining-cracks/main/Background%20example-2.jpg"),
    ("non_crack_3.jpg", "https://raw.githubusercontent.com/FY387/Intelligent-segmentation-of-tunnel-lining-cracks/main/Background%20example-3.jpg"),
    ("crack_1.jpg", "https://raw.githubusercontent.com/FY387/Intelligent-segmentation-of-tunnel-lining-cracks/main/Crack%20example-1.jpg"),
    ("crack_2.jpg", "https://raw.githubusercontent.com/FY387/Intelligent-segmentation-of-tunnel-lining-cracks/main/Crack%20example-2.jpg"),
    ("crack_3.jpg", "https://raw.githubusercontent.com/FY387/Intelligent-segmentation-of-tunnel-lining-cracks/main/Crack%20example-3.jpg"),
]

def main():
    target_dir = os.path.join("ai", "datasets", "cracks")
    os.makedirs(target_dir, exist_ok=True)
    
    with httpx.Client(timeout=30.0) as client:
        for fname, url in IMAGES:
            out_path = os.path.join(target_dir, fname)
            print(f"Downloading real concrete image: {fname} from {url}...")
            r = client.get(url)
            r.raise_for_status()
            with open(out_path, "wb") as f:
                f.write(r.content)
            print(f"Saved {fname} ({len(r.content)} bytes)")

if __name__ == "__main__":
    main()
