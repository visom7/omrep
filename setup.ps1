# Training Planner — Setup / Run Script (Windows PowerShell)
# Builds and starts the full stack (MongoDB + backend + frontend) with Docker Compose.
# Execute from the repo root: .\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Training Planner — Docker stack ===" -ForegroundColor Cyan

docker compose up --build -d

Write-Host ""
Write-Host "Stack is starting:" -ForegroundColor Green
Write-Host "  Frontend : http://localhost:5173"
Write-Host "  Backend  : http://localhost:8080/api/health"
Write-Host "  MongoDB  : mongodb://localhost:27017/training_planner"
Write-Host ""
Write-Host "Follow logs with:  docker compose logs -f"
Write-Host "Stop the stack with:  docker compose down"
