from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import BartTokenizer, BartForConditionalGeneration
from huggingface_hub import login
import traceback
import os
from dotenv import load_dotenv

# Încarcă variabilele din fișierul .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# Variabile globale
tokenizer = None
model = None

# Preia token-ul din variabila de mediu
llama_token = os.getenv("LLAMA_TOKEN")
if not llama_token:
    raise ValueError("LLAMA_TOKEN nu este setat în fișierul .env sau în variabilele de mediu.")

# Autentificare Hugging Face CLI-style
login(token=llama_token)

# Încarcă tokenizer și model
try:
    print("Loading BART tokenizer...")
    tokenizer = BartTokenizer.from_pretrained("facebook/bart-large-cnn")
    print("Tokenizer loaded successfully.")

    print("Loading BART model...")
    model = BartForConditionalGeneration.from_pretrained("facebook/bart-large-cnn")
    print("Model loaded successfully.")
except Exception as e:
    print("=== Exception during model loading ===")
    traceback.print_exc()
    print("======================================")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Serverul Llama este activ!"})

@app.route("/summarize", methods=["POST"])
def summarize():
    if not tokenizer or not model:
        return jsonify({
            "error": "Modelul nu a fost încărcat corect. Verificați logurile serverului."
        }), 500

    uploaded = request.files.get("file")
    if not uploaded:
        return jsonify({"error": "Nu s-a trimis niciun fișier"}), 400

    try:
        text = uploaded.read().decode("utf-8")
    except Exception:
        return jsonify({"error": "Nu am putut citi fișierul ca text UTF-8"}), 400

    if not text.strip():
        return jsonify({"error": "Textul din fișier este gol"}), 400

    # Împărțirea textului în segmente
    try:
        inputs = tokenizer.encode(text, return_tensors="pt")
        chunks = [inputs[0][i:i+1024] for i in range(0, len(inputs[0]), 1024)]
        summaries = []

        for chunk in chunks:
            outputs = model.generate(
                chunk.unsqueeze(0),
                max_length=150,  # Lungimea maximă a rezumatului pentru fiecare segment
                min_length=50,   # Lungimea minimă a rezumatului pentru fiecare segment
                length_penalty=2.0,
                num_beams=4,
                early_stopping=True
            )
            summaries.append(tokenizer.decode(outputs[0], skip_special_tokens=True))

        # Combinarea rezumatelor într-un singur text
        final_summary = " ".join(summaries)
        return jsonify({"summary": final_summary})
    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Eroare la generarea rezumatului."}), 500

app = app  # Expune aplicația Flask pentru Vercel

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"Starting Flask server on port {port}...")
    app.run(host="0.0.0.0", port=port)
