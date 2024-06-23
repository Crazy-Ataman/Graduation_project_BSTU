from pydantic import BaseModel
from typing import Optional, List

class DtoProgrammingLanguages(BaseModel):
    programming_language_id: Optional[str] = None
    programming_language: str
    skill_id_fk: Optional[str] = None