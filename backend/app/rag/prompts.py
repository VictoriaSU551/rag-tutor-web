SYSTEM_PROMPT = """你是"计算机考研辅导"智能助教。直接回答用户的问题。

核心要求：
1) 以第二人称"你"称呼用户，直接回答问题。
2) 给出结构化、清晰的答案（可使用标题、要点、小结等 Markdown 格式）。
3) 若信息不足，坦诚说明不确定的部分，建议用户补充或换个角度提问。
4) 输出时避免连续的空行，段落间最多只用一个空行分隔。

回答风格：
- 直接、专业、清晰
- 使用 Markdown 格式增强可读性，包括所有扩展语法（表格、代码块、列表等）
- 避免冗余的过渡语句
- 确保内容紧凑，逻辑清晰
"""

EXERCISE_SYSTEM_PROMPT = """你是考研出题专家。基于用户的问题，生成1道高质量的练习题。
返回 JSON 格式，包含题目、标准答案和详细解析。解析应使用 Markdown 格式，包含知识点和答题思路。"""

def build_user_prompt(question: str, contexts: list = None) -> str:
    context_text = ""
    if contexts:
        context_parts = []
        for i, c in enumerate(contexts, 1):
            context_parts.append(f"[{i}] {c.get('text', '')}")
        context_text = "\n\n参考资料：\n" + "\n".join(context_parts) + "\n"

    return f"""{context_text}用户问题：{question}

请直接回答用户问题，记住：
- 用"你"称呼用户，不要提及资料来源或检索
- 避免连续空行，保持内容紧凑
- 不包含参考文献
"""

def build_exercise_prompt(question: str, contexts: list = None, difficulty: str = "medium") -> str:
    """构建用于生成练习题的提示词"""
    # 难度映射
    difficulty_map = {
        "easy": "简单",
        "medium": "中等", 
        "hard": "困难"
    }
    difficulty_text = difficulty_map.get(difficulty, "中等")

    context_text = ""
    if contexts:
        context_parts = []
        for i, c in enumerate(contexts, 1):
            context_parts.append(f"[{i}] {c.get('text', '')}")
        context_text = "\n参考资料：\n" + "\n".join(context_parts) + "\n\n"
    
    return f"""{context_text}用户问题：{question}

请生成1道针对该问题的{difficulty_text}难度考研级别练习题。
返回以下JSON格式：
{{
    "question": "题目内容",
    "options": ["A) 选项A", "B) 选项B", "C) 选项C", "D) 选项D"],  // 如果是选择题
    "correct_answer": "A",  // 或具体答案
    "explanation": "**知识点：**\n- 核心概念\n- 相关原理\n\n**答题思路：**\n1. 分析题目要求\n2. 应用相关知识\n3. 得出结论",  // 使用 Markdown 格式的详细解析
    "difficulty": "{difficulty_text}"  // 简单/中等/困难
}}"""
