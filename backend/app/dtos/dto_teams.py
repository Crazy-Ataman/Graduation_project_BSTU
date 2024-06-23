from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List
from app.dtos.dto_team_members import DtoTeamMembers
from app.dtos.dto_users import DtoUsers

class DtoTeams(BaseModel):
    team_id: Optional[str] = None
    name: str
    creation_date: Optional[datetime] = None
    important_languages: str
    owner_id_fk: Optional[str] = None
    team_members: List[DtoTeamMembers] = None
    users: List[DtoUsers] = None