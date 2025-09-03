# Guardrails Service

## How to Run

1. Install dependencies:
	```bash
	pip install -r requirements.txt
	```

2. Set your Hugging Face token:
	```bash
	export HF_TOKEN="your_huggingface_token"
	```

3. Start the server with Gunicorn:
	```bash
	gunicorn -w 1 -k uvicorn.workers.UvicornWorker server:app -b 0.0.0.0:8000
	```
