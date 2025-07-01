from pydantic import BaseModel, Field
from typing import Optional

class QuestionConfig(BaseModel):
    Standard: str = Field(..., example="Class 10")
    Subject_Name: str = Field(..., example="Science")
    chapter_content: str = Field(..., example="Text from the chapter goes here...")
    difficulty: str = Field(..., example="medium", description="easy | medium | hard")
    
    countOfMCQs: int = Field(..., example=5, gt=0)
    countOfShort: int = Field(..., example=3, ge=0)
    countOfLong: int = Field(..., example=2, ge=0)

    User_defined_notes: Optional[str] = Field(None, example="Focus on application-based questions")
