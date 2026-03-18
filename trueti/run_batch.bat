@echo off
chcp 65001 >nul
cd /d "%~dp0.."
if "%DEEPSEEK_API_KEY%"=="" (
    echo 请先设置环境变量 DEEPSEEK_API_KEY
    echo 例如: set DEEPSEEK_API_KEY=你的key
    pause
    exit /b 1
)
echo 开始批处理，进度会显示在下方，勿关闭本窗口...
echo 已写入数量可另开窗口运行: python trueti/check_batch_progress.py
echo.
python -u trueti/batch_ai_vocab.py --no-dict --delay 2
echo.
echo 批处理结束
pause
