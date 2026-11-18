@echo off
chcp 65001 > nul
title Deploy Gia Phả Họ Chu lên Vercel

echo ======================================================================
echo           ĐANG TIẾN HÀNH DEPLOY GIA PHẢ HỌ CHU LÊN VERCEL
echo ======================================================================
echo.

:: Di chuyển đến đúng thư mục chứa file bat
cd /d "%~dp0"

echo [1/2] Đang kiểm tra mã nguồn và tải lên Vercel Production...
call npx vercel deploy --prod --yes

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo   [THÀNH CÔNG] Dự án đã được deploy lên Production!
    echo   Địa chỉ website: https://giapha-hochu.vercel.app
    echo ======================================================================
) else (
    echo.
    echo ======================================================================
    echo   [LỖI] Quá trình deploy thất bại. Vui lòng kiểm tra lại log bên trên.
    echo ======================================================================
)

echo.
pause
