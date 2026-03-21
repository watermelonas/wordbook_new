@echo off
REM 清理 HBuilderX 编译缓存
echo 清理编译缓存...

if exist "unpackage\dist" (
    rmdir /s /q "unpackage\dist"
    echo 已删除 unpackage\dist
)

if exist "unpackage\cache" (
    rmdir /s /q "unpackage\cache"
    echo 已删除 unpackage\cache
)

if exist ".hbuilderx\launch.json" (
    del ".hbuilderx\launch.json"
    echo 已删除 .hbuilderx\launch.json
)

echo.
echo 缓存清理完成！
echo 现在请在 HBuilderX 中重新编译运行到 Android 设备
pause
