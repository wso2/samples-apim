from typing import Any, Callable, Dict, Optional, Union
from pydantic import BaseModel, Field
import torch
import torch.nn.functional as F
from transformers import AutoModelForSequenceClassification, AutoTokenizer, BitsAndBytesConfig
from guardrails import Validator, register_validator
from guardrails.validator_base import PassResult, FailResult, ErrorSpan

class JailbreakRequest(BaseModel):
    text: str = Field(..., description="Text to validate for jailbreak attempts")

class JailbreakResponse(BaseModel):
    verdict: bool
    score: float
    
class InferenceOutput(BaseModel):
    score: float
    
class InferenceResult:
    """Class to store and format inference results."""

    def __init__(self, attack_score: float):
        self.attack_score = attack_score

    def to_dict(self) -> Dict[str, Any]:
        return {
            "attack_score": self.attack_score
        }
    
@register_validator(name="nimsara66/jailbreak", data_type="string")
class JailbreakDetectGuardrail(Validator):
    def __init__(
        self,
        model_name: str = "meta-llama/Llama-Prompt-Guard-2-86M",
        quant: bool = False,
        device: Optional[Union[str, int]] = -1,
        on_fail: Optional[Callable] = None,
        **kwargs,
    ):
        super().__init__(
            on_fail=on_fail,
            model_name=model_name,
            quant=quant,
            device=device,
            **kwargs,
        )
        self.model_name = model_name
        self._quantize = quant
        self._device = (
            str(device).lower()
            if str(device).lower() in ["cpu", "mps"]
            else int(device)  # type: ignore
        )
        
        self.tokenizer = None
        self.model = None
        self.warmup()
        
    def load_model(self):
        """Loads the model with or without quantization and proper GPU support."""
        compute_dtype = torch.float16
        attn_implementation = "sdpa"

        if torch.cuda.is_available():
            # Set precision based on GPU support
            if torch.cuda.is_bf16_supported():
                compute_dtype = torch.bfloat16
                print("✓ Using bfloat16 precision")
            else:
                compute_dtype = torch.float16
                print("✓ Using float16 precision")
            
            # Check for Flash Attention 2 support
            major, minor = torch.cuda.get_device_capability()
            if major >= 8:  # Ampere or newer
                try:
                    import flash_attn
                    attn_implementation = "flash_attention_2"
                    print("✓ Using Flash Attention 2")
                except ImportError:
                    attn_implementation = "sdpa"
                    print("⚠ Flash Attention 2 not available, using SDPA")
            else:
                attn_implementation = "sdpa" 
                print(f"⚠ GPU compute capability {major}.{minor} < 8.0, using SDPA")
        else:
            print("⚠ CUDA not available, using eager attention on CPU")

        print(f"Loading model with compute_dtype: {compute_dtype}, attention: {attn_implementation}")

        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, cache_dir="./models", token=True)
        
        # Configure model loading arguments
        model_kwargs = {
            "cache_dir": "./models",
            "token": True,
            "attn_implementation": attn_implementation,
            "torch_dtype": compute_dtype,
        }
        
        if self._quantize:
            model_kwargs["quantization_config"] = BitsAndBytesConfig(load_in_8bit=True)
            
        # Load model
        self.model = AutoModelForSequenceClassification.from_pretrained(
            self.model_name, **model_kwargs
        )
        
        # Move model to appropriate device if not quantized
        if not self._quantize and torch.cuda.is_available():
            self.model.to("cuda")
            print("✓ Model moved to CUDA")
        elif not self._quantize and str(self._device).lower() == "mps":
            self.model.to("mps")
            print("✓ Model moved to MPS")
        
    def warmup(self):
        """Warmup the model by loading it"""
        self.load_model()
        
    def _inference_local(self, model_input: str):
        """Perform inference with proper device handling."""
        inputs = self.tokenizer(model_input, return_tensors="pt")
        
        # Move inputs to the same device as the model
        if torch.cuda.is_available() and not self._quantize:
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
        elif str(self._device).lower() == "mps" and not self._quantize:
            inputs = {k: v.to("mps") for k, v in inputs.items()}
            
        with torch.no_grad():
            logits = self.model(**inputs).logits
        probs = F.softmax(logits, dim=-1)

        # Get the attack score
        attack_score = probs[0][self.model.config.label2id["LABEL_1"]].item()
        
        # Clear cache if using CUDA
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        return InferenceOutput(score=attack_score)
    
    def _validate(self, value: Any, metadata: Dict = {}) -> InferenceResult:
        """Validate the input value and return an InferenceResult."""
        if not isinstance(value, str):
            raise ValueError("Input value must be a string.")

        # Perform inference
        inference_output = self._inference_local(value)
        attack_score = inference_output.score
        # print(f"Attack score: {attack_score}")

        if attack_score == 0:
            return PassResult()
        else:
            return FailResult(
                error_message=f"The following text contains potential jailbreak attempt:\n{value}",
                error_spans=[ErrorSpan(start=0, end=-1, reason=str(attack_score))]
            )