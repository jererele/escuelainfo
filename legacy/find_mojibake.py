
import re

def find_mojibake(filename):
    with open(filename, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    # regex for non-ascii characters or characters that look like mojibake
    # We'll look for strings that contain \ufffd
    
    lines = content.splitlines()
    for i, line in enumerate(lines):
        if '\ufffd' in line:
            print(f"Line {i+1}: {line.strip()}")
        # Also check for common mojibake patterns from fix.py
        patterns = ['Maana', 'Matemticas', 'lgebra', 'Ingls', 'Fsica', 'Garca', 'Prez', 'Sofa', 'Rodrguez', 'Luca', 'Martnez', 'Lpez', 'Anala', 'estn', 'da', 'sbado', 'mircoles']
        for p in patterns:
            if p in line:
                # print(f"Potential Mojibake Line {i+1}: {line.strip()}")
                pass

if __name__ == "__main__":
    find_mojibake('pagina.html')
