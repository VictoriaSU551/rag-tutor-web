SYSTEM_PROMPT = """你是"计算机考研辅导"智能助教。基于提供的资料回答用户的问题。

核心要求：
1) 以第二人称"你"称呼用户，直接回答问题，不要提及"根据检索内容"、"根据用户提出的问题"等检索相关的元信息。
2) 给出结构化、清晰的答案（可使用标题、要点、小结等 Markdown 格式）。
3) 若资料不足，坦诚说明不确定的部分，建议用户补充或换个角度提问。
4) 输出时避免连续的空行，段落间最多只用一个空行分隔。

回答风格：
- 直接、专业、清晰
- 使用 Markdown 格式增强可读性，包括所有扩展语法（表格、代码块、列表等）
- 避免冗余的过渡语句
- 确保内容紧凑，逻辑清晰
"""

EXERCISE_SYSTEM_PROMPT = """你是考研出题专家。基于用户的问题和相关资料，生成1道高质量的练习题。
返回 JSON 格式，包含题目、标准答案和详细解析。解析应使用 Markdown 格式，包含知识点和答题思路。"""

def build_user_prompt(question: str, contexts: list[dict]) -> str:
    # contexts: [{book,page,text}]
    lines = []
    for i, c in enumerate(contexts, start=1):
        excerpt = c["text"].strip().replace("\n", " ")
        if len(excerpt) > 900:
            excerpt = excerpt[:900] + "..."
        lines.append(f"[{i}] 书名：{c['book']} | 页码：{c['page']}\n原文：{excerpt}\n")
    joined = "\n".join(lines)
    return f"""用户问题：{question}

参考资料：
{joined}

请基于上述资料回答用户问题，记住：
- 用"你"称呼用户，不要提及检索、资料来源等元信息
- 避免连续空行，保持内容紧凑
- 不包含参考文献
"""

def build_exercise_prompt(question: str, contexts: list[dict]) -> str:
    """构建用于生成练习题的提示词"""
    lines = []
    for i, c in enumerate(contexts, start=1):
        excerpt = c["text"].strip().replace("\n", " ")
        if len(excerpt) > 500:
            excerpt = excerpt[:500] + "..."
        lines.append(f"[{i}] {c['book']} (页码 {c['page']}):\n{excerpt}\n")
    joined = "\n".join(lines)
    
    return f"""用户问题：{question}

相关资料：
{joined}

请生成1道针对该问题的考研级别练习题。
返回以下JSON格式：
{{
    "question": "题目内容",
    "options": ["A) 选项A", "B) 选项B", "C) 选项C", "D) 选项D"],  // 如果是选择题
    "correct_answer": "A",  // 或具体答案
    "explanation": "**知识点：**\n- 核心概念\n- 相关原理\n\n**答题思路：**\n1. 分析题目要求\n2. 应用相关知识\n3. 得出结论",  // 使用 Markdown 格式的详细解析
    "difficulty": "中等"  // 简单/中等/困难
}}"""
