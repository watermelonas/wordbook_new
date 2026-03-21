@echo off
echo 清理编译缓存...
rmdir /s /q unpackage 2>nul
rmdir /s /q dist 2>nul
rmdir /s /q node_modules\.vite 2>nul
echo 缓存已清理完成
pause
