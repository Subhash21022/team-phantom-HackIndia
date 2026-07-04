import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from app.agent.graph import hr_agent_app
from langchain_core.messages import HumanMessage

async def run_test(test_name: str, messages: list[str], thread_id: str):
    print(f"\n==================================")
    print(f"TEST: {test_name}")
    print(f"==================================")
    
    config = {'configurable': {'thread_id': thread_id}}
    
    for user_input in messages:
        print(f"\nUSER INPUT:\n{user_input}\n")
        
        inputs = {'messages': [HumanMessage(content=user_input)]}
        
        try:
            async for event in hr_agent_app.astream(inputs, config, stream_mode='values'):
                if event.get('intent') and not event.get('plan'):
                    print(f"DETECTED INTENT:\n{event['intent']}\n")
                if event.get('plan') and not event.get('mcp_results'):
                    print(f"GENERATED PLAN:\n{event['plan']}\n")
                if event.get('mcp_results') and not event.get('last_ui'):
                    # Print MCP Called and Results cleanly
                    print(f"MCP CALLED:")
                    for res in event['mcp_results']:
                        print(f" - {res.get('server')}.{res.get('action')}")
                    print(f"\nMCP RESULT:")
                    for res in event['mcp_results']:
                        data = res.get('result', {})
                        if isinstance(data, dict) and 'data' in data:
                            if isinstance(data['data'], list):
                                print(f" - {len(data['data'])} rows returned")
                            else:
                                print(f" - Data Object: {str(data['data'])[:100]}...")
                        else:
                            print(f" - Result: {str(data)[:100]}...")
                    print()
                if event.get('last_ui'):
                    print(f"AG-UI TYPE:\n{event['last_ui'].get('type')}\n")
        except Exception as e:
            print(f"FAILED WITH EXCEPTION: {e}")

async def main():
    # Test 1
    await run_test("TEST 1: Natural Language Variations (A)", ["Show all candidates"], "test-1a")
    await run_test("TEST 1: Natural Language Variations (B)", ["List people who applied"], "test-1b")
    await run_test("TEST 1: Natural Language Variations (C)", ["Who are waiting for interviews?"], "test-1c")
    
    # Test 2 & Test 4 (Memory Workflow)
    await run_test("TEST 4: Memory Workflow", ["Show Rahul", "Generate his offer letter"], "test-4")
    
    # Test 3
    await run_test("TEST 3: Multi MCP Workflow", ["Schedule Rahul interview tomorrow at 3PM"], "test-3")
    
    # Test 5
    await run_test("TEST 5: AG-UI Invalid Output Protection", ["Compare candidates and suggest best"], "test-5")

if __name__ == "__main__":
    asyncio.run(main())
