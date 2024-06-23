from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DtoCompanies(BaseModel):
    company_id: Optional[str] = None
    name: Optional[str] = None
    experience_id_fk: Optional[str] = None