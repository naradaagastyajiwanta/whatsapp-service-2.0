@echo off
:: WhatsApp Service 2.0 - Quick Test Script
:: This script helps you quickly test the file upload functionality

echo.
echo ============================================
echo   WhatsApp Service 2.0 - Quick Test
echo ============================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Python is not installed. API test script will be skipped.
    set PYTHON_AVAILABLE=false
) else (
    set PYTHON_AVAILABLE=true
)

echo ✅ Node.js is available
if "%PYTHON_AVAILABLE%"=="true" (
    echo ✅ Python is available
) else (
    echo ⚠️  Python not available
)
echo.

:MENU
echo Choose an option:
echo.
echo 1. Start WhatsApp Service
echo 2. Open Web Interface (Browser)
echo 3. Open File Upload Test Page
echo 4. Run Python API Test (requires Python + requests)
echo 5. Check Service Status
echo 6. Stop Service
echo 7. View Documentation
echo 8. Exit
echo.
set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto START_SERVICE
if "%choice%"=="2" goto OPEN_WEB
if "%choice%"=="3" goto OPEN_TEST
if "%choice%"=="4" goto RUN_PYTHON_TEST
if "%choice%"=="5" goto CHECK_STATUS
if "%choice%"=="6" goto STOP_SERVICE
if "%choice%"=="7" goto VIEW_DOCS
if "%choice%"=="8" goto EXIT

echo Invalid choice. Please try again.
goto MENU

:START_SERVICE
echo.
echo 🚀 Starting WhatsApp Service...
echo.
echo Note: 
echo - Service will run on http://localhost:3000
echo - Scan QR code when prompted
echo - Press Ctrl+C to stop the service
echo.
pause
npm start
goto MENU

:OPEN_WEB
echo.
echo 🌐 Opening web interface...
start http://localhost:3000
goto MENU

:OPEN_TEST
echo.
echo 📎 Opening file upload test page...
start test-file-upload.html
goto MENU

:RUN_PYTHON_TEST
echo.
if "%PYTHON_AVAILABLE%"=="false" (
    echo ❌ Python is not available. Please install Python first.
    goto MENU
)

echo 🐍 Running Python API test...
echo.
echo Installing required packages...
pip install requests
echo.
echo Running test script...
python test_api.py
echo.
pause
goto MENU

:CHECK_STATUS
echo.
echo 📊 Checking service status...
echo.
curl -s http://localhost:3000/status
if errorlevel 1 (
    echo ❌ Service is not running or not accessible
    echo Please start the service first (option 1)
) else (
    echo.
    echo ✅ Service response received
)
echo.
pause
goto MENU

:STOP_SERVICE
echo.
echo 🛑 Stopping WhatsApp Service...
echo.
echo Use Ctrl+C in the service terminal window to stop the service.
echo Or close the terminal window running the service.
echo.
pause
goto MENU

:VIEW_DOCS
echo.
echo 📚 Opening documentation...
echo.
if exist "FILE_UPLOAD_DOCUMENTATION.md" (
    start FILE_UPLOAD_DOCUMENTATION.md
    echo ✅ Opened File Upload Documentation
)
if exist "API_DOCUMENTATION.md" (
    start API_DOCUMENTATION.md
    echo ✅ Opened API Documentation
)
if exist "README.md" (
    start README.md
    echo ✅ Opened README
)
echo.
pause
goto MENU

:EXIT
echo.
echo 👋 Goodbye!
echo.
echo Quick Tips:
echo - Keep the service running while testing
echo - Use the web interface for easy file uploads
echo - Check the documentation for integration examples
echo.
pause
exit /b 0
