import pytesseract
from PIL import Image
import os

try:
    os.system("curl -s -o test.jpg https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/128px-React-icon.svg.png")
    text = pytesseract.image_to_string(Image.open('test.jpg'))
    print("OCR SUCCESS:", text)
except Exception as e:
    print("OCR FAIL:", str(e))
