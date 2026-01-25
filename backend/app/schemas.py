from pydantic import BaseModel, Field

class RegisterIn(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=6, max_length=6)  # 必须6位数字，后端再校验

class LoginIn(BaseModel):
    username: str
    password: str

class ChatIn(BaseModel):
    question: str = Field(min_length=1, max_length=4000)

class QuizAnswerIn(BaseModel):
    answer: str = Field(min_length=1, max_length=2000)

class AddWrongIn(BaseModel):
    user_first_answer: str = Field(default="")
