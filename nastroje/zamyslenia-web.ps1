# Zamyslenia z webu – spúšťa Plánovač úloh každý večer (úloha „Pastoracia - zamyslenia z webu“).
# Všetku prácu robí zamyslenia_web.py; Claude volá len vtedy, keď treba napísať nové texty.
# Záznam: OneDrive\Pastoracia-app\zamyslenia-web.log

$zaznam = 'C:\Users\MIchalPC\OneDrive - Greckokatolicke arcibiskupstvo Presov\Pastoracia-app\zamyslenia-web.log'
$python = 'C:\Users\MIchalPC\AppData\Local\Programs\Python\Python312\python.exe'

"=== $(Get-Date -Format 'yyyy-MM-dd HH:mm') ===" | Out-File $zaznam -Append -Encoding utf8
& $python "$PSScriptRoot\zamyslenia_web.py" 2>&1 | Out-File $zaznam -Append -Encoding utf8
