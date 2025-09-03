import torch
import re
import json

from guardrails.validator_base import (
    FailResult,
    PassResult,
    ValidationResult,
    Validator,
    register_validator,
)
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    pipeline,
)
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Callable, Any, Union, Tuple

class HallucinationGuardResponse(BaseModel):
    verdict: bool
    reason: str = Field(..., description="Reason for hallucination verdict")
    
class HallucinationGuardRequest(BaseModel):
    question: str = Field(..., description="Question to validate for hallucination")
    answer: str = Field(..., description="Answer to validate for hallucination")
    context: Optional[str] = Field(None, description="Context to validate for hallucination")

SYSTEM_PROMPT = """

If provided ###CONTEXT###, treat the given information as source of truth bypassing any previously obtained knowledge.
"""

@register_validator(name="nimsara66/grounded_ai_hallucination", data_type="object")
class GroundedAIHallucination(Validator):
    """Validates whether a given response is a hallucination based on the provided question, answer
    and optional context.
    """

    def __init__(
        self,
        model_name: str = "meta-llama/Llama-3.2-3B-Instruct",
        quant: bool = False,
        device: Optional[Union[str, int]] = -1,
        on_fail: Optional[Callable] = None,
        verbose: bool = False,
        **kwargs,
    ):
        super().__init__(
            on_fail=on_fail,
            model_name=model_name,
            quant=quant,
            device=device,
            **kwargs,
        )
        self.verbose = verbose
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
                
        self.pipe = pipeline(
            "text-generation",
            model=self.model_name,
            torch_dtype=torch.bfloat16,
            device_map="auto",
            temperature=0.1,
            return_full_text=False,  # This removes the input from output
        )

    def warmup(self):
        """Warmup the model by loading it"""
        self.load_model()
    
    ## Llama 3B
    def make_final_decision(self, context: str, question: str, answer: str) -> str:
        """Make final decision about hallucination based on analysis"""
        prompt = [
            {"role": "system", "content": "Based on a given context extract the key facts. Then reason and evaluate whether a given answer to a question is supported by the extract the key facts and factually correct. Answer only [True] or [False]."},
            {"role": "user", "content": f"Context: {context}\n\nQuestion: {question}\n\nAnswer: {answer}\n\nIs the answer supported by the context and factually correct? ([True]/[False]):"}
        ]
        
        response = self.pipe(prompt, max_new_tokens=1024)
        return response[0]['generated_text'].strip()
    
    def detect_hallucination(self, knowledge: str, question: str, reference_answer: str, verbose: bool = False) -> Tuple[str, Dict[str, Any]]:
        """
        Enhanced hallucination detection with multi-step reasoning
        
        Returns:
            Tuple of (decision, details_dict)
        """
        analysis = self.make_final_decision(knowledge, question, reference_answer)
        
        if "[False]" in analysis:
            final_decision = True
        else:
            final_decision = False

        details = {
            'analysis': analysis,
            'decision': final_decision
        }
        
        if verbose:
            print(f"Analysis: {analysis}")
            print(f"Decision: {final_decision}")
            print("=" * 50)
        
        return final_decision, details

    def _validate(
        self, value: str, metadata: Dict[str, Any], **kwargs
    ) -> ValidationResult:
        answer = value
        question = metadata.get("question", "")
        context = metadata.get("context", "")

        decision, details = self.detect_hallucination(context, question, answer, self.verbose)
        
        ## LLama 3B
        if decision:
            return FailResult(
                error_message=json.dumps(details, indent=2),
            )
        return PassResult()
