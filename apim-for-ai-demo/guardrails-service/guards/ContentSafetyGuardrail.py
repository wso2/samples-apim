from typing import Any, Callable, List, Dict, Optional, Union
from pydantic import BaseModel, Field
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from guardrails import Validator, register_validator
from guardrails.validator_base import PassResult, FailResult, ErrorSpan

class ContentSafetyRequest(BaseModel):
    text: str = Field(..., description="Conversation text to validate for unsafe content")
    categories: Dict[str, str] = Field(..., description="Map of category codes to descriptions")

class ContentSafetyResponse(BaseModel):
    verdict: bool
    categories: Optional[List[str]] = None  # List of categories if unsafe


@register_validator(name="nimsara66/content-safety", data_type="string")
class ContentSafetyGuardrail(Validator):
    def __init__(
        self,
        model_name: str = "https://huggingface.co/meta-llama/Llama-Guard-3-1B",
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
        else:
            # Set device_map only when not quantizing
            if torch.cuda.is_available():
                model_kwargs["device_map"] = "auto"
            elif str(self._device).lower() == "mps":
                model_kwargs["device_map"] = "mps"
            else:
                model_kwargs["device_map"] = "cpu"
            
        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name, **model_kwargs
        )
        
        # Manual device placement if needed (for non-auto device_map cases)
        if not self._quantize and "device_map" not in model_kwargs:
            if torch.cuda.is_available():
                self.model.to("cuda")
                print("✓ Model moved to CUDA")
            elif str(self._device).lower() == "mps":
                self.model.to("mps")
                print("✓ Model moved to MPS")

    def warmup(self):
        """Warmup the model by loading it"""
        self.load_model()

    def _moderate(self, categories: str, conversation: str) -> str:
        """Run moderation with Llama Guard."""
        prompt = f"""<|begin_of_text|><|start_header_id|>user<|end_header_id|>

<Important> Avoid detecting any privacy or PII related violations</Important>

Task: Check if there is unsafe content in conversations according our safety policy with the below categories.

<BEGIN UNSAFE CONTENT CATEGORIES>
{categories}
<END UNSAFE CONTENT CATEGORIES>

<BEGIN CONVERSATION>
{conversation}
<END CONVERSATION>

Provide your safety assessment for ONLY THE LAST Agent message in the above conversation:
 - First line must read 'safe' or 'unsafe'.
 - If unsafe, a second line must include a comma-separated list of violated categories.<|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

        inputs = self.tokenizer(prompt, return_tensors="pt")
        
        # Move inputs to the same device as the model if not using auto device_map
        if not self._quantize:
            if torch.cuda.is_available():
                inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
            elif str(self._device).lower() == "mps":
                inputs = {k: v.to("mps") for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=200,
                pad_token_id=self.tokenizer.eos_token_id,
                do_sample=False,  # Deterministic for safety classification
                temperature=0.1,
            )

        generated_text = self.tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[-1]:],
            skip_special_tokens=True
        )
        
        # Clear cache if using CUDA
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        return generated_text.strip()

    def _validate(self, value: Any, metadata: Dict = {}) -> Any:
        if not isinstance(value, str):
            raise ValueError("Input value must be a string (conversation JSON).")
        
        # --- Build categories string dynamically from metadata ---
        categories_str = "\n".join(
            f"{key}: {val}." for key, val in metadata.items()
        )

        result = self._moderate(categories_str, value)

        lines = [line.strip() for line in result.splitlines() if line.strip()]

        if not lines:
            return PassResult()

        if lines[0].lower() == "safe":
            return PassResult()

        # Unsafe case
        categories = []
        if len(lines) > 1:
            # Split categories by comma/space
            categories = [c.strip() for c in lines[1].split(",")]

        return FailResult(
            error_message=f"The following text contains unsafe content:\n{value}",
            error_spans=[
                ErrorSpan(start=0, end=-1, reason=",".join(categories) if categories else "unsafe")
            ]
        )
        