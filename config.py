"""集中配置。

所有配置从项目根目录的 .env 文件读取（不依赖系统环境变量）。
复制 .env.example 为 .env 并填入真实值即可。
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

# 启动时加载 .env；override=True 表示 .env 的值优先于同名系统环境变量
load_dotenv(BASE_DIR / ".env", override=True)

CURRICULUM_DIR = BASE_DIR / "curriculum"
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "learning.db"

# ---------- LLM 提供方 ----------
# anthropic（默认，走 Claude Messages 协议）
# 其它任意值（openai / ark / deepseek ...）都走「OpenAI 兼容协议」分支，
# 适用于火山方舟、DeepSeek、本地 vLLM 等任何 /chat/completions 兼容服务。
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "anthropic").lower()

# Anthropic / Claude（ANTHROPIC_API_KEY 由 anthropic SDK 自动从环境读取）
# 想省钱跑 quiz/review 出题时，可把 LEARNING_MODEL 设为 claude-haiku-4-5
MODEL = os.getenv("LEARNING_MODEL", "claude-opus-5")

# 通用 OpenAI 兼容端点（火山方舟 / DeepSeek / 等）
# 密钥只走 .env，绝不写进代码。
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "")

# 遗忘曲线复习间隔（天）
REVIEW_INTERVALS = [1, 3, 7, 30]