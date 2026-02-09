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

class AddManualWrongIn(BaseModel):
    question: str = Field(min_length=1)
    options: list[str] = Field(default=None)
    correct_answer: str = Field(min_length=1)
    explanation: str = Field(default="")
    difficulty: str = Field(default="中等")


class QuizQuestionOut(BaseModel):
    """题目表输出"""
    id: str
    user_id: str
    session_id: str | None = None
    question: str
    options: list[str] | None = None
    correct_answer: str
    explanation: str | None = None
    difficulty: str | None = None
    source_question: str | None = None
    message_index: int | None = None
    created_at: int
