from pydantic import BaseModel
from typing import Optional, List

from app.dtos.dto_chat_users import DtoChatUsers

class DtoChats(BaseModel):
    chat_id: Optional[str] = None
    name: str
    type: str
    team_id_fk: Optional[str] = None
    chat_users: List[DtoChatUsers] = None