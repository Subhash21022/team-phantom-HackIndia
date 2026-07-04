from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()


client = OpenAI(
    base_url="https://prajeeth12121-4162-resource.services.ai.azure.com/openai/v1/",
    api_key=os.getenv("AZURE_OPENAI_API_KEY")
)


response = client.responses.create(
    model="gpt-5.1",
    input="Reply only READY"
)


print(response.output_text)
