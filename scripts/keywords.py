"""Build src/data/keywords.json from scripts/keywords.txt.

keywords.txt has one line per question:
  ID|question cues DE|answer cues DE|question cues EN|answer cues EN
Cues are separated by ";" and must be substrings of the text (case-insensitive).
An empty answer field means the whole correct option. State questions (XX-1..10)
follow a fixed template and get their cues from STATE_RULES below.
Lines starting with "~" list look-alike groups: questions that are easy to mix up
but have different answers. State ids may be written as "*-3" for every state.
"""
import json
import re
import sys

Q = json.load(open('src/data/questions.json'))
BY_ID = {q['id']: q for q in Q}
STATES = sorted({q['state'] for q in Q if q['state']})

# number -> (question cues DE, question cues EN, answer cue DE or None, answer cue EN or None)
STATE_RULES = {
    1: (['Wappen'], ['coat of arms'], None, None),
    2: (['Landkreis', 'Bezirk', 'Stadtteil'], ['Landkreis', 'Bezirk', 'Stadtteil'], None, None),
    3: (['wie viele Jahre', 'Landtag', 'Landesparlament'], ['how many years', 'state parliament'], None, None),
    4: (['Alter', 'Kommunalwahlen', 'Bürgerschaft'], ['what age', 'local elections', 'Bürgerschaft'], None, None),
    5: (['Landesflagge'], ['state flag'], None, None),
    6: (['politische Themen'], ['political topics'], ['Landeszentrale', 'Landesbeauftragten'], ['Landeszentrale', 'Landesbeauftragte']),
    7: (['Landeshauptstadt', 'Stadtstaat'], ['state capital', 'city-state'], None, None),
    8: ([], [], None, None),  # the state name, filled in below
    9: (['Regierungschef'], ['head of government'], None, None),
    10: (['Minister', 'Senator'], ['minister', 'senator'], ['Außenministerin/Außenminister', 'Außenbeziehungen'], ['Foreign Affairs', 'External Relations']),
}


def whole(option):
    return option.strip().rstrip('.…').strip()


def present(cues, text):
    return [c for c in cues if c.lower() in text.lower()]


def main(src, out):
    entries, groups, errors = {}, [], []
    for line in open(src, encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'):
            continue
        if line.startswith('~'):
            ids = []
            for t in line[1:].split():
                ids += [f'{s}-{t[2:]}' for s in STATES] if t.startswith('*-') else [t]
            groups.append(ids)
            continue
        qid, qde, ade, qen, aen = line.split('|')
        entries[qid] = (qde, ade, qen, aen)

    result = {}
    for q in Q:
        de_a, en_a = q['de']['options'][q['correct']], q['en']['options'][q['correct']]
        if q['state']:
            rq_de, rq_en, ra_de, ra_en = STATE_RULES[q['number']]
            if q['number'] == 8:
                rq_de = [q['de']['q'].split(' ist ')[-1].rstrip('?').replace('das ', '')]
                rq_en = [q['en']['q'].split(' is ')[-1].rstrip('?').replace('the ', '')]
            k = {
                'q': {'de': present(rq_de, q['de']['q']), 'en': present(rq_en, q['en']['q'])},
                'a': {
                    'de': present(ra_de, de_a) if ra_de else [whole(de_a)],
                    'en': present(ra_en, en_a) if ra_en else [whole(en_a.split(' (')[0])],
                },
            }
        else:
            if q['id'] not in entries:
                errors.append(f"{q['id']}: no entry")
                continue
            qde, ade, qen, aen = entries[q['id']]
            sp = lambda s: [c.strip() for c in s.split(';') if c.strip()]
            k = {
                'q': {'de': sp(qde), 'en': sp(qen)},
                'a': {'de': sp(ade) or [whole(de_a)], 'en': sp(aen) or [whole(en_a)]},
            }
        for part, texts in (('q', (q['de']['q'], q['en']['q'])), ('a', (de_a, en_a))):
            for lang, text in zip(('de', 'en'), texts):
                for c in k[part][lang]:
                    if c.lower() not in text.lower():
                        errors.append(f"{q['id']} {part}.{lang}: {c!r} not in {text!r}")
                if not k[part][lang] and not (part == 'q' and q['state']):
                    errors.append(f"{q['id']} {part}.{lang}: no cues")
        result[q['id']] = k

    # look-alikes: explicit groups plus questions with the same German text but a different answer
    like = {qid: set() for qid in BY_ID}
    by_text = {}
    for q in Q:
        by_text.setdefault(q['de']['q'], []).append(q['id'])
    for g in groups + [ids for ids in by_text.values() if len(ids) > 1]:
        for a in g:
            if a not in BY_ID:
                errors.append(f'look-alike group: unknown id {a}')
                continue
            for b in g:
                if a == b or b not in BY_ID:
                    continue
                qa, qb = BY_ID[a], BY_ID[b]
                if qa['state'] and qb['state']:
                    continue  # different states never meet; same state is not a look-alike here
                if whole(qa['de']['options'][qa['correct']]) == whole(qb['de']['options'][qb['correct']]):
                    continue  # same answer, nothing to confuse
                like[a].add(b)
    order = {q['id']: i for i, q in enumerate(Q)}
    for qid, s in like.items():
        if s:
            result[qid]['like'] = sorted(s, key=order.get)

    if errors:
        print('\n'.join(errors), file=sys.stderr)
        sys.exit(1)
    json.dump(result, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(result)} questions, {sum("like" in v for v in result.values())} with look-alikes -> {out}')


if __name__ == '__main__':
    main(*(sys.argv[1:] or ['scripts/keywords.txt', 'src/data/keywords.json']))
