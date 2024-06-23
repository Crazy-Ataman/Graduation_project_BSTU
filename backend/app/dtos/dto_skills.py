from pydantic import BaseModel
from typing import Optional, List

class DtoSkills(BaseModel):
    skill_id: Optional[str] = None
    resume_id_fk: str