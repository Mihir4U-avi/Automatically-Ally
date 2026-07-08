import os
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

def download_local_model():
    model_name = "Falconsai/text_summarization"
    save_directory = "./ml_models/summarizer"
    
    print(f"Downloading {model_name} to {save_directory}...")
    os.makedirs(save_directory, exist_ok=True)
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    
    tokenizer.save_pretrained(save_directory)
    model.save_pretrained(save_directory)
    print("Download and save complete! The model is now ready for offline CPU execution.")

if __name__ == "__main__":
    download_local_model()
