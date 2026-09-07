@echo off
echo.
echo ==========================================
echo   CONVEN - Deploy y Actualizacion
echo ==========================================
echo.

echo [1/4] Compilando Frontend (Tailwind/React)...
cd CONVEN_Desktop_Front
call npm install --no-audit --no-fund
call npm run build
cd ..

echo.
echo [2/4] Copiando el Frontend compilado al Backend...
xcopy /E /I /Y "CONVEN_Desktop_Front\dist\*" "CONVEN_Desktop\public\"

echo.
echo [3/4] Copiando archivos al servidor remoto...
scp -o BatchMode=yes -r "CONVEN_Desktop" uzcategui@192.168.100.2:/home/uzcategui/proyectos/conven/
scp -o BatchMode=yes "Dockerfile" uzcategui@192.168.100.2:/home/uzcategui/proyectos/conven/
scp -o BatchMode=yes "docker-compose.yml" uzcategui@192.168.100.2:/home/uzcategui/proyectos/conven/

echo.
echo [4/4] Reconstruyendo y reiniciando el sistema en Docker...
ssh -o BatchMode=yes uzcategui@192.168.100.2 "cd /home/uzcategui/proyectos/conven && docker compose build && docker compose up -d"

echo.
echo ==========================================
echo   Deploy completado!
echo   Abre: http://conven/
echo ==========================================
pause
