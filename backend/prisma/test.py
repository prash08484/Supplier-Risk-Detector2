import os
from dotenv import load_dotenv

load_dotenv()
print(os.getenv("DATABASE_URL"))  # Should print your API key