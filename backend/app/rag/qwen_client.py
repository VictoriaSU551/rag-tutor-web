import json
from typing import AsyncGenerator
from openai import AsyncOpenAI, OpenAI
from ..config import settings

class QwenClient:
    """
    使用 OpenAI SDK 调用通义千问（兼容 OpenAI API 格式）
    
    通义千问提供了 OpenAI 兼容的接口，可以直接使用官方 SDK。
    文档：https://help.aliyun.com/zh/dashscope/developer-reference/compatibility-of-openai-with-dashscope
    """
    def __init__(self):
        if not settings.QWEN_API_KEY:
            raise RuntimeError("未配置 QWEN_API_KEY（请写入服务器环境变量）")

        # 异步客户端（用于流式生成）
        self.async_client = AsyncOpenAI(
            api_key=settings.QWEN_API_KEY,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
        
        # 同步客户端（用于 JSON Schema）
        self.sync_client = OpenAI(
            api_key=settings.QWEN_API_KEY,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
        
        self.model = settings.QWEN_MODEL

    async def stream_generate(self, system: str, user: str) -> AsyncGenerator[str, None]:
        """
        流式生成文本
        
        Args:
            system: 系统提示词
            user: 用户提示词
            
        Yields:
            str: 增量生成的文本片段
        """
        try:
            # 创建流式聊天补全
            stream = await self.async_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                stream=True,  # 启用流式输出
                temperature=0.7,  # 可根据需要调整
            )
            
            # 异步迭代流式响应
            async for chunk in stream:
                # 提取增量文本内容
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            raise RuntimeError(f"调用通义千问API失败: {str(e)}")

    def json_generate(self, system: str, user: str) -> str:
        """
        非流式生成 JSON 结构化内容
        
        Args:
            system: 系统提示词
            user: 用户提示词
            
        Returns:
            str: JSON 格式的字符串
        """
        try:
            completion = self.sync_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                response_format={"type": "json_object"},  # 启用 JSON 模式
                temperature=0.7,
            )
            
            json_string = completion.choices[0].message.content
            
            # 验证返回的是有效 JSON
            json.loads(json_string)
            return json_string
            
        except json.JSONDecodeError as e:
            raise RuntimeError(f"返回内容不是有效的JSON: {str(e)}")
        except Exception as e:
            raise RuntimeError(f"调用通义千问API失败: {str(e)}")
