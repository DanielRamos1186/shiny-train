import os
import json
import re
import subprocess
from datetime import datetime

# Configuration
categories = ["ability", "item", "trait", "skill", "familiar"]
data_dir = "gachafiles"
output_file = "data.json"

def convert_files():
    data = {cat: [] for cat in categories}

    for category in categories:
        filename = os.path.join(data_dir, f"{category}.txt")
        if not os.path.exists(filename):
            print(f"Warning: {filename} not found.")
            continue
            
        with open(filename, 'r', encoding='utf-8') as f:
            current_item = None
            temp_desc = []
            
            for line in f:
                line = line.strip()
                if not line:
                    continue
                
                # Regex to identify the start of a new item (e.g., "1. Tinder,1.3")
                match = re.match(r'^(\d+)\.', line)
                
                if match:
                    # Save the previous item if it exists
                    if current_item:
                        current_item["description"] = " ".join(temp_desc).strip()
                        data[category].append(current_item)
                        temp_desc = []
                    
                    parts = line.split(',')
                    if len(parts) >= 2:
                        # Extract name and rarity
                        raw_name = parts[0].split('.', 1)[-1].strip()
                        try:
                            rarity = float(parts[1].strip())
                            current_item = {"name": raw_name, "rarity": rarity, "description": ""}
                        except ValueError:
                            print(f"Error parsing rarity in line: {line}")
                            current_item = None
                        
                        if len(parts) > 2:
                            temp_desc.append(",".join(parts[2:]).strip())
                else:
                    if current_item:
                        # Strip leading # if present on description lines
                        clean_line = line[1:].strip() if line.startswith("#") else line
                        temp_desc.append(clean_line)
            
            # Save the last item
            if current_item:
                current_item["description"] = " ".join(temp_desc).strip()
                data[category].append(current_item)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    print(f"Successfully updated {output_file}!")

def run_git_commands():
    timestamp = datetime.now().strftime("%Y-%m-%d_%H:%M:%S")
    commit_msg = f"Convert txt files: {timestamp}"

    commands = [
        ["git", "status", "--porcelain"],
        ["git", "add", "-A"],
        ["git", "commit", "-m", commit_msg],
        ["git", "pull", "--rebase", "origin", "master"],
        ["git", "push", "-u", "origin", "master"]
    ]

    for cmd in commands:
        print(f"Executing: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr)
        
        # If commit fails because there's nothing to commit, we should still try to pull/push
        if cmd[1] == "commit" and result.returncode != 0:
            if "nothing to commit" in result.stdout or "nothing to commit" in result.stderr:
                print("Nothing to commit, continuing...")
                continue
            else:
                print(f"Commit failed with error: {result.stderr}")
                # We can choose to continue or break. I'll continue to pull/push if requested.
                continue

if __name__ == "__main__":
    convert_files()
    run_git_commands()
