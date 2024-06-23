from pydantic import BaseModel
from typing import Optional, List

class DtoSocialMediaLinks(BaseModel):
    social_media_link_id: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None
    user_id_fk: Optional[str] = None