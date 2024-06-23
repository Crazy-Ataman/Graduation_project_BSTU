from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class DtoTeamMembers(BaseModel):
    member_id: Optional[str] = None
    team_id_fk: Optional[str] = None
    user_id_fk: Optional[str] = None
    status: Optional[str] = None