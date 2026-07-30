@echo off
REM Double-click this file to start auto-updating Blogs/manifest.json
REM whenever you add, edit, or remove a post in the Blogs/ folder.
REM Leave this window open while you work — just save your .html file
REM and refresh index.html in the browser, no other steps needed.
REM Close this window (or press Ctrl+C) when you're done.

cd /d "%~dp0"
node generate-manifest.js --watch
pause
