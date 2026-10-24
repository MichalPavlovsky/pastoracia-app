# Zamyslenia z webu – spúšťa Plánovač úloh každý večer (úloha „Pastoracia – zamyslenia z webu“).
# Claude beží bez okna, píše len do priečinka s dátami v OneDrive. Záznam: data\..\zamyslenia-web.log

$data = 'C:\Users\MIchalPC\OneDrive - Greckokatolicke arcibiskupstvo Presov\Pastoracia-app\data'
$postup = 'C:\Users\MIchalPC\Desktop\Claude_vault\AIOS\Skills'
$zaznam = Join-Path (Split-Path $data) 'zamyslenia-web.log'

Set-Location $data
"=== $(Get-Date -Format 'yyyy-MM-dd HH:mm') ===" | Out-File $zaznam -Append -Encoding utf8
& 'C:\Users\MIchalPC\.local\bin\claude.exe' -p "Postupuj presne podľa $postup\zamyslenia-web.md. Formát súboru je v C:\Users\MIchalPC\Projekty\pastoracia-app\SCHEMA.md (sekcia zamyslenia-web.json). Na konci napíš jednu vetu, čo si pripravil." `
  --model sonnet `
  --permission-mode acceptEdits `
  --add-dir $postup 'C:\Users\MIchalPC\Projekty\pastoracia-app' `
  --allowedTools 'WebFetch' 'Read' 'Glob' 'Grep' 'Write' 'Edit' `
  --disallowedTools 'Bash' 'PowerShell' 'Edit(//c/Users/MIchalPC/Projekty/**)' 'Edit(//c/Users/MIchalPC/Desktop/**)' 2>&1 | Out-File $zaznam -Append -Encoding utf8
