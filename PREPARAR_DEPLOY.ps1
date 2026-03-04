# Script de Automação para Deploy - Secretaria DeLucca

Write-Host "--- Iniciando Preparação para o GitHub ---" -ForegroundColor Cyan

# 1. Verificar Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: O Git não foi encontrado no seu computador." -ForegroundColor Red
    Write-Host "Por favor, instale o Git antes de continuar: https://git-scm.com/downloads"
    exit
}

# 2. Inicializar se necessário
if (!(Test-Path .git)) {
    git init
    Write-Host "Repositório Git inicializado." -ForegroundColor Green
}

# 3. Adicionar arquivos e Commit
git add .
git commit -m "fix: remove legacy vite files and cleanup for vercel build"
Write-Host "Limpeza de arquivos legados realizada e commit criado." -ForegroundColor Green

# 4. Perguntar URL do GitHub
$githubUrl = Read-Host "Cole aqui a URL do seu repositório GitHub (ex: https://github.com/usuario/sistema-zeladoria.git)"

if ($githubUrl) {
    # Remover origin se já existir
    git remote remove origin 2>$null
    git remote add origin $githubUrl
    git branch -M main
    
    Write-Host "Enviando código para o GitHub... (Isso pode pedir seu login)" -ForegroundColor Yellow
    git push -u origin main
    
    Write-Host "--- TUDO PRONTO! ---" -ForegroundColor Cyan
    Write-Host "Agora vá para o painel da Vercel e importe o projeto."
} else {
    Write-Host "Operação cancelada: URL do GitHub não fornecida." -ForegroundColor Yellow
}
