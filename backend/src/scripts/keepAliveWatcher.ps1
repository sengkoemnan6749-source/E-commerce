$ErrorActionPreference = 'SilentlyContinue'
$port = 5055

function Test-PanelPort {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $client.BeginConnect('127.0.0.1', $port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(250, $false)
        if ($ok -and $client.Connected) {
            $client.EndConnect($iar)
            return $true
        }
        return $false
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

if (Test-PanelPort) {
    exit 0
}

$backendDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $backendDir

while ($true) {
    if (Test-PanelPort) {
        Start-Sleep -Seconds 5
        continue
    }
    $proc = Start-Process -FilePath "node" -ArgumentList "src/scripts/bakongWatcher.js" -WorkingDirectory $backendDir -WindowStyle Hidden -PassThru
    if ($proc) {
        $proc.WaitForExit()
    }
    Start-Sleep -Seconds 4
}
