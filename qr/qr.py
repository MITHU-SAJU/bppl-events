import qrcode

url = "https://drive.google.com/file/d/15qsEWqTrrsP4HRnzYkv2BXEXc8JCMz7i/view"

img = qrcode.make(url)

img.save("bppl_events_qr.png")

print("QR generated!")