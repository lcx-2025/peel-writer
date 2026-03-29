from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def score_point(point_text, title):
    coverage_score = 0

    point = point_text.strip().lower()
    title = title.strip().lower()

    if len(point) <= 10:
        return 0

    stop_words = {"the", "a", "an", "and", "or", "but", "is", "are", "of", "in", "on", "to", "for", "with"}

    title_words = set(title.split())
    key_title_words = [w for w in title_words if w not in stop_words and len(w) > 2]
    total_keys = len(key_title_words)

    if total_keys > 0:
        matched = sum(1 for w in key_title_words if w in point)
        coverage_percent = matched / total_keys
        coverage_score = 12 * coverage_percent

    clarity_score = 8
    vague = ["writing technique", "important", "shows", "very good", "very interesting"]
    if any(v in point for v in vague):
        clarity_score -= 3

    clarity_score = max(0, clarity_score)
    total = round(coverage_score + clarity_score, 1)
    return min(total, 18)  # 改为 18 分


def score_evidence(text):
    score = 22  # 改为 22
    if not text.strip():
        return 0
    if '"' not in text and "paragraph" not in text.lower():
        score -= 5
    return max(score, 0)


def score_explain(text):
    score = 22  # 改为 22
    if not text.strip():
        return 0
    analyze_words = ["reveal", "suggest", "imply", "highlight", "demonstrate", "explain"]
    if not any(word in text.lower() for word in analyze_words):
        score -= 8
    return max(score, 0)


def score_link(text):
    score = 18  # 改为 18
    if not text.strip():
        return 0
    theme_words = ["theme", "overall", "main idea", "topic", "central"]
    if not any(word in text.lower() for word in theme_words):
        score -= 5
    return max(score, 0)


def score_grammar(point, evidence, explain, link):
    grammar_score = 20
    full_text = (point + " " + evidence + " " + explain + " " + link).lower()

    # 简单语法错误特征
    errors = [
        "i ", "i.", "i,",  # 小写 i
        "dont", "isnt", "cant", "wont", "didnt",  # 缺少 apostrophe
        "he do", "she do", "it do",  # 主谓不一致
        "they doesnt", "it doesnt",
        "gooder", "badder", "more better",  # 比较级错误
        "becuase", "becuse", "teh", "u", "r"  # 常见拼写/简写
    ]

    for err in errors:
        if err in full_text:
            grammar_score -= 2

    # 句子开头小写扣分
    for section in [point, evidence, explain, link]:
        if len(section) > 0 and section[0].islower():
            grammar_score -= 2

    return max(round(grammar_score, 1), 0)


def generate_suggestions(scores):
    suggestions = []
    if scores["point"] < 18:
        suggestions.append("Point: Include key words from title & avoid vague phrases.")
    if scores["evidence"] < 20:
        suggestions.append("Evidence: Add a quotation or specific example.")
    if scores["explain"] < 20:
        suggestions.append("Explain: Use analysis words (reveal, suggest, demonstrate).")
    if scores["link"] < 18:
        suggestions.append("Link: Connect clearly to the main topic/theme.")
    if scores["grammar"] < 18:
        suggestions.append("Grammar: Check capitalization, spelling, and avoid text language (u/r). Use apostrophes correctly.")
    return suggestions


@app.route('/score', methods=['POST'])
def score_peel():
    data = request.get_json()
    title = data.get("title", "")
    point = data.get("point", "")
    evidence = data.get("evidence", "")
    explain = data.get("explain", "")
    link = data.get("link", "")

    scores = {
        "point": score_point(point, title),
        "evidence": score_evidence(evidence),
        "explain": score_explain(explain),
        "link": score_link(link),
        "grammar": score_grammar(point, evidence, explain, link)
    }

    total = sum(scores.values())
    suggestions = generate_suggestions(scores)

    return jsonify({
        "scores": scores,
        "total": round(total, 1),
        "suggestions": suggestions
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)