from pydantic import BaseModel
from typing import Optional

class DtoResumes(BaseModel):
    resume_id: Optional[str] = None
    title: str
    text: str
    user_id_fk: Optional[str] = None
    visibility: str