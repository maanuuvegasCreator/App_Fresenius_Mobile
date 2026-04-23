# Compila APK debug. Evita MAX_PATH (260) con junction corta en C: (mismo volumen que el Desktop).
$ErrorActionPreference = "Stop"
$Mobile = Join-Path $PSScriptRoot "..\mobile" | Resolve-Path
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk" }
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

$shortRoot = "C:\b"
$shortMobile = Join-Path $shortRoot "f"
if (Test-Path $shortMobile) {
  cmd /c "rmdir `"$shortMobile`"" 2>$null
}
if (-not (Test-Path $shortRoot)) {
  New-Item -ItemType Directory -Path $shortRoot -Force | Out-Null
}
cmd /c "mklink /J `"$shortMobile`" `"$($Mobile.Path)`"" | Out-Null
if (-not (Test-Path $shortMobile)) {
  throw "No se pudo crear junction $shortMobile -> $($Mobile.Path). Prueba ejecutar PowerShell como administrador o crea C:\b manualmente."
}

try {
  Set-Location (Join-Path $shortMobile "android")
  .\gradlew.bat assembleDebug --no-daemon
  if ($LASTEXITCODE -ne 0) {
    throw "Gradle fallo con codigo $LASTEXITCODE"
  }
  $apkSrc = Join-Path $shortMobile "android\app\build\outputs\apk\debug\app-debug.apk"
  $outDir = Join-Path $PSScriptRoot "..\dist" | Resolve-Path
  $out = Join-Path $outDir "app-debug.apk"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  Copy-Item -Force $apkSrc $out
  Write-Host "APK generado en: $out"
}
finally {
  Set-Location $env:USERPROFILE
  if (Test-Path $shortMobile) {
    cmd /c "rmdir `"$shortMobile`"" 2>$null
  }
}
