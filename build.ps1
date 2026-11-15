$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    dotnet publish OrbitDecision.csproj -c Release -r win-x64 --self-contained true -o dist
    if ($LASTEXITCODE -ne 0) { throw 'Publish failed.' }
    Copy-Item -LiteralPath 'docs\USER_GUIDE.md' -Destination 'dist\README.md'
    Write-Host 'Ready: dist\ORBIT-Decision.exe'
} finally {
    Pop-Location
}
