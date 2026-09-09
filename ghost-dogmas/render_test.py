
import os, subprocess
html = os.path.abspath('test_book.html')
pdf = os.path.abspath('test_book.pdf')
edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
url = 'file:///' + html.replace('\\', '/')
cmd = [edge, '--headless', '--disable-gpu', '--no-pdf-header-footer', f'--print-to-pdf={pdf}', url]
res = subprocess.run(cmd, capture_output=True, text=True)
print('Return:', res.returncode)
print('Exists:', os.path.exists(pdf))
if os.path.exists(pdf):
    print('Size:', os.path.getsize(pdf))
