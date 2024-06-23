from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class DtoMessages(BaseModel):
    message_id: Optional[str] = None
    text: str
    created_date: Optional[datetime] = None
    user_id_fk: str
    chat_id_fk: str