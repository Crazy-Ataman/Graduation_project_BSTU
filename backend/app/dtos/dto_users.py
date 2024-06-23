from pydantic import BaseModel
from typing import Optional

class DtoUsers(BaseModel):
    user_id: Optional[str] = None
    first_name: str
    last_name: str
    email: str
    password: str
    is_approved: Optional[bool] = None
    role_id_fk: int