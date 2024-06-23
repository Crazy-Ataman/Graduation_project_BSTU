import os
import sys
import nltk
import torch
import logging
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    T5TokenizerFast,
    T5ForConditionalGeneration,
    PreTrainedTokenizer,
    PreTrainedTokenizerFast
)
from abc import ABC, abstractmethod
from typing import Union
from dotenv import load_dotenv
from transformers.utils import ModelOutput

nltk.download('punkt')
dotenv_path = 'app/.env'

if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path, override=False)

BEAUTIFY_MODEL: str = os.getenv("BEAUTIFY_MODEL")


class AbstractModel(ABC):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    @staticmethod
    def __encode(tokenizer: Union[PreTrainedTokenizer, PreTrainedTokenizerFast],
                 text: Union[str, list], **params: dict) -> Union[list[int], torch.Tensor]:
        return tokenizer(text, **params).input_ids

    @staticmethod
    def __generate(model, tokens: Union[list[int], torch.Tensor],
                   **params: dict) -> Union[ModelOutput, torch.LongTensor]:
        return model.generate(tokens, **params)

    @staticmethod
    def __decode(tokenizer: Union[PreTrainedTokenizer, PreTrainedTokenizerFast],
                 tokens: Union[ModelOutput, torch.LongTensor]) -> Union[str, list]:
        return tokenizer.batch_decode(tokens, skip_special_tokens=True)

    def processing(self, tokenizer: Union[PreTrainedTokenizer, PreTrainedTokenizerFast],
                   model, text: Union[str, list], encode_params: dict, generate_params: dict) -> Union[str, list]:
        encoded = self.__encode(tokenizer, text, **encode_params)
        generated = self.__generate(model, encoded, **generate_params)
        decoded = self.__decode(tokenizer, generated)
        return decoded

    def split_text_into_sentences(self, text: str) -> list:
        sentences: list = nltk.sent_tokenize(text)
        return sentences

    @abstractmethod
    def get_response(self, text: Union[str, list]) -> Union[str, list]:
        pass

class ParaphraseModel(AbstractModel):
    def __init__(self, model_path: str = BEAUTIFY_MODEL):
        self.__tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.__model = AutoModelForSeq2SeqLM.from_pretrained(model_path).to(self.device)

    def split_text_into_sentences(self, text: str) -> list:
        pass

    def _output_validation(self, original_text: str, output_lines: list) -> list:
        original_has_question = '?' in original_text

        if original_has_question:
            return output_lines

        validated_output_lines = []
        for line in output_lines:
            if '?' not in line:
                validated_output_lines.append(line)

        return validated_output_lines

    def get_response(self, text: str, mode: str, temperature: float = 0.8, num_return_sequences: int = 3) -> list:
        output = self.generate(text, mode, temperature, num_return_sequences * 2)
        validated_output = self._output_validation(text, output)

        try:
            if len(validated_output) >= num_return_sequences:
                return validated_output[:num_return_sequences]
            else:
                num_gen_sequences = 12
                while len(validated_output) < num_return_sequences:
                    output = self.generate(text, mode, temperature, num_gen_sequences)
                    for item in self._output_validation(text, output):
                        if item not in validated_output:
                            validated_output.append(item)
                    num_gen_sequences = num_gen_sequences * 2
                return validated_output[:num_return_sequences]
        except Exception as ex:
            print(ex)

    def generate(self, text: str, mode: str = 'default', temperature: float = 0.8, num_return_sequences: int = 3) -> list:
        encode_params: dict = {
            "padding": "longest",
            "return_tensors": "pt"
        }
        if mode == 'default':
            generate_params: dict = {
                "num_beams": num_return_sequences,
                "num_beam_groups": num_return_sequences,
                "num_return_sequences": num_return_sequences,
                "repetition_penalty": 6.0,
                "diversity_penalty": 4.0,
                "no_repeat_ngram_size": 2,
                "max_length": 1000
            }
        else:
            # High temperature (temperature>2) cause incoherent text
            # 2 - threshold (some answers will be stupid)
            # 1.5 - sometimes good answers
            # temperature <= 1 - fine
            generate_params: dict = {
                "num_beams": 1,
                "num_return_sequences": num_return_sequences,
                "no_repeat_ngram_size": 2,
                "do_sample": True,
                "temperature": temperature,
                "max_length": 1000
            }
        output = self.processing(self.__tokenizer, self.__model, text, encode_params, generate_params)
        return output