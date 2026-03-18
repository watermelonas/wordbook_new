# -*- coding: utf-8 -*-
"""
全局 API 配置：统一从 config.js 读取 DeepSeek API Key。
优先级：环境变量 DEEPSEEK_API_KEY > .env > config.js
"""
from pathlib import Path
import os
import re

TRUETI = Path(__file__).resolve().parent
PROJECT_ROOT = TRUETI.parent
CONFIG_JS = PROJECT_ROOT / "src" / "utils" / "config.js"
ENV_FILE = PROJECT_ROOT / ".env"


def get_api_key() -> str:
    """
    获取 DeepSeek API Key。
    优先级：DEEPSEEK_API_KEY 环境变量 > .env > config.js
    全局只配置一处即可，推荐在 config.js 中配置。
    """
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if key:
        return key
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if line.startswith("DEEPSEEK_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    if CONFIG_JS.exists():
        text = CONFIG_JS.read_text(encoding="utf-8", errors="ignore")
        m = re.search(r"deepseekApiKey\s*:\s*['\"]([^'\"]+)['\"]", text, re.I)
        if m:
            return m.group(1).strip()
    raise SystemExit(
        "请设置 API Key：\n"
        "  方式一（推荐）：复制 config.example.js 为 config.js，填写 deepseekApiKey\n"
        "  方式二：在项目根目录创建 .env，写入 DEEPSEEK_API_KEY=你的key\n"
        "  方式三：设置环境变量 DEEPSEEK_API_KEY"
    )
