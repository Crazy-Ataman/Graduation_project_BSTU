from pydantic import BaseModel
from typing import Optional, List

class DtoChatUsers(BaseModel):
    chat_id: str
    user_id: str