$content = Get-Content yt_channel.html -Raw
if ($content -match 'og:image" content="([^"]+)"') {
    $matches[1]
}
