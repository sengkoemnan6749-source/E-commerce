@echo off
title TechTonic Bakong Auto-Verify Watcher
cd /d "%~dp0backend"
echo Starting TechTonic Bakong KHQR Auto-Verify Watcher...
npm run bakong:watch
pause
