import glob
import os
import re

html_files = glob.glob(r"c:\Users\CHROMEWORLD\Desktop\new\staff_kyc_system\**\*.html", recursive=True)

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix instances where primary buttons and red buttons incorrectly got text-slate-900 instead of text-white
    # We look for bg-primary or bg-red-500 followed by or preceded by text-slate-900
    
    # Simple brute force for toasts
    content = content.replace('"bg-primary text-slate-900"', '"bg-primary text-white"')
    content = content.replace('"bg-red-500 text-slate-900"', '"bg-red-500 text-white"')
    
    # Other places like button components
    content = content.replace('bg-primary text-slate-900', 'bg-primary text-white')
    content = content.replace('bg-red-500 text-slate-900', 'bg-red-500 text-white')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
