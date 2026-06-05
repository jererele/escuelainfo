import codecs

with codecs.open('pagina.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Removing the EM-DASH and space that was maliciously inserted everywhere
text = text.replace('— ', '')

with codecs.open('pagina.html', 'w', encoding='utf-8') as f:
    f.write(text)
