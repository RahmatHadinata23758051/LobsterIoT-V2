import requests
import json

url = "http://127.0.0.1:8001/predict"
image_path = "lobster_asli.jpg"

print(f"Mengirim request ke {url} dengan gambar {image_path}...")
try:
    with open(image_path, "rb") as f:
        files = {"image": f}
        response = requests.post(url, files=files)
    
    print("\n--- Status Respon ---")
    print("Status Code:", response.status_code)
    
    print("\n--- Hasil Prediksi (JSON) ---")
    print(json.dumps(response.json(), indent=4))
except Exception as e:
    print("Terjadi kesalahan saat memanggil API:", str(e))
