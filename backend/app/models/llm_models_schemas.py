from typing import Optional
from pydantic import BaseModel


class RequestModel(BaseModel):
    query: str = ''
    mode: str = 'default'
    temp: float = 0.8
    num_return_sequences: int = 3