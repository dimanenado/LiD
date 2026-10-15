import re, json, sys
STATES = {"Baden-Württemberg":"BW","Bayern":"BY","Berlin":"BE","Brandenburg":"BB","Bremen":"HB","Hamburg":"HH","Hessen":"HE","Mecklenburg-Vorpommern":"MV","Niedersachsen":"NI","Nordrhein-Westfalen":"NW","Rheinland-Pfalz":"RP","Saarland":"SL","Sachsen":"SN","Sachsen-Anhalt":"ST","Schleswig-Holstein":"SH","Thüringen":"TH"}
G = ""
lines = open(sys.argv[1], encoding="utf-8").read().split("\n")
qs=[]; state=None; cur=None; page=1
def flush():
    if cur: qs.append(cur)
for ln in lines:
    if "\f" in ln:
        page += ln.count("\f"); ln = ln.replace("\f","")
    s = ln.strip()
    m = re.match(r"Fragen für das Bundesland (.+)$", s)
    if m:
        flush(); cur=None; state=STATES[m.group(1).strip()]; continue
    if re.match(r"Seite \d+ von \d+$", s) or s in ("Teil I","Teil II","Allgemeine Fragen"): continue
    m = re.match(r"Aufgabe (\d+)$", s)
    if m:
        flush()
        n=int(m.group(1))
        cur={"id": f"{state or 'G'}-{n}", "state": state, "number": n, "page": page, "q": [], "options": [], "_inopt": False}
        continue
    if cur is None or not s: 
        if cur is not None and cur["options"]: cur["_inopt"]="done-gap"
        continue
    if s[:1] in (G,"\u25a1"):
        cur["options"].append(s[1:].strip()); cur["_inopt"]=True; continue
    if re.match(r"^(Bild \d\s*)+$", s) and not cur["options"]:
        continue  # caption row under images
    if not cur["options"] and (s.startswith("©") or s.startswith("In Anlehnung") or cur.get("credit")):
        cur["credit"] = (cur.get("credit","") + " " + s).strip(); continue
    if cur["options"] and cur["_inopt"] is True:
        cur["options"][-1] += " " + s
    elif not cur["options"]:
        cur["q"].append(s)
flush()
for q in qs:
    q["q"]=re.sub(r"\s+"," "," ".join(q["q"])).strip()
    q["options"]=[re.sub(r"\s+"," ",o).replace("- ","-") if False else re.sub(r"\s+"," ",o) for o in q["options"]]
    q["imageOptions"] = all(re.fullmatch(r"Bild \d", o) for o in q["options"])
    del q["_inopt"]
bad=[q["id"] for q in qs if len(q["options"])!=4 or not q["q"]]
print(len(qs), "questions; bad:", bad, file=sys.stderr)
print(sum(q["state"] is None for q in qs), "general;", sum(q["imageOptions"] for q in qs), "image-option questions", file=sys.stderr)
json.dump(qs, open(sys.argv[2],"w",encoding="utf-8"), ensure_ascii=False, indent=1)
