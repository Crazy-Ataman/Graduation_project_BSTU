from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DtoExperiences(BaseModel):
    experience_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    experience: Optional[float] = 0.0
    level: Optional[str] = "Juniour"
    programming_language_id_fk: Optional[str] = None