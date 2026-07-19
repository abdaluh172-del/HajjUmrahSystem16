# -*- coding: utf-8 -*-
"""Keyword lists used only to EXPLAIN a prediction (reason / keywords detected).
The actual classification decision comes from the trained ML model in
train_model.py — this lexicon never overrides the model's prediction.
"""

POSITIVE_WORDS = [
    "ممتاز", "ممتازة", "رائع", "رائعة", "جيد", "جيدة", "سريع", "سريعة",
    "نظيف", "نظيفة", "متعاون", "متعاونين", "مريح", "مريحة", "منظم", "تنظيم",
    "محترم", "محترمين", "شكر", "شكراً", "احترافي", "روحانية", "تسهيل",
    "excellent", "great", "good", "fast", "clean", "helpful", "comfortable",
    "organized", "friendly", "amazing", "professional", "wonderful", "thank",
]

NEGATIVE_WORDS = [
    "ازدحام", "زحمة", "زحام", "سيء", "سيئة", "بطيء", "بطيئة", "تأخير", "تأخر",
    "متسخ", "مشكلة", "مشاكل", "ضعيف", "ضعيفة", "شكوى", "أسوأ", "غير منظم",
    "غير محترم", "فوضى",
    "crowded", "crowding", "bad", "slow", "delay", "delayed", "dirty",
    "problem", "poor", "rude", "disorganized", "worst", "complaint",
]


def find_keywords(text: str):
    """Return (positive_hits, negative_hits) found in the raw text."""
    lower = text.lower()
    pos_hits = [w for w in POSITIVE_WORDS if w in text or w.lower() in lower]
    neg_hits = [w for w in NEGATIVE_WORDS if w in text or w.lower() in lower]
    # de-duplicate while preserving order
    pos_hits = list(dict.fromkeys(pos_hits))
    neg_hits = list(dict.fromkeys(neg_hits))
    return pos_hits, neg_hits
