import os
import json
import re

data = {
    "ability": [], "item": [], "trait": [], "skill": [], "familiar": []
}

for category in data.keys():
    filename = f"gachafiles/{category}.txt"
    if not os.path.exists(filename):
        continue
        
    with open(filename, 'r', encoding='utf-8') as f:
        current_item = None
        temp_desc = []
        
        for line in f:
            line = line.strip()
            if not line:
                continue
                
            match = re.match(r'^(\d+)\.(\S*)\s*(.*)', line)
            
            if match:
                if current_item:
                    current_item["description"] = " ".join(temp_desc).strip()
                    data[category].append(current_item)
                    temp_desc = []
                    
                parts = line.split(',')
                if len(parts) >= 2:
                    raw_name = parts[0].split('.', 1)[-1].strip()
                    rarity = float(parts[1].strip())
                    current_item = {"name": raw_name, "rarity": rarity, "description": ""}
                    
                    if len(parts) > 2:
                        temp_desc.append(",".join(parts[2:]).strip())
            else:
                temp_desc.append(line)
                
        if current_item:
            current_item["description"] = " ".join(temp_desc).strip()
            data[category].append(current_item)

with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)
    
print("Successfully created data.json!")