import asyncio
import os
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage
from openai import OpenAI


def _normalize_base_url(raw: str | None) -> str:
    endpoint = (raw or "").strip()
    if not endpoint:
        raise ValueError("AZURE_OPENAI_ENDPOINT is not set")

    if "/api/projects/" in endpoint:
        endpoint = endpoint.split("/api/projects/")[0]

    endpoint = endpoint.rstrip("/")
    if not endpoint.endswith("/openai/v1"):
        endpoint = endpoint + "/openai/v1"
    return endpoint


def _get_client() -> OpenAI:
    return OpenAI(
        base_url=_normalize_base_url(os.getenv("AZURE_OPENAI_ENDPOINT")),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    )


def _messages_to_text(messages: Any) -> str:
    if isinstance(messages, str):
        return messages

    if isinstance(messages, list):
        parts = []
        for msg in messages:
            if isinstance(msg, BaseMessage):
                role = getattr(msg, "type", "user")
                parts.append(f"{role}: {msg.content}")
            else:
                parts.append(str(msg))
        return "\n".join(parts)

    return str(messages)


def _extract_text(response: Any) -> str:
    text = getattr(response, "output_text", None)
    if text:
        return text.strip()

    output = getattr(response, "output", None) or []
    chunks = []
    for item in output:
        content = getattr(item, "content", None) or []
        for c in content:
            t = getattr(c, "text", None)
            if t:
                chunks.append(t)
    return "\n".join(chunks).strip()


class AzureResponsesLLM:
    def __init__(self, model: str):
        self.model = model

    def invoke(self, messages: Any) -> AIMessage:
        input_text = _messages_to_text(messages)
        client = _get_client()

        if hasattr(client, "responses"):
            response = client.responses.create(
                model=self.model,
                input=input_text,
            )
            return AIMessage(content=_extract_text(response))

        # SDK fallback for older openai package versions.
        response = client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": input_text}],
            temperature=0,
        )
        text = (response.choices[0].message.content or "").strip()
        return AIMessage(content=text)

    async def ainvoke(self, messages: Any) -> AIMessage:
        return await asyncio.to_thread(self.invoke, messages)


def get_agent_llm():
    return AzureResponsesLLM(os.getenv("AZURE_OPENAI_AGENT_DEPLOYMENT", "gpt-5.1"))


def get_fast_llm():
    return AzureResponsesLLM(os.getenv("AZURE_OPENAI_FAST_DEPLOYMENT", "gpt-5-mini"))
