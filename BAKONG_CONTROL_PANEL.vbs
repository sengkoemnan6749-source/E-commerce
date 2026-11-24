Set fso = CreateObject("Scripting.FileSystemObject")
rootDir = fso.GetParentFolderName(WScript.ScriptFullName)
silentStart = rootDir & "\backend\src\scripts\silentStart.vbs"
Set WshShell = CreateObject("WScript.Shell")

' Ensure background watcher supervisor is running invisibly
WshShell.Run "wscript.exe """ & silentStart & """", 0, False
WScript.Sleep 1500

url = "http://127.0.0.1:5055"
edge64 = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

If fso.FileExists(edge64) Then
    WshShell.Run """" & edge64 & """ --app=" & url & " --window-size=490,720", 1, False
ElseIf fso.FileExists(edge) Then
    WshShell.Run """" & edge & """ --app=" & url & " --window-size=490,720", 1, False
ElseIf fso.FileExists(chrome) Then
    WshShell.Run """" & chrome & """ --app=" & url & " --window-size=490,720", 1, False
Else
    WshShell.Run url, 1, False
End If
