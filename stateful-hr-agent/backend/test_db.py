import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text


load_dotenv()


async def test():

    url = os.getenv("DATABASE_URL")

    print(url)

    engine = create_async_engine(url)

    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT NOW()")
        )

        print(result.fetchone())


asyncio.run(test())
