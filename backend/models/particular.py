from pydantic import BaseModel

class ParticularModel(BaseModel):
    name: str
    category: str
