import os
import glob
import re

html_files = glob.glob(r"c:\Users\CHROMEWORLD\Desktop\new\staff_kyc_system\**\*.html", recursive=True)

js_to_inject = """
    document.addEventListener("DOMContentLoaded", function() {
        // Fallback Toast if showToast doesn't exist
        function fallbackToast(message, type="success") {
            if(typeof showToast === "function") {
                try {
                    showToast(message, type);
                    return;
                } catch(e) {}
            }
            // Create mini-toast
            const t = document.createElement("div");
            t.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl text-sm font-bold shadow-2xl z-[9999] transform transition-all translate-y-10 opacity-0 flex items-center gap-2 ${type === "success" ? "bg-primary text-white" : "bg-red-500 text-white"}`;
            t.innerHTML = `<span class="material-symbols-outlined text-lg">${type === 'success' ? 'check_circle' : 'error'}</span><span>${message}</span>`;
            document.body.appendChild(t);
            setTimeout(() => t.classList.remove("translate-y-10", "opacity-0"), 10);
            setTimeout(() => {
                t.classList.add("translate-y-10", "opacity-0");
                setTimeout(() => t.remove(), 300);
            }, 3000);
        }

        // Intercept all '#' links
        document.querySelectorAll('a[href="#"]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                fallbackToast("Backend Action Pending: " + (this.textContent.trim() || 'Link clicked'), "success");
            });
        });

        // Pagination Buttons Interaction
        document.querySelectorAll('button').forEach(btn => {
            const txt = btn.textContent.trim();
            // Numbers 1, 2, 3...
            if(txt.match(/^[0-9]+$/) && btn.parentElement.classList.contains('gap-2')) {
                btn.addEventListener('click', function() {
                    fallbackToast("Fetching Page " + txt + " from database...", "success");
                    // Visual active state swap if applicable
                    this.parentElement.querySelectorAll('button').forEach(b => {
                        if(b.textContent.trim().match(/^[0-9]+$/)) {
                            b.classList.remove('bg-primary', 'text-white');
                            if(!b.classList.contains('text-slate-500')) {
                                b.classList.add('text-slate-500');
                            }
                        }
                    });
                    this.classList.remove('text-slate-500', 'bg-white');
                    this.classList.add('bg-primary', 'text-white');
                });
            }
            
            // Next / Prev Pagination 
            if(txt === 'chevron_left' || txt === 'chevron_right' || txt === 'keyboard_double_arrow_left' || txt === 'keyboard_double_arrow_right') {
                btn.addEventListener('click', function() {
                    fallbackToast("Navigating pages...", "success");
                });
            }
        });

        // Filter / Select dropdowns
        document.querySelectorAll('select').forEach(sel => {
            sel.addEventListener('change', function() {
                fallbackToast("Filtering data by: " + this.value, "success");
            });
        });
        
        // Top right bell icon / notification
        const notifBtn = document.querySelector('button:has(span:contains("notifications"))') || document.querySelector('button span.material-symbols-outlined:contains("notifications")');
        if(notifBtn) {
            notifBtn.parentElement.addEventListener('click', function() {
                fallbackToast("You have 0 unread alerts.");
            });
        }
        
    });
"""

for filepath in html_files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "Fallback Toast" not in content:
        # Inject script right before </body>
        new_content = content.replace("</body>", f"<script>{js_to_inject}</script>\n</body>")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)

print("All elements bound with interactivity!")
