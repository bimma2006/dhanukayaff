from html.parser import HTMLParser
import sys

class OGImageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.og_image = None

    def handle_starttag(self, tag, attrs):
        if tag == 'meta':
            attrs_dict = dict(attrs)
            if attrs_dict.get('property') == 'og:image':
                self.og_image = attrs_dict.get('content')

parser = OGImageParser()
with open('yt_channel.html', 'r', encoding='utf-8') as f:
    parser.feed(f.read())

if parser.og_image:
    print(parser.og_image)
else:
    print("Not found")
