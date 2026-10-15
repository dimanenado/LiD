import json, sys, os, pymupdf
pdf, qpath, outdir = sys.argv[1:4]
d = pymupdf.open(pdf); qs = json.load(open(qpath, encoding="utf-8")); os.makedirs(outdir, exist_ok=True)
def heads(pg):
    out=[]
    for b in pg.get_text("blocks"):
        t=b[4].strip()
        if t.startswith("Aufgabe ") and t[8:].isdigit(): out.append((b[1], int(t[8:])))
    return sorted(out)
for q in qs:
    pg = d[q["page"]-1]; hs = heads(pg)
    ys = [y for y,n in hs if n==q["number"]]
    assert ys, q["id"]
    y0 = ys[0]; y1 = min([y for y,n in hs if y>y0] + [pg.rect.height])
    imgs = [pymupdf.Rect(i["bbox"]) for i in pg.get_image_info() if i["bbox"][1] > y0 and i["bbox"][1] < y1 and i["bbox"][1] > 130]
    # dedupe identical boxes (image + mask)
    uniq=[]
    for r in imgs:
        if not any(abs(r.x0-u.x0)<1 and abs(r.y0-u.y0)<1 for u in uniq): uniq.append(r)
    uniq.sort(key=lambda r: r.x0)
    if q["imageOptions"]:
        assert len(uniq)==4, (q["id"], len(uniq))
        q["optionImages"]=[]
        for k,r in enumerate(uniq):
            f=f"{q['id']}-{k+1}.png"; pg.get_pixmap(clip=r, dpi=200).save(os.path.join(outdir,f)); q["optionImages"].append(f)
    elif uniq:
        r = uniq[0]
        for u in uniq[1:]: r |= u
        f=f"{q['id']}.png"; pg.get_pixmap(clip=r, dpi=200).save(os.path.join(outdir,f)); q["image"]=f
json.dump(qs, open(qpath,"w",encoding="utf-8"), ensure_ascii=False, indent=1)
print(sum("image" in q for q in qs), "question images;", sum("optionImages" in q for q in qs), "image-option questions")
print([q["id"] for q in qs if "image" in q])
