import asyncio
import os

from dotenv import load_dotenv

load_dotenv()

from langchain_openai import AzureChatOpenAI


def normalize_endpoint(raw: str | None) -> str | None:
    if not raw:
        return raw
    endpoint = raw.strip()
    if "/api/projects/" in endpoint:
        endpoint = endpoint.split("/api/projects/")[0]
    endpoint = endpoint.rstrip("/") + "/"
    return endpoint


async def test_deployment(name: str, endpoint: str, api_key: str, api_version: str) -> None:
    print(f"Testing deployment: {name}")
    llm = AzureChatOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version,
        azure_deployment=name,
        temperature=0,
    )
    res = await llm.ainvoke("Reply only READY")
    print(f"Response ({name}): {str(res.content).strip()}")


async def main() -> None:
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    endpoint = normalize_endpoint(os.getenv("AZURE_OPENAI_ENDPOINT"))
    api_version = os.getenv("AZURE_OPENAI_API_VERSION")
    agent_dep = os.getenv("AZURE_OPENAI_AGENT_DEPLOYMENT")
    fast_dep = os.getenv("AZURE_OPENAI_FAST_DEPLOYMENT")

    print(f"endpoint: {endpoint}")
    print(f"api_version: {api_version}")
    print(f"Agent deployment: {agent_dep}")
    print(f"Fast deployment: {fast_dep}")

    if not all([api_key, endpoint, api_version, agent_dep, fast_dep]):
        missing = [
            key for key, val in {
                "AZURE_OPENAI_API_KEY": api_key,
                "AZURE_OPENAI_ENDPOINT": endpoint,
                "AZURE_OPENAI_API_VERSION": api_version,
                "AZURE_OPENAI_AGENT_DEPLOYMENT": agent_dep,
                "AZURE_OPENAI_FAST_DEPLOYMENT": fast_dep,
            }.items() if not val
        ]
        print(f"Missing env vars: {', '.join(missing)}")
        return

    try:
        await test_deployment(agent_dep, endpoint, api_key, api_version)
    except Exception as e:
        print(f"Agent deployment test FAILED: {type(e).__name__}: {e}")

    try:
        await test_deployment(fast_dep, endpoint, api_key, api_version)
    except Exception as e:
        print(f"Fast deployment test FAILED: {type(e).__name__}: {e}")


if __name__ == "__main__":
    asyncio.run(main())
