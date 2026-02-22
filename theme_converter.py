import os
import glob
import re

directory = r"c:\Users\CHROMEWORLD\Desktop\new\staff_kyc_system"
html_files = glob.glob(os.path.join(directory, "**", "*.html"), recursive=True)

def replace_class(content, old, new):
    return re.sub(r'(?<![a-zA-Z0-9_-])' + re.escape(old) + r'(?![a-zA-Z0-9_-])', new, content)

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # HTML tag
    content = content.replace('<html class="dark"', '<html class="light"')

    content = content.replace('type === "success" ? "bg-primary text-background-dark" : "bg-red-500 text-white"',
                              'type === "success" ? "bg-primary text-white" : "bg-red-500 text-white"')
    content = content.replace('type === "success" ? "bg-primary text-background-dark" : "bg-red-500 text-slate-900"',
                              'type === "success" ? "bg-primary text-white" : "bg-red-500 text-white"')

    content = replace_class(content, "text-white", "text-slate-900")
    content = replace_class(content, "text-background-dark", "text-white")
    
    content = replace_class(content, "bg-white/5", "bg-slate-900/5")
    content = replace_class(content, "bg-white/10", "bg-slate-900/10")
    content = replace_class(content, "bg-white/20", "bg-slate-900/20")
    content = replace_class(content, "border-white/5", "border-slate-900/5")
    content = replace_class(content, "border-white/10", "border-slate-900/10")
    content = replace_class(content, "text-white/50", "text-slate-900/50")

    content = replace_class(content, "bg-background-dark", "bg-slate-50")
    content = replace_class(content, "bg-background-dark/80", "bg-slate-50/80")
    content = replace_class(content, "bg-background-dark/50", "bg-slate-50/50")
    content = replace_class(content, "bg-background-dark/40", "bg-slate-50/50")
    content = replace_class(content, "bg-background-dark/30", "bg-slate-50/50")
    
    content = replace_class(content, "bg-surface-dark", "bg-white")
    content = replace_class(content, "border-border-dark", "border-slate-200")
    
    content = replace_class(content, "text-slate-400", "text-slate-500")
    content = replace_class(content, "text-slate-300", "text-slate-600")
    content = replace_class(content, "text-slate-200", "text-slate-700")
    content = replace_class(content, "text-slate-100", "text-slate-800")
    content = replace_class(content, "text-slate-50", "text-slate-900")

    content = replace_class(content, "bg-slate-800", "bg-slate-100")
    content = replace_class(content, "bg-slate-700/50", "bg-slate-100")
    content = replace_class(content, "bg-slate-700", "bg-slate-200")
    
    content = replace_class(content, "shadow-black/30", "shadow-slate-200/50")

    content = content.replace("rgba(16, 183, 127, 0.08)", "rgba(16, 183, 127, 0.15)")
    content = content.replace("rgba(16, 183, 127, 0.05)", "rgba(16, 183, 127, 0.10)")
    content = content.replace("rgba(16, 183, 127, 0.03)", "rgba(16, 183, 127, 0.05)")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Conversion to Light Mode complete!")
