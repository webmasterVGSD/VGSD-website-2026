@echo off
chcp 65001 >nul
title VGSD website - lokaal bekijken
cd /d "%~dp0"

rem Start een klein lokaal webservertje in deze map en opent de site in je browser.
rem Nodig omdat de pagina's hun gegevens (WhatsApp-nummer, contact, besturen) uit de
rem map "data" laden; dat werkt niet als je een pagina rechtstreeks als bestand opent.
rem Sluiten: druk op Ctrl+C in dit venster of sluit het venster.

set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY (
  echo Python is niet gevonden op deze computer.
  echo Installeer Python via https://www.python.org/downloads/ en start dit bestand opnieuw.
  echo.
  pause
  exit /b 1
)

echo.
echo   VGSD website draait nu op:  http://localhost:8000
echo   De browser wordt zo geopend. Laat dit venster open zolang je de site bekijkt.
echo   Klaar? Sluit dit venster of druk op Ctrl+C.
echo.

start "" cmd /c "timeout /t 2 >nul & start "" http://localhost:8000/index.html"
%PY% -m http.server 8000

echo.
echo De server is gestopt. Als dit een foutmelding was, draait er misschien al een andere
echo server op poort 8000 (bijvoorbeeld een eerder geopend venster van dit bestand).
pause
