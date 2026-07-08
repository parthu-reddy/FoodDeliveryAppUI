with open("src/index.css", "r") as f:
    content = f.read()

content = content.replace(".dark {\n  color: #f0ede6 !important;\n}\n\n.dark * {\n  color: inherit;\n}", "")
content = content.replace(".dark {\n  color: #f0ede6 !important;\n}", "")
content = content.replace(".dark * {\n  color: inherit;\n}", "")

with open("src/index.css", "w") as f:
    f.write(content)

